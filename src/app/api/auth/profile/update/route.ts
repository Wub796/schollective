import { NextResponse } from "next/server";
import { getCurrentUserAndProfile, upsertProfile } from "@/lib/neon/profiles";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { session, user, profile } = await getCurrentUserAndProfile(req.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { role, status, ...safeUpdates } = body;

    let allowedRole: string | undefined = undefined;
    let allowedStatus: string | undefined = undefined;

    const isAdmin = profile?.role === "admin";

    // Non-admins can only set their role if their profile was incomplete (i.e. during onboarding)
    // or if they are explicitly transitioning to professor/student onboarding
    if (role && typeof role === "string") {
      const targetRole = role.trim().toLowerCase();
      if (isAdmin) {
        allowedRole = targetRole;
      } else if (!profile?.profile_complete || profile?.role === "student") {
        if (targetRole === "professor" || targetRole === "student") {
          allowedRole = targetRole;
          // Professors must start with 'pending' status unless already approved by admin
          if (targetRole === "professor") {
            allowedStatus = profile?.status === "approved" ? "approved" : "pending";
          } else {
            allowedStatus = "active";
          }
        }
      }
    }

    if (isAdmin && status && typeof status === "string") {
      allowedStatus = status.trim().toLowerCase();
    }

    const updated = await upsertProfile({
      ...safeUpdates,
      ...(allowedRole ? { role: allowedRole } : {}),
      ...(allowedStatus ? { status: allowedStatus } : {}),
      id: user.id,
      email: user.email,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
