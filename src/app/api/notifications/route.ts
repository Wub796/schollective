import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";

export const dynamic = "force-dynamic";

/** A user's notification list is per-user data; never let a proxy cache it. */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const { session, user } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    // 401 rather than an empty 200: the bell needs to tell "signed out" apart
    // from "nothing to show" so a silently expired session is recoverable.
    return NextResponse.json(
      { notifications: [], error: "Unauthorized" },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  try {
    // `link` is returned under its own name. It was previously aliased to
    // `request_id`, which led the client to prefix an already-complete path and
    // produce `/messages//messages/<id>` for every thread notification.
    const notifications = await runAs(user.id, async () => sql`
      SELECT id, type, title, message as body, read as is_read, link, created_at
      FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 20;
    `);
    return NextResponse.json({ notifications }, { headers: PRIVATE_HEADERS });
  } catch (err: any) {
    console.error("Notifications error:", err);
    return NextResponse.json({ notifications: [], error: "unavailable" }, { headers: PRIVATE_HEADERS });
  }
}
