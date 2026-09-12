import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { AWAITING_PROFESSOR, UNREAD_COUNTABLE, asSqlArray } from "@/lib/status";

export const dynamic = "force-dynamic";

/** Per-user counts; never cacheable by a shared proxy. */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const { session, user, profile } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json(
      { unreadMessages: 0, pendingRequests: 0 },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  try {
    // Scoped to threads the user can still act on. Without the status filter
    // this counted unread messages in declined, closed and admin-deleted
    // threads, producing a sidebar badge the user had no way to clear.
    const unreadMessagesResult = await runAs(user.id, async () => sql`
      SELECT COUNT(*)::int as count
      FROM messages m
      JOIN requests r ON m.request_id = r.id
      WHERE (r.student_id = ${user.id} OR r.professor_id = ${user.id})
        AND r.status = ANY(${asSqlArray(UNREAD_COUNTABLE)})
        AND m.sender_id != ${user.id}
        AND m.read_at IS NULL;
    `);
    const unreadMessages = unreadMessagesResult[0]?.count || 0;

    let pendingRequests = 0;
    if (profile?.role === 'professor') {
      const pendingResult = await runAs(user.id, async () => sql`
        SELECT COUNT(*)::int as count
        FROM requests
        WHERE professor_id = ${user.id}
          AND status = ANY(${asSqlArray(AWAITING_PROFESSOR)});
      `);
      pendingRequests = pendingResult[0]?.count || 0;
    }

    return NextResponse.json({ unreadMessages, pendingRequests }, { headers: PRIVATE_HEADERS });
  } catch (err) {
    console.error("Badges fetch error:", err);
    return NextResponse.json({ unreadMessages: 0, pendingRequests: 0 }, { headers: PRIVATE_HEADERS });
  }
}
