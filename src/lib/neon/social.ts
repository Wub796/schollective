import { sql } from "./db";
import { runAs } from "./user-context";
import { isCanonicalUuid, isValidId } from "@/lib/security";
import { fullName } from "@/lib/people";
import { isMemberStatus, type FriendshipStatus, type MemberStatus } from "@/lib/status";

/**
 * Reads for the social features: friend networks, student cards, relationships
 * and group-thread rosters.
 *
 * Every function runs under the viewer's database identity. A student the
 * viewer is not yet connected to is read through `app_student_cards`, which
 * returns a fixed set of safe columns; a full profile row is only selected for
 * someone `profiles_select` already lets the viewer see (db/migrations/0008).
 */

/** What any student may see about another. Never grades, scores or contact details. */
export interface StudentCard {
  id: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  institution: string | null;
  education_level: string | null;
  major: string | null;
  graduation_year: string | null;
  avatar_url: string | null;
}

export interface FriendEntry {
  friendshipId: string;
  /** When the friendship was accepted, or when the pending request was sent. */
  since: string;
  person: StudentCard;
}

export interface FriendNetwork {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
  blocked: StudentCard[];
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string | Date;
  responded_at: string | Date | null;
}

/**
 * The Neon driver returns a timestamptz column as a Date but the same value
 * inside json_build_object as a string. Props crossing into client components
 * should have one shape.
 */
export function toIso(value: string | Date | null | undefined): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function studentCards(ids: readonly string[]): Promise<Map<string, StudentCard>> {
  const valid = [...new Set(ids)].filter(isValidId);
  if (valid.length === 0) return new Map();
  const rows = (await sql`SELECT * FROM app_student_cards(${valid}::text[]);`) as StudentCard[];
  return new Map(rows.map((row) => [row.id, row]));
}

/** Safe cards for specific students, keyed by id. Missing ids are ones the viewer may not name. */
export async function getStudentCards(viewerId: string, ids: readonly string[]): Promise<Map<string, StudentCard>> {
  return runAs(viewerId, () => studentCards(ids));
}

/**
 * Classmates at the viewer's institution they are not yet connected to — what
 * the friends page shows before anything has been typed into search.
 */
export async function getClassmateSuggestions(userId: string, limit = 6): Promise<StudentCard[]> {
  return runAs(userId, async () => {
    const rows = await sql`SELECT * FROM app_search_students('', ${limit});`;
    return rows as StudentCard[];
  });
}

/** Everyone on the viewer's friends page, bucketed. */
export async function getFriendNetwork(userId: string): Promise<FriendNetwork> {
  return runAs(userId, async () => {
    const [edges, blocks] = (await Promise.all([
      sql`
        SELECT id, requester_id, addressee_id, status, created_at, responded_at
        FROM friendships
        WHERE requester_id = ${userId} OR addressee_id = ${userId}
        ORDER BY COALESCE(responded_at, created_at) DESC;
      `,
      sql`
        SELECT blocked_id
        FROM user_blocks
        WHERE blocker_id = ${userId}
        ORDER BY created_at DESC;
      `,
    ])) as [FriendshipRow[], Array<{ blocked_id: string }>];

    const otherEnd = (edge: FriendshipRow) =>
      edge.requester_id === userId ? edge.addressee_id : edge.requester_id;
    const cards = await studentCards([...edges.map(otherEnd), ...blocks.map((b) => b.blocked_id)]);

    const network: FriendNetwork = { friends: [], incoming: [], outgoing: [], blocked: [] };
    for (const edge of edges) {
      const person = cards.get(otherEnd(edge));
      // No card means the other student is no longer active (suspended, or an
      // account being deleted). Nothing on the page could act on them.
      if (!person) continue;

      const entry: FriendEntry = {
        friendshipId: edge.id,
        since: toIso(edge.responded_at ?? edge.created_at),
        person,
      };
      if (edge.status === "accepted") network.friends.push(entry);
      else if (edge.requester_id === userId) network.outgoing.push(entry);
      else network.incoming.push(entry);
    }

    network.friends.sort((a, b) => fullName(a.person).localeCompare(fullName(b.person)));
    network.blocked = blocks
      .map((block) => cards.get(block.blocked_id))
      .filter((card): card is StudentCard => Boolean(card));

    return network;
  });
}

export interface Relationship {
  friendship: {
    id: string;
    requester_id: string;
    addressee_id: string;
    status: FriendshipStatus;
  } | null;
  /** The viewer has blocked the target. */
  blockedByViewer: boolean;
  /** Either of them has blocked the other. */
  blocked: boolean;
  /** `profiles_select` lets the viewer read the target's full profile row. */
  connected: boolean;
}

export async function getRelationship(viewerId: string, targetId: string): Promise<Relationship> {
  return runAs(viewerId, async () => {
    const rows = await sql`
      SELECT
        (
          SELECT row_to_json(edge)
          FROM (
            SELECT id, requester_id, addressee_id, status
            FROM friendships
            WHERE (requester_id = ${viewerId} AND addressee_id = ${targetId})
               OR (addressee_id = ${viewerId} AND requester_id = ${targetId})
            LIMIT 1
          ) edge
        ) AS friendship,
        EXISTS (
          SELECT 1 FROM user_blocks
          WHERE blocker_id = ${viewerId} AND blocked_id = ${targetId}
        ) AS blocked_by_viewer,
        app_blocked_between(${viewerId}, ${targetId}) AS blocked,
        app_is_connected_to(${targetId}) AS connected;
    `;
    const row = rows[0] ?? {};
    return {
      friendship: row.friendship ?? null,
      blockedByViewer: Boolean(row.blocked_by_viewer),
      blocked: Boolean(row.blocked),
      connected: Boolean(row.connected),
    };
  });
}

export interface ThreadMember extends Pick<
  StudentCard,
  "id" | "first_name" | "last_name" | "preferred_name" | "institution" | "education_level" | "major" | "avatar_url"
> {
  status: MemberStatus;
  invited_at: string;
  responded_at: string | null;
}

/** Every student who has ever been on a group thread, in the order they were invited. */
export async function getThreadMembers(requestId: string, viewerId: string): Promise<ThreadMember[]> {
  if (!isCanonicalUuid(requestId)) return [];
  return runAs(viewerId, async () => {
    const rows = await sql`
      SELECT m.student_id AS id, m.status, m.invited_at, m.responded_at,
             p.first_name, p.last_name, p.preferred_name, p.institution,
             p.education_level, p.major, p.avatar_url
      FROM request_members m
      LEFT JOIN profiles p ON p.id = m.student_id
      WHERE m.request_id = ${requestId}
      -- Collaborators invited together share a timestamp; the id keeps their
      -- order stable from one render to the next.
      ORDER BY m.invited_at ASC, m.student_id ASC;
    `;
    return (rows as any[])
      .filter((row) => isMemberStatus(row.status))
      .map((row) => ({
        ...row,
        invited_at: toIso(row.invited_at),
        responded_at: row.responded_at ? toIso(row.responded_at) : null,
      })) as ThreadMember[];
  });
}

/**
 * Moves the viewer's read position in a thread to now, never backwards — a slow
 * request landing after a newer one must not mark messages unread again.
 *
 * Best-effort: failing to record a read must never stop the thread rendering,
 * so errors are logged rather than thrown.
 */
export async function recordThreadRead(requestId: string, userId: string): Promise<void> {
  if (!isCanonicalUuid(requestId) || !isValidId(userId)) return;
  try {
    await runAs(userId, async () => {
      await sql`
        INSERT INTO thread_reads (request_id, user_id, last_read_at)
        VALUES (${requestId}, ${userId}, now())
        ON CONFLICT (request_id, user_id)
        DO UPDATE SET last_read_at = GREATEST(thread_reads.last_read_at, EXCLUDED.last_read_at);
      `;
    });
  } catch (err) {
    console.error("[thread-read] could not record read position:", err instanceof Error ? err.message : err);
  }
}
