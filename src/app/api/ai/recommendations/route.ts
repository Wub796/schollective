import { NextResponse } from "next/server";
import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { recommendProfessors } from "@/lib/ai/recommender";
import { checkUserAiRateLimit } from "@/lib/ai/guardrails";
import { checkRateLimit, getClientIp } from "@/lib/security";

export async function GET(req: Request) {
  try {
    // ── Rate limit: 5 per minute per IP ──────────────────────────
    const ip = getClientIp(req);
    const rate = checkRateLimit(`recs:${ip}`, 5, 60 * 1000, true);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const { user, profile: studentProfile } = await getCurrentUserAndProfile();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User-specific AI rate limit
    const rateCheck = checkUserAiRateLimit(user.id, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI recommendation limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const safeStudent = studentProfile || {
      id: user.id,
      email: user.email,
      first_name: "",
      last_name: "",
    };

    const professors = await sql`
      SELECT id, first_name, last_name, preferred_name, institution, department, academic_title, expertise_fields, is_accepting_requests, bio, lab_website, publications, status, role
      FROM profiles
      WHERE role = 'professor' AND status = 'approved'
      LIMIT 30;
    `;

    const result = await recommendProfessors(safeStudent, professors);

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
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate recommendations", recommendations: [] },
      { status: 500 }
    );
  }
}