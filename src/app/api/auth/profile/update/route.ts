import { NextResponse } from "next/server";
import { getCurrentUserAndProfile, upsertProfile } from "@/lib/neon/profiles";

export async function POST(req: Request) {
  const { session, user } = await getCurrentUserAndProfile();
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await upsertProfile({
      ...body,
      id: user.id,
      email: user.email,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
