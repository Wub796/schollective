import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { scanContentForSafety } from "@/lib/ai/safety-scanner";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { content, recipientId, action, targetUserId } = body;

    // Admin Action: Account Suspension
    if (action === "suspend") {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const adminClient = createAdminClient();
      
      // Verify performing user has admin privileges
      const { data: adminProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (adminProfile?.role !== "admin") {
        return NextResponse.json({ error: "Access denied: Admin privileges required." }, { status: 403 });
      }

      if (!targetUserId) {
        return NextResponse.json({ error: "targetUserId is required for suspension" }, { status: 400 });
      }

      // Update target profile status using service-role admin client (bypasses RLS)
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          status: "suspended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (updateError) {
        console.error("[POST /api/ai/moderate] Admin update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "User suspended successfully" });
    }

    // Standard Safety Content Scan
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content string is required" }, { status: 400 });
    }

    const result = await scanContentForSafety(content, {
      senderId: user?.id,
      recipientId,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[POST /api/ai/moderate] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze content safety" },
      { status: 500 }
    );
  }
}
