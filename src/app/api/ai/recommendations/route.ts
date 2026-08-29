import { NextResponse } from "next/server";
import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { recommendProfessors } from "@/lib/ai/recommender";
import { checkDurableRateLimit } from "@/lib/rate-limit";
import { checkRateLimit, getClientIp } from "@/lib/security";
import type { ProfessorCandidate } from "@/lib/ai/recommender";
import { internalError } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRIVATE_JSON_HEADERS = {
  "Cache-Control": "private, no-store",
};

export async function GET(req: Request) {
  try {
    // ── Rate limit: 5 per minute per IP ──────────────────────────
    const ip = getClientIp(req);
    const rate = checkRateLimit(`recs:${ip}`, 5, 60 * 1000, true);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        {
          status: 429,
          headers: { ...PRIVATE_JSON_HEADERS, "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }

    const { user, profile: studentProfile } = await getCurrentUserAndProfile(req.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_JSON_HEADERS });
    }

    // Durable (DB) window shared across isolates, with the in-memory limiter
    // as automatic fallback when the DB check cannot run.
    const rateCheck = await checkDurableRateLimit("ai_recommendations", user.id, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI recommendation limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: { ...PRIVATE_JSON_HEADERS, "Retry-After": String(rateCheck.retryAfterSeconds) },
        },
      );
    }

    const safeStudent = studentProfile || {
      id: user.id,
      email: user.email,
      first_name: "",
      last_name: "",
    };

    const professors = (await sql`
      SELECT id, first_name, last_name, preferred_name, institution, department, academic_title, expertise_fields, is_accepting_requests, bio, lab_website, publications, status, role
      FROM profiles
      WHERE role = 'professor' AND status = 'approved'
      ORDER BY updated_at DESC, last_name ASC, id ASC
      LIMIT 30;
    `) as ProfessorCandidate[];

    const result = await recommendProfessors(safeStudent, professors);

    const profMap = new Map(professors.map((p) => [p.id, p]));
    const enrichedRecommendations = result.recommendations.map((rec) => {
      const prof = profMap.get(rec.professorId);
      return {
        ...rec,
        professor: prof
          ? {
              id: prof.id,
              name: `Prof. ${prof.preferred_name || prof.first_name || ""} ${prof.last_name || ""}`.trim(),
              institution: prof.institution || "Academic Faculty",
              department: prof.department || "",
              expertise_fields: prof.expertise_fields || [],
              is_accepting_requests: prof.is_accepting_requests !== false,
            }
          : null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        recommendations: enrichedRecommendations.filter((r) => r.professor !== null),
        generatedAt: result.generatedAt,
      },
      { headers: PRIVATE_JSON_HEADERS },
    );
  } catch (error: any) {
    console.error("[GET /api/ai/recommendations] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: internalError("ai/recommendations", error, "Failed to generate recommendations."), recommendations: [] },
      { status: 500, headers: PRIVATE_JSON_HEADERS },
    );
  }
}
