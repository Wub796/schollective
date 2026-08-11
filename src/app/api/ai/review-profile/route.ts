import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { reviewStudentProfile } from "@/lib/ai/profile-reviewer";
import { checkUserAiRateLimit } from "@/lib/ai/guardrails";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit Guard
    const rateCheck = checkUserAiRateLimit(user.id, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI request limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    let bodyData = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body optional
    }

    // Fetch existing profile with maybeSingle to avoid 406/500 errors if user row is absent
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const profileToReview = {
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
      ...profile,
      ...bodyData,
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
