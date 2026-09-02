"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { requireStudentActor } from "@/lib/authz";
import { checkRateLimit, isValidId, sanitiseText, LIMITS } from "@/lib/security";
import { checkDurableRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { captureServerEvent } from "@/lib/posthog-server";
import { internalError } from "@/lib/utils";
import { friendshipStateFor, fullName, type FriendshipState } from "@/lib/people";
import type { StudentCard } from "@/lib/neon/social";

/**
 * Friend requests, the friends list and blocking.
 *
 * Every action is keyed by the OTHER student's id rather than a friendship id:
 * the screens that call these (search results, a profile, a request row) all
 * know who the person is, and resolving the edge server-side means a stale tab
 * can never act on a friendship that has since changed hands or disappeared.
 *
 * Only students write the social graph (`requireStudentActor`); the database
 * repeats every rule here in db/migrations/0008.
 */

const FRIEND_REQUESTS_PER_DAY = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const SEARCHES_PER_MINUTE = 40;

export type SearchResult = StudentCard & { state: FriendshipState };

type ActionResult = { success: true; state?: FriendshipState } | { error: string };

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === "23505";
}

function revalidateNetwork(studentId: string, viewerId: string) {
  revalidatePath("/friends");
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/students/${viewerId}`);
}

export async function searchStudents(query: string): Promise<{ results: SearchResult[] } | { error: string }> {
  const auth = await requireStudentActor();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  // Search runs on debounced keystrokes, so it takes the per-isolate limiter:
  // enough to stop a script paging through every student, without adding a
  // database round trip to each character typed.
  const rate = checkRateLimit(`student-search:${user.id}`, SEARCHES_PER_MINUTE, 60 * 1000);
  if (!rate.allowed) {
    return { error: `You're searching too quickly. Try again in ${rate.retryAfterSeconds}s.` };
  }

  // One character matches half the directory and tells nobody anything.
  const term = sanitiseText(query, LIMITS.searchQuery);
  if (term.length === 1) return { results: [] };

  try {
    return await runAs(user.id, async () => {
      const cards = (await sql`SELECT * FROM app_search_students(${term}, 20);`) as StudentCard[];
      if (cards.length === 0) return { results: [] };

      const ids = cards.map((card) => card.id);
      const edges = (await sql`
        SELECT requester_id, addressee_id, status
        FROM friendships
        WHERE (requester_id = ${user.id} AND addressee_id = ANY(${ids}::text[]))
           OR (addressee_id = ${user.id} AND requester_id = ANY(${ids}::text[]));
      `) as Array<{ requester_id: string; addressee_id: string; status: "pending" | "accepted" }>;

      const edgeWith = new Map(
        edges.map((edge) => [edge.requester_id === user.id ? edge.addressee_id : edge.requester_id, edge]),
      );
      return {
        results: cards.map((card) => ({ ...card, state: friendshipStateFor(edgeWith.get(card.id), user.id) })),
      };
    });
  } catch (err) {
    return { error: internalError("searchStudents", err, "Search is unavailable right now.") };
  }
}

export async function sendFriendRequest(studentId: string): Promise<ActionResult> {
  if (!isValidId(studentId)) return { error: "Invalid student." };

  const auth = await requireStudentActor();
  if (!auth.ok) return { error: auth.error };
  const { user, profile } = auth;
  if (studentId === user.id) return { error: "You can't send a friend request to yourself." };

  try {
    return await runAs(user.id, async () => {
      const [existing] = (await sql`
        SELECT id, requester_id, status
        FROM friendships
        WHERE (requester_id = ${user.id} AND addressee_id = ${studentId})
           OR (addressee_id = ${user.id} AND requester_id = ${studentId})
        LIMIT 1;
      `) as Array<{ id: string; requester_id: string; status: "pending" | "accepted" }>;

      // Clicking "Add friend" twice, or in two tabs, is not an error.
      if (existing?.status === "accepted") return { success: true as const, state: "friends" as const };
      if (existing?.requester_id === user.id) return { success: true as const, state: "outgoing" as const };
      // They already asked. Adding them back answers that request rather than
      // bouncing off the one-edge-per-pair index.
      if (existing) return acceptFrom(studentId, user.id, fullName(profile));

      const rate = await checkDurableRateLimit("friend-request", user.id, FRIEND_REQUESTS_PER_DAY, DAY_MS);
      if (!rate.allowed) {
        return { error: "You've sent a lot of friend requests today. Try again tomorrow." };
      }

      // One answer for blocked, suspended, not-a-student and unfinished accounts
      // alike, so the action cannot be used to learn which applies.
      const [target] = await sql`SELECT app_is_discoverable_student(${studentId}) AS ok;`;
      if (!target?.ok) return { error: "That student can't receive friend requests." };

      try {
        await sql`INSERT INTO friendships (requester_id, addressee_id) VALUES (${user.id}, ${studentId});`;
      } catch (err) {
        // Both students pressed "Add friend" at the same moment; the other
        // insert won. A refresh shows the request waiting for them to accept.
        if (isUniqueViolation(err)) return { success: true as const, state: "incoming" as const };
        throw err;
      }

      await createNotification({
        actorId: user.id,
        userId: studentId,
        type: "friend_request",
        title: `${fullName(profile)} sent you a friend request`,
        link: "/friends",
      });
      await captureServerEvent(user.id, "friend_request_sent", { student_id: studentId });
      revalidateNetwork(studentId, user.id);
      return { success: true as const, state: "outgoing" as const };
    });
  } catch (err) {
    return { error: internalError("sendFriendRequest", err, "Failed to send friend request.") };
  }
}

/** Runs inside the addressee's runAs. */
async function acceptFrom(requesterId: string, addresseeId: string, addresseeName: string): Promise<ActionResult> {
  const updated = await sql`
    UPDATE friendships
    SET status = 'accepted', responded_at = now()
    WHERE requester_id = ${requesterId} AND addressee_id = ${addresseeId} AND status = 'pending'
    RETURNING id;
  `;
  if (!updated[0]) return { error: "That friend request is no longer pending." };

  await createNotification({
    actorId: addresseeId,
    userId: requesterId,
    type: "friend_accepted",
    title: `${addresseeName} accepted your friend request`,
    link: `/students/${addresseeId}`,
  });
  await captureServerEvent(addresseeId, "friend_request_accepted", { student_id: requesterId });
  revalidateNetwork(requesterId, addresseeId);
  return { success: true, state: "friends" };
}

export async function respondToFriendRequest(
  studentId: string,
  decision: "accept" | "decline",
): Promise<ActionResult> {
  if (!isValidId(studentId)) return { error: "Invalid student." };
  if (decision !== "accept" && decision !== "decline") return { error: "Invalid response." };

  const auth = await requireStudentActor();
  if (!auth.ok) return { error: auth.error };
  const { user, profile } = auth;

  try {
    return await runAs(user.id, async () => {
      if (decision === "accept") return acceptFrom(studentId, user.id, fullName(profile));

      // Declining deletes the request and tells nobody.
      await sql`
        DELETE FROM friendships
        WHERE requester_id = ${studentId} AND addressee_id = ${user.id} AND status = 'pending';
      `;
      revalidateNetwork(studentId, user.id);
      return { success: true as const, state: "none" as const };
    });
  } catch (err) {
    return { error: internalError("respondToFriendRequest", err, "Failed to respond to friend request.") };
  }
}

export async function cancelFriendRequest(studentId: string): Promise<ActionResult> {
  if (!isValidId(studentId)) return { error: "Invalid student." };

  const auth = await requireStudentActor();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  try {
    await runAs(user.id, async () => {
      await sql`
        DELETE FROM friendships
        WHERE requester_id = ${user.id} AND addressee_id = ${studentId} AND status = 'pending';
      `;
    });
    revalidateNetwork(studentId, user.id);
    return { success: true, state: "none" };
  } catch (err) {
    return { error: internalError("cancelFriendRequest", err, "Failed to cancel friend request.") };
  }
}

export async function removeFriend(studentId: string): Promise<ActionResult> {
  if (!isValidId(studentId)) return { error: "Invalid student." };

  const auth = await requireStudentActor();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  try {
    await runAs(user.id, async () => {
      await sql`
        DELETE FROM friendships
        WHERE status = 'accepted'
          AND ((requester_id = ${user.id} AND addressee_id = ${studentId})
            OR (addressee_id = ${user.id} AND requester_id = ${studentId}));
      `;
    });
    revalidateNetwork(studentId, user.id);
    return { success: true, state: "none" };
  } catch (err) {
    return { error: internalError("removeFriend", err, "Failed to remove friend.") };
  }
}

/**
 * Blocks a student: ends any friendship or pending request between the two, and
 * withdraws pending group invites in both directions. A group thread both are
 * already participating in is left alone — it belongs to its professor and the
 * other students too — and either of them can still leave or be removed.
 */
export async function blockStudent(studentId: string): Promise<ActionResult> {
  if (!isValidId(studentId)) return { error: "Invalid student." };

  const auth = await requireStudentActor();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;
  if (studentId === user.id) return { error: "You can't block yourself." };

  try {
    return await runAs(user.id, async () => {
      // Only a student the blocker can already name: someone they could find,
      // someone on a friendship with them, or someone they have blocked before.
      const [card] = await sql`SELECT id FROM app_student_cards(ARRAY[${studentId}]::text[]);`;
      if (!card) return { error: "That student could not be found." };

      await sql`
        INSERT INTO user_blocks (blocker_id, blocked_id)
        VALUES (${user.id}, ${studentId})
        ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
      `;
      await sql`
        DELETE FROM friendships
        WHERE (requester_id = ${user.id} AND addressee_id = ${studentId})
           OR (addressee_id = ${user.id} AND requester_id = ${studentId});
      `;
      // Invites they sent the blocker…
      await sql`
        UPDATE request_members
        SET status = 'declined', responded_at = now()
        WHERE student_id = ${user.id}
          AND status = 'invited'
          AND request_id IN (SELECT id FROM requests WHERE student_id = ${studentId});
      `;
      // …and invites the blocker sent them.
      await sql`
        UPDATE request_members
        SET status = 'removed', responded_at = now()
        WHERE student_id = ${studentId}
          AND status = 'invited'
          AND request_id IN (SELECT id FROM requests WHERE student_id = ${user.id});
      `;

      await captureServerEvent(user.id, "student_blocked", { student_id: studentId });
      revalidateNetwork(studentId, user.id);
      revalidatePath("/threads");
      return { success: true as const, state: "none" as const };
    });
  } catch (err) {
    return { error: internalError("blockStudent", err, "Failed to block student.") };
  }
}

export async function unblockStudent(studentId: string): Promise<ActionResult> {
  if (!isValidId(studentId)) return { error: "Invalid student." };

  const auth = await requireStudentActor();
  if (!auth.ok) return { error: auth.error };
  const { user } = auth;

  try {
    await runAs(user.id, async () => {
      await sql`DELETE FROM user_blocks WHERE blocker_id = ${user.id} AND blocked_id = ${studentId};`;
    });
    revalidateNetwork(studentId, user.id);
    return { success: true, state: "none" };
  } catch (err) {
    return { error: internalError("unblockStudent", err, "Failed to unblock student.") };
  }
}
