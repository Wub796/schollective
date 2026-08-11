import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recommendProfessors } from "@/lib/ai/recommender";
import { checkUserAiRateLimit } from "@/lib/ai/guardrails";

export async function GET() {
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
        { error: `AI recommendation limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    // 1. Fetch current student profile (safe fallback if single fails)
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const safeStudent = studentProfile || {
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
    };

    // 2. Fetch professor candidates from profiles table with resilient schema fallback
    let professors: any[] = [];
    let { data: primaryProfs, error: primaryErr } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, preferred_name, institution, department, academic_title, expertise_fields, is_accepting_requests, bio, lab_website, publications, status, role")
      .eq("role", "professor")
      .eq("status", "approved")
      .limit(30);

    if (primaryErr) {
      console.warn("[GET /api/ai/recommendations] Primary column query warning, attempting schema fallback query:", primaryErr.message);
      // Fallback query requesting core guaranteed columns
      const { data: fallbackProfs, error: fallbackErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, institution, expertise_fields, status, role")
        .eq("role", "professor")
        .limit(30);

      if (fallbackErr) {
        console.error("[GET /api/ai/recommendations] Fallback query error:", fallbackErr);
        return NextResponse.json({ success: true, recommendations: [] });
      }
      professors = fallbackProfs || [];
    } else {
      professors = primaryProfs || [];
    }

    // 3. Compute AI recommendations
    const result = await recommendProfessors(safeStudent, professors);

    // 4. Enrich recommendations with professor metadata
    const profMap = new Map(professors.map((p) => [p.id, p]));
    const enrichedRecommendations = result.recommendations.map((rec) => {
      const prof = profMap.get(rec.professorId);
      return {
        ...rec,
        professor: prof
          ? {
              id: prof.id,
              name: `Prof. ${prof.first_name || ""} ${prof.last_name || ""}`.trim(),
              institution: prof.institution || "Academic Faculty",
              department: prof.department || "",
              expertise_fields: prof.expertise_fields || [],
              is_accepting_requests: prof.is_accepting_requests ?? true,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      recommendations: enrichedRecommendations.filter((r) => r.professor !== null),
      generatedAt: result.generatedAt,
    });
  } catch (err: any) {
    console.error("[GET /api/ai/recommendations] Unexpected error:", err);
    // Always return clean JSON response instead of crashing backend
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate recommendations", recommendations: [] },
      { status: 500 }
    );
  }
}
