import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { givenName, initialsOf } from "@/lib/people";

export const dynamic = "force-dynamic";

/** A user's notification list is per-user data; never let a proxy cache it. */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const { session, user, profile } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    // 401 rather than an empty 200: the client needs to tell "signed out" apart
    // from "nothing to show" so a silently expired session is recoverable — and
    // so the feed stops polling instead of asking again every fifteen seconds.
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

    // Who the reader is, returned with their own notifications so the island can
    // be personal without a second request or a prop drilled through every
    // layout between here and it. Deliberately just the three things a
    // notification surface needs; the profile itself stays on the server.
    //
    // A name is only sent when the account has one on file: `givenName` would
    // otherwise answer "Student", and a card that greets somebody as "Student"
    // is worse than one that greets nobody.
    const viewer = {
      name: profile ? givenName(profile, "") || null : null,
      initials: profile ? initialsOf(profile) : null,
      avatarUrl: profile?.avatar_url ?? null,
      role: profile?.role ?? "student",
    };

    return NextResponse.json({ notifications, viewer }, { headers: PRIVATE_HEADERS });
  } catch (err: any) {
    console.error("Notifications error:", err);
    return NextResponse.json({ notifications: [], error: "unavailable" }, { headers: PRIVATE_HEADERS });
  }
}
