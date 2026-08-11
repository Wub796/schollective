import { getGeminiClient } from "./client";
import { ProfessorMatch, RecommenderResult } from "./types";
import { StudentProfileData } from "./profile-reviewer";
import { truncatePromptText, getCachedAiResult, setCachedAiResult } from "./guardrails";

export interface ProfessorCandidate {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  institution?: string | null;
  department?: string | null;
  expertise_fields?: string[] | string | null;
  is_accepting_requests?: boolean | null;
  bio?: string | null;
}

/**
 * Recommends top matching professors for a given student profile with token guardrails.
 */
export async function recommendProfessors(
  student: StudentProfileData,
  candidates: ProfessorCandidate[]
): Promise<RecommenderResult> {
  if (candidates.length === 0) {
    return {
      recommendations: [],
      generatedAt: new Date().toISOString(),
      totalEvaluated: 0,
    };
  }

  // Check TTL Cache to prevent burning tokens on page reloads
  const cacheKey = `rec_${student.id || student.email || "anon"}_${student.major || ""}_${student.expertise_fields || ""}`;
  const cached = getCachedAiResult<RecommenderResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const gemini = getGeminiClient();

  if (gemini) {
    try {
      // Limit to top 10 candidates and truncate text fields to restrict prompt token budget
      const truncatedCandidates = candidates.slice(0, 10).map((c) => ({
        id: c.id,
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
        institution: truncatePromptText(c.institution, 50),
        department: truncatePromptText(c.department, 50),
        expertise: Array.isArray(c.expertise_fields) ? c.expertise_fields.join(", ") : truncatePromptText(c.expertise_fields, 100),
        accepting: c.is_accepting_requests ?? true,
      }));

      const prompt = `You are an academic matchmaker on Schollective.
STUDENT: Major: ${truncatePromptText(student.major, 40)}, Fields: ${Array.isArray(student.expertise_fields) ? student.expertise_fields.join(", ") : truncatePromptText(student.expertise_fields, 80)}, Bio: "${truncatePromptText(student.bio, 200)}"

PROFESSOR CANDIDATES:
${JSON.stringify(truncatedCandidates)}

Return a JSON array of up to 5 top matching professors:
[
  {
    "professorId": "string",
    "matchScore": number (50-98),
    "matchReasons": ["2 short reasons"],
    "keyOverlaps": ["shared fields"],
    "suggestedOutreachAngle": "1 sentence advice"
  }
]`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 600, // Token Safety Guard
        },
      });

      const text = response.text;
      if (text) {
        const matches = JSON.parse(text) as ProfessorMatch[];
        const result: RecommenderResult = {
          recommendations: matches,
          generatedAt: new Date().toISOString(),
          totalEvaluated: candidates.length,
        };
        setCachedAiResult(cacheKey, result, 10 * 60 * 1000); // 10 min cache
        return result;
      }
    } catch (err) {
      console.warn("[recommendProfessors] Gemini call failed or unconfigured, using fallback:", err);
    }
  }

  // Fallback Semantic Keyword Matching Engine (0 tokens spent)
  const matches = computeRuleBasedProfessorMatches(student, candidates);
  const result: RecommenderResult = {
    recommendations: matches,
    generatedAt: new Date().toISOString(),
    totalEvaluated: candidates.length,
  };
  setCachedAiResult(cacheKey, result, 10 * 60 * 1000);
  return result;
}

/**
 * Intelligent rule-based matching engine when AI model is offline.
 */
function computeRuleBasedProfessorMatches(
  student: StudentProfileData,
  candidates: ProfessorCandidate[]
): ProfessorMatch[] {
  let studentFields: string[] = [];
  if (Array.isArray(student.expertise_fields)) studentFields = student.expertise_fields;
  else if (typeof student.expertise_fields === "string") {
    studentFields = student.expertise_fields.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const studentTokens = new Set([
    ...(student.major || "").toLowerCase().split(/\s+/),
    ...(student.bio || "").toLowerCase().split(/\s+/),
    ...studentFields.map((f) => f.toLowerCase()),
  ].filter((w) => w.length > 3));

  const scored: Array<{ candidate: ProfessorCandidate; score: number; overlaps: string[] }> = [];

  for (const c of candidates) {
    let candidateFields: string[] = [];
    if (Array.isArray(c.expertise_fields)) candidateFields = c.expertise_fields;
    else if (typeof c.expertise_fields === "string") {
      candidateFields = c.expertise_fields.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const overlaps: string[] = [];
    let matchScore = 50;

    for (const f of candidateFields) {
      const fLower = f.toLowerCase();
      if (studentFields.some((sf) => sf.toLowerCase().includes(fLower) || fLower.includes(sf.toLowerCase()))) {
        matchScore += 18;
        overlaps.push(f);
      } else if (Array.from(studentTokens).some((st) => fLower.includes(st))) {
        matchScore += 8;
        overlaps.push(f);
      }
    }

    if (c.institution && student.institution && c.institution.toLowerCase() === student.institution.toLowerCase()) {
      matchScore += 12;
    }

    if (c.is_accepting_requests) {
      matchScore += 10;
    } else {
      matchScore -= 15;
    }

    const finalScore = Math.min(98, Math.max(40, matchScore));
    scored.push({ candidate: c, score: finalScore, overlaps: Array.from(new Set(overlaps)) });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map(({ candidate, score, overlaps }) => {
    const mainOverlap = overlaps[0] || candidate.department || "shared academic discipline";
    
    return {
      professorId: candidate.id,
      matchScore: score,
      matchReasons: [
        `Strong alignment in ${mainOverlap}`,
        candidate.is_accepting_requests ? "Currently accepting student research requests" : "Active faculty member",
      ],
      keyOverlaps: overlaps.length > 0 ? overlaps : [candidate.department || "Academic Research"],
      suggestedOutreachAngle: `Mention your interest in ${mainOverlap} and how your background in ${student.major || "this field"} connects to their lab focus.`,
    };
  });
}
