import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { session, user } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json({ notifications: [] });
  }

  try {
    const notifications = await runAs(user.id, async () => sql`
      SELECT id, type, title, message as body, read as is_read, link as request_id, created_at
      FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 20;
    `);
    return NextResponse.json({ notifications });
  } catch (err: any) {
    console.error("Notifications error:", err);
    return NextResponse.json({ notifications: [] });
  }
}
