import { NextResponse } from "next/server";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
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

    const { user, profile: adminProfile } = await getCurrentUserAndProfile();

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

      if (adminProfile?.role !== "admin") {
        return NextResponse.json({ error: "Access denied: Admin privileges required." }, { status: 403 });
      }

      if (!isValidUuid(targetUserId)) {
        return NextResponse.json({ error: "targetUserId must be a valid UUID" }, { status: 400 });
      }

      // Body already read above, which severs the ambient request context —
      // apply the admin identity explicitly so the RLS admin branch engages.
      await runAs(user.id, async () => {
        await sql`
          UPDATE profiles
          SET status = 'suspended', updated_at = now()
          WHERE id = ${targetUserId as string};
        `;
      });

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