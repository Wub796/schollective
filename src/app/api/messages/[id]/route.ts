import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { getThreadAccess } from "@/lib/authz";
import { isValidId } from "@/lib/security";
import { sql } from "@/lib/neon/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: requestId } = await params;
  const { session, user } = await getCurrentUserAndProfile(req.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isValidId(requestId)) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }

  try {
    // A thread is private to its two participants. Being signed in is not
    // enough — without this check any user could read any conversation by id.
    const { request, isParticipant } = await getThreadAccess(requestId, user.id);
    if (!request || !isParticipant) {
      // Same answer either way, so the endpoint cannot be used to discover
      // which thread ids exist.
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await sql`
      SELECT id, content, sender_id, created_at
      FROM messages
      WHERE request_id = ${requestId}
      ORDER BY created_at ASC;
    `;

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("[messages] Fetch error:", err);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}
