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
 * Recommends top matching professors purely for match evaluation & alignment advice.
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

  const cacheKey = `rec_v3_${student.id || student.email || "anon"}_${student.education_level || ""}_${student.academic_interests || ""}`;
  const cached = getCachedAiResult<RecommenderResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const truncatedCandidates = candidates.slice(0, 10).map((c) => ({
        id: c.id,
        name: `Prof. ${c.first_name || ""} ${c.last_name || ""}`.trim(),
        institution: truncatePromptText(c.institution, 50),
        department: truncatePromptText(c.department, 50),
        expertise: Array.isArray(c.expertise_fields) ? c.expertise_fields.join(", ") : truncatePromptText(c.expertise_fields, 100),
        accepting: c.is_accepting_requests ?? true,
      }));

      const prompt = `You are an academic matchmaker on Schollective.
CRITICAL INSTRUCTIONS:
- Match student ONLY against the provided candidate list.
- Do NOT generate email text, subject lines, or opening sentences.
- Evaluate research alignment and assign "matchTier": "Best Fit" (score>=88) | "Strong Match" (score>=75) | "Potential Alignment" (<75).

STUDENT DATA:
- Education Level: ${truncatePromptText(student.education_level, 40)}
- Institution: ${truncatePromptText(student.institution, 50)}
- Academic Interests: ${Array.isArray(student.academic_interests) ? student.academic_interests.join(", ") : truncatePromptText(student.academic_interests, 80)}
- Bio: "${truncatePromptText(student.bio, 200)}"

PROFESSOR CANDIDATE LIST:
${JSON.stringify(truncatedCandidates)}

Return ONLY a JSON array matching this schema (sorted by matchScore descending, max 5 items):
[
  {
    "professorId": "exact id from candidate list",
    "matchScore": number (50-98),
    "matchTier": "Best Fit" | "Strong Match" | "Potential Alignment",
    "matchReasons": ["2 concise factual match reasons"],
    "keyOverlaps": ["array of overlapping topics"],
    "suggestedOutreachAngle": "1 sentence advice on why this professor is a good fit"
  }
]`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 600,
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (text) {
        const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
        const matches = JSON.parse(cleanedText) as ProfessorMatch[];

        const validIds = new Set(candidates.map((c) => c.id));
        const validMatches = matches
          .filter((m) => validIds.has(m.professorId))
          .map((m) => {
            const score = Math.max(40, Math.min(98, m.matchScore || 50));
            const tier: ProfessorMatch["matchTier"] = score >= 88 ? "Best Fit" : score >= 75 ? "Strong Match" : "Potential Alignment";
            return {
              ...m,
              matchScore: score,
              matchTier: m.matchTier || tier,
            };
          });

        const result: RecommenderResult = {
          recommendations: validMatches,
          generatedAt: new Date().toISOString(),
          totalEvaluated: candidates.length,
        };

        setCachedAiResult(cacheKey, result, 10 * 60 * 1000);
        return result;
      }
    } catch (err) {
      console.warn("[recommendProfessors] Gemini AI matching failed, returning fallback:", err);
    }
  }

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
 * Rule-based matching engine when AI model is offline.
 */
function computeRuleBasedProfessorMatches(
  student: StudentProfileData,
  candidates: ProfessorCandidate[]
): ProfessorMatch[] {
  let studentFields: string[] = [];
  if (Array.isArray(student.academic_interests)) studentFields = student.academic_interests;
  else if (typeof student.academic_interests === "string") {
    studentFields = student.academic_interests.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const studentTokens = new Set([
    ...(student.education_level || "").toLowerCase().split(/\s+/),
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
    const mainOverlap = overlaps[0] || candidate.department || "shared academic research";
    const tier: ProfessorMatch["matchTier"] = score >= 88 ? "Best Fit" : score >= 75 ? "Strong Match" : "Potential Alignment";

    return {
      professorId: candidate.id,
      matchScore: score,
      matchTier: tier,
      matchReasons: [
        `Research alignment in ${mainOverlap}`,
        candidate.is_accepting_requests ? "Currently accepting student research requests" : "Active faculty member",
      ],
      keyOverlaps: overlaps.length > 0 ? overlaps : [candidate.department || "Academic Research"],
      suggestedOutreachAngle: `Focus your request on ${mainOverlap} and how your background connects to their department research.`,
    };
  });
}
