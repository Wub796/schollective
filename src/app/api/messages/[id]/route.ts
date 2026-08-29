import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: requestId } = await params;
  const { session, user } = await getCurrentUserAndProfile();
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await sql`
      SELECT id, content, sender_id, created_at
      FROM messages
      WHERE request_id = ${requestId}
      ORDER BY created_at ASC;
    `;

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("Messages fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
