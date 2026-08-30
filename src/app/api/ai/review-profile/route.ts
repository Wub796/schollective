import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { reviewStudentProfile } from "@/lib/ai/profile-reviewer";
import { checkUserAiRateLimit, sanitizeAiPromptInput } from "@/lib/ai/guardrails";
import { checkRateLimit, getClientIp } from "@/lib/security";

export async function POST(req: Request) {
  try {
    // ── Rate limit: 5 per minute per IP ──────────────────────────
    const ip = getClientIp(req);
    const rate = checkRateLimit(`review:${ip}`, 5, 60 * 1000, true);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { user, profile } = await getCurrentUserAndProfile();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User-specific AI rate limit (stricter — 10 per 10 min)
    const rateCheck = checkUserAiRateLimit(user.id, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI request limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    let bodyData: Record<string, unknown> = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body optional — profile can be fetched from DB
    }

    // Sanitise any user-supplied profile fields
    const sanitisedBody: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(bodyData)) {
      if (typeof value === "string") {
        sanitisedBody[key] = sanitizeAiPromptInput(value, 500);
      } else {
        sanitisedBody[key] = value;
      }
    }

    const profileToReview = {
      id: user.id,
      email: user.email,
      first_name: "",
      last_name: "",
      ...profile,
      ...sanitisedBody,
    };

    const review = await reviewStudentProfile(profileToReview);
    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    console.error("[POST /api/ai/review-profile] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to review profile" },
      { status: 500 }
    );
  }
}