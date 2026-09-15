import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { scanContentForSafety } from "@/lib/ai/safety-scanner";
import { checkRateLimit, getClientIp, sanitiseText, isValidId, LIMITS } from "@/lib/security";
import { internalError } from "@/lib/utils";

/**
 * AI content-safety scan for signed-in users.
 *
 * This route also used to accept `{ action: "suspend" }` from admins. That was a
 * second, weaker copy of the suspendUser admin action: it updated only one table
 * and had no guard against an admin suspending themselves. Suspension now goes
 * through src/app/admin/dashboard/admin-actions.ts alone.
 */
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

    // The scan costs a paid Gemini call, so it must not be invokable by
    // anonymous visitors — only authenticated users may scan content.
    const { user } = await getCurrentUserAndProfile(req.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { content, recipientId } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content string is required" }, { status: 400 });
    }

    const sanitisedContent = sanitiseText(content, LIMITS.messageContent);
    if (!sanitisedContent) {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
    }

    const validatedRecipientId = typeof recipientId === "string" && isValidId(recipientId)
      ? recipientId
      : undefined;

    const result = await scanContentForSafety(sanitisedContent, {
      senderId: user.id,
      recipientId: validatedRecipientId,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { error: internalError("ai/moderate", err, "Failed to analyze content safety.") },
      { status: 500 }
    );
  }
}
