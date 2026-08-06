import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { session, user, profile } = await getCurrentUserAndProfile(request.headers);
  if (!session || !user) {
    return NextResponse.json({ authenticated: false, profile: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user, profile });
}
