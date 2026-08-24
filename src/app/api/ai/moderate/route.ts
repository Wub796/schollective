import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { scanContentForSafety } from "@/lib/ai/safety-scanner";
import { checkRateLimit, getClientIp, sanitiseText, isValidUuid, LIMITS } from "@/lib/security";

export async function POST(req: Request) {
  try {
    // ── Rate limit: 10 per minute per IP ─────────────────────────
    const ip = getClientIp(req);
    const rate = checkRateLimit(`moderate:${ip}`, 10, 60 * 1000, true);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { content, recipientId, action, targetUserId } = body;

    // Admin Action: Account Suspension
    if (action === "suspend") {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const adminClient = createAdminClient();

      const { data: adminProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (adminProfile?.role !== "admin") {
        return NextResponse.json({ error: "Access denied: Admin privileges required." }, { status: 403 });
      }

      if (!isValidUuid(targetUserId)) {
        return NextResponse.json({ error: "targetUserId must be a valid UUID" }, { status: 400 });
      }

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          status: "suspended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId as string);

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

    const sanitisedContent = sanitiseText(content, LIMITS.messageContent);
    if (!sanitisedContent) {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
    }

    // Validate recipientId if provided
    const validatedRecipientId = recipientId && typeof recipientId === "string" && isValidUuid(recipientId)
      ? recipientId
      : undefined;

    const result = await scanContentForSafety(sanitisedContent, {
      senderId: user?.id,
      recipientId: validatedRecipientId,
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