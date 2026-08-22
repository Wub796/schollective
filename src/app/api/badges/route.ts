import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { session, user, profile } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json({ unreadMessages: 0, pendingRequests: 0 });
  }

  try {
    const unreadMessagesResult = await runAs(user.id, async () => sql`
      SELECT COUNT(*)::int as count
      FROM messages m
      JOIN requests r ON m.request_id = r.id
      WHERE (r.student_id = ${user.id} OR r.professor_id = ${user.id})
        AND m.sender_id != ${user.id}
        AND m.read_at IS NULL;
    `);
    const unreadMessages = unreadMessagesResult[0]?.count || 0;

    let pendingRequests = 0;
    if (profile?.role === 'professor') {
      const pendingResult = await runAs(user.id, async () => sql`
        SELECT COUNT(*)::int as count
        FROM requests
        WHERE professor_id = ${user.id} AND status = 'pending';
      `);
      pendingRequests = pendingResult[0]?.count || 0;
    }

    return NextResponse.json({ unreadMessages, pendingRequests });
  } catch (err) {
    console.error("Badges fetch error:", err);
    return NextResponse.json({ unreadMessages: 0, pendingRequests: 0 });
  }
}
