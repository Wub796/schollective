import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";

export async function GET() {
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session || !user) {
    return NextResponse.json({ authenticated: false, profile: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user, profile });
}
