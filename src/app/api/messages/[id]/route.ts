import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { requireParticipant } from "@/lib/authz";
import { isValidId } from "@/lib/security";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { recordThreadRead } from "@/lib/neon/social";

export const dynamic = "force-dynamic";

/** A conversation is per-user data; never let a proxy cache it. */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: requestId } = await params;
  const { session, user } = await getCurrentUserAndProfile(req.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_HEADERS });
  }

  if (!isValidId(requestId)) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  try {
    // A thread is private to the people on it — its lead, its professor and the
    // students who have joined. Being signed in is not enough: without this
    // check any user could read any conversation by id. requireParticipant also
    // hides a thread an admin has soft-deleted, which this poll used to keep
    // serving to both participants.
    const access = await requireParticipant(requestId, user.id);
    if (!access.ok) {
      // Same answer either way, so the endpoint cannot be used to discover
      // which thread ids exist.
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: PRIVATE_HEADERS });
    }

    const messages = await runAs(user.id, async () => sql`
      SELECT id, content, sender_id, created_at
      FROM messages
      WHERE request_id = ${requestId}
      ORDER BY created_at ASC;
    `);

    // ChatThread only polls while the thread is on screen, so each poll is the
    // viewer reading it. Without this, messages that arrive while the thread is
    // open would badge as unread until the page was reloaded.
    await recordThreadRead(requestId, user.id);

    return NextResponse.json({ messages }, { headers: PRIVATE_HEADERS });
  } catch (err: any) {
    console.error("[messages] Fetch error:", err);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
