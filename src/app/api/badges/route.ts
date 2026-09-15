import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { AWAITING_PROFESSOR, OPEN_TO_MEMBERS, UNREAD_COUNTABLE, asSqlArray } from "@/lib/status";

export const dynamic = "force-dynamic";

/** Per-user counts; never cacheable by a shared proxy. */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

const NO_BADGES = { unreadMessages: 0, pendingRequests: 0, friendRequests: 0, groupInvites: 0 };

export async function GET(request: NextRequest) {
  const { session, user, profile } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json(NO_BADGES, { status: 401, headers: PRIVATE_HEADERS });
  }

  try {
    const badges = await runAs(user.id, async () => {
      // Counted from the user's own read position (thread_reads), not
      // messages.read_at: on a group thread one member reading must not clear
      // everyone else's badge. Scoped to threads the user can still post in —
      // without the status filter this counted unread messages in declined,
      // closed and admin-deleted threads, a badge the user had no way to clear.
      const unreadRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM messages m
        JOIN requests r ON r.id = m.request_id
        LEFT JOIN thread_reads tr ON tr.request_id = r.id AND tr.user_id = ${user.id}
        WHERE r.status = ANY(${asSqlArray(UNREAD_COUNTABLE)})
          AND (
            r.student_id = ${user.id}
            OR r.professor_id = ${user.id}
            OR EXISTS (
              SELECT 1 FROM request_members rm
              WHERE rm.request_id = r.id AND rm.student_id = ${user.id} AND rm.status = 'joined'
            )
          )
          AND m.sender_id <> ${user.id}
          AND m.created_at > COALESCE(tr.last_read_at, '-infinity'::timestamptz);
      `;

      let pendingRequests = 0;
      if (profile?.role === "professor") {
        const pendingRows = await sql`
          SELECT COUNT(*)::int AS count
          FROM requests
          WHERE professor_id = ${user.id}
            AND status = ANY(${asSqlArray(AWAITING_PROFESSOR)});
        `;
        pendingRequests = pendingRows[0]?.count || 0;
      }

      let friendRequests = 0;
      let groupInvites = 0;
      if (profile?.role === "student") {
        // Both counts match exactly what the friends and threads pages render —
        // a request from a now-suspended student, or an invite to a request that
        // has since closed, is not shown there, so it must not badge here.
        const socialRows = await sql`
          SELECT
            (
              SELECT COUNT(*)::int
              FROM friendships f
              JOIN profiles requester ON requester.id = f.requester_id
              WHERE f.addressee_id = ${user.id}
                AND f.status = 'pending'
                AND requester.status = 'active'
            ) AS friend_requests,
            (
              SELECT COUNT(*)::int
              FROM request_members m
              JOIN requests r ON r.id = m.request_id
              WHERE m.student_id = ${user.id}
                AND m.status = 'invited'
                AND r.status = ANY(${asSqlArray(OPEN_TO_MEMBERS)})
            ) AS group_invites;
        `;
        friendRequests = socialRows[0]?.friend_requests || 0;
        groupInvites = socialRows[0]?.group_invites || 0;
      }

      return {
        unreadMessages: unreadRows[0]?.count || 0,
        pendingRequests,
        friendRequests,
        groupInvites,
      };
    });

    return NextResponse.json(badges, { headers: PRIVATE_HEADERS });
  } catch (err) {
    console.error("Badges fetch error:", err);
    return NextResponse.json(NO_BADGES, { headers: PRIVATE_HEADERS });
  }
}
