import { getGeminiClient } from "./client";
import { ProfileReviewResult } from "./types";
import { ai } from "@/lib/amplitude";
import {
  sanitizeAiPromptInput,
  getCachedAiResult,
  setCachedAiResult,
  executeHybridAiWithFallback,
} from "./guardrails";

export interface StudentProfileData {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email?: string | null;
  institution?: string | null;
  education_level?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  bio?: string | null;
  academic_interests?: string[] | string | null;
  extracurriculars?: string[] | string | null;
  coursework?: string[] | string | null;
  skills_and_tools?: string[] | string | null;
  portfolio_url?: string | null;
  expertise_fields?: string[] | string | null;
}

function normaliseScore(value: unknown): number {
  const numericValue = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numericValue)
    ? Math.round(Math.max(0, Math.min(100, numericValue)))
    : 50;
}

function normaliseText(value: unknown, maxChars: number, fallback = ""): string {
  const text = typeof value === "string" ? sanitizeAiPromptInput(value, maxChars) : "";
  return text || fallback;
}

function normaliseStringList(value: unknown, maxItems: number, maxItemChars: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeAiPromptInput(item, maxItemChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normaliseProfileReviewResult(raw: Record<string, unknown>): ProfileReviewResult {
  const improvements = Array.isArray(raw.improvements)
    ? raw.improvements.slice(0, 6).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const improvement = item as Record<string, unknown>;
        return [{
          field: normaliseText(improvement.field, 100, "Profile"),
          issue: normaliseText(improvement.issue, 240, "Needs more detail"),
          suggestion: normaliseText(improvement.suggestion, 400, "Add a specific detail that strengthens this section."),
        }];
      })
    : [];

  const readiness = raw.outreachReadiness === "ready" ||
    raw.outreachReadiness === "needs_work" ||
    raw.outreachReadiness === "incomplete"
    ? raw.outreachReadiness
    : "needs_work";

  return {
    overallScore: normaliseScore(raw.overallScore),
    clarityScore: normaliseScore(raw.clarityScore),
    academicToneScore: normaliseScore(raw.academicToneScore),
    alignmentScore: normaliseScore(raw.alignmentScore),
    completenessScore: normaliseScore(raw.completenessScore),
    summary: normaliseText(raw.summary, 600, "Your profile has been reviewed. Add more specific academic detail to strengthen it."),
    strengths: normaliseStringList(raw.strengths, 5, 240),
    improvements,
    suggestedInterests: normaliseStringList(raw.suggestedInterests, 6, 120),
    outreachReadiness: readiness,
  };
}

/**
 * Reviews a student profile using Gemini AI with prompt injection defense & rate limit fallback.
 */
export async function reviewStudentProfile(
  profile: StudentProfileData
): Promise<ProfileReviewResult> {
  const interestsList = Array.isArray(profile.academic_interests)
    ? profile.academic_interests.join(", ")
    : typeof profile.academic_interests === "string"
    ? profile.academic_interests
    : Array.isArray(profile.expertise_fields)
    ? profile.expertise_fields.join(", ")
    : "";

  const extrasList = Array.isArray(profile.extracurriculars)
    ? profile.extracurriculars.join(", ")
    : typeof profile.extracurriculars === "string"
    ? profile.extracurriculars
    : "";

  const sanitizedBio = sanitizeAiPromptInput(profile.bio, 350);
  const sanitizedInst = sanitizeAiPromptInput(profile.institution, 100);
  const sanitizedLevel = sanitizeAiPromptInput(profile.education_level, 50);
  const sanitizedInterests = sanitizeAiPromptInput(interestsList, 300);
  const sanitizedExtras = sanitizeAiPromptInput(extrasList, 600);

  // FIX: Include sanitizedExtras in profileKey so modifying extracurriculars invalidates stale cache
  const profileKey = `${profile.id || profile.email || "anon"}_${sanitizedBio}_${sanitizedInterests}_${sanitizedExtras}_${sanitizedLevel}_${sanitizedInst}`;
  const cacheKey = `profile_review_v6_hybrid_${profileKey}`;
  const cached = getCachedAiResult<ProfileReviewResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const prompt = `You are a friendly academic advisor helping a student strengthen their profile for professor outreach on Schollective.

Who you're talking to: high school students (grades 9-12) looking for research mentors, plus some college undergrads looking for labs.

Evaluate their profile and score it. Recognize strong achievements (ISEF, USAMO, USACO, PRIMES, RSI, published research = elite; state competitions, robotics, science fairs, club leadership = strong; school clubs, honor roll = solid start).

IMPORTANT WRITING STYLE RULES:
- Write like a helpful older peer, not a corporate AI. Be direct and specific.
- Keep strengths and suggestions SHORT — one line each, no filler words.
- Don't use phrases like "I recommend", "It is advisable", "Consider leveraging", "This demonstrates", or "Your profile showcases". Just say what's good or what to fix.
- Suggestions should be things the student can do TODAY, not vague advice.

STUDENT PROFILE:
- Institution: "${sanitizedInst || "Not specified"}"
- Education Level: "${sanitizedLevel || "Not specified"}"
- Short Bio: "${sanitizedBio || "Empty"}"
- Academic Interests: "${sanitizedInterests || "Empty"}"
- Extracurriculars: "${sanitizedExtras || "Empty"}"

Return ONLY valid JSON:
{
  "overallScore": number (0-100),
  "clarityScore": number (0-100),
  "academicToneScore": number (0-100),
  "alignmentScore": number (0-100),
  "completenessScore": number (0-100),
  "summary": "1-2 short sentences, conversational",
  "strengths": ["2-3 short, specific strengths — no filler"],
  "improvements": [
    {
      "field": "Short Bio | Academic Interests | Extracurriculars | Institution | Education Level",
      "issue": "What's missing or weak",
      "suggestion": "One concrete thing to do about it"
    }
  ],
  "suggestedInterests": ["3-4 broad research fields the student might like, based on their interests — use everyday names like 'Robotics', 'Neuroscience', 'Climate Science', NOT niche subfields like 'Computational Epistemic Graph Theory'"],
  "outreachReadiness": "ready" | "needs_work" | "incomplete"
}`;

  const callModel = async (modelName: string) => {
    const gemini = getGeminiClient();
    if (!gemini) throw new Error("GEMINI_API_KEY missing");

    const startTime = performance.now();
    try {
      const response = await gemini.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 600,
          temperature: 0.1,
        },
      });

      const latencyMs = performance.now() - startTime;
      const text = response.text;
      if (!text) throw new Error(`Empty response from ${modelName}`);

      void ai.trackAiMessage({ content: text, sessionId: "schollective", model: modelName, provider: "google", latencyMs,
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      });

      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Gemini returned an invalid profile review payload");
      }
      const normalised = normaliseProfileReviewResult(parsed as Record<string, unknown>);

      setCachedAiResult(cacheKey, normalised, 15 * 60 * 1000);
      return normalised;
    } catch (err: any) {
      void ai.trackAiMessage({ content: "", sessionId: "schollective", model: modelName, provider: "google", latencyMs: performance.now() - startTime,
        isError: true,
        errorMessage: err?.message || "Unknown LLM error",
      });
      throw err;
    }
  };

  return executeHybridAiWithFallback(
    async () => callModel("gemini-3.6-flash"),
    async () => callModel("gemini-3.5-flash-lite"),
    () => {
      const fallbackResult = generateRuleBasedProfileReview(profile, sanitizedInterests, sanitizedExtras);
      setCachedAiResult(cacheKey, fallbackResult, 15 * 60 * 1000);
      return fallbackResult;
    }
  );
}

/**
 * High-precision deterministic fallback scoring algorithm with Extracurricular Achievement Tiering.
 */
function generateRuleBasedProfileReview(
  profile: StudentProfileData,
  interestsStr: string,
  extrasStr: string
): ProfileReviewResult {
  const bio = (profile.bio || "").trim();
  const inst = (profile.institution || "").trim();
  const level = (profile.education_level || "undergraduate").trim();

  const interests = interestsStr ? interestsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const extras = extrasStr ? extrasStr.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const strengths: string[] = [];
  const improvements: ProfileReviewResult["improvements"] = [];

  let completeness = 0;
  if (inst) {
    completeness += 20;
    strengths.push(`Affiliated with ${inst}.`);
  } else {
    improvements.push({
      field: "Institution",
      issue: "Institution missing",
      suggestion: "Type your current high school, college, or university name.",
    });
  }

  if (level) {
    completeness += 20;
  } else {
    improvements.push({
      field: "Education Level",
      issue: "Education level not selected",
      suggestion: "Select your current standing (e.g. Undergraduate, High School, Graduate).",
    });
  }

  if (bio.length >= 30) {
    completeness += 20;
    if (bio.length >= 80) strengths.push("Well-articulated short bio.");
  } else {
    improvements.push({
      field: "Short Bio",
      issue: "Short bio is brief or empty",
      suggestion: "Write 1-2 sentences about your research goals and academic curiosity.",
    });
  }

  if (interests.length >= 2) {
    completeness += 20;
    strengths.push(`${interests.length} focused academic research interests.`);
  } else {
    improvements.push({
      field: "Academic Interests",
      issue: "Few or no academic interests listed",
      suggestion: "Enter comma-separated topics (e.g. Machine Learning, Neuroscience).",
    });
  }

  // --- Extracurricular Tiering Analysis ---
  const extrasTextLower = extrasStr.toLowerCase();
  
  // Tier 1 keywords: National/International Olympiads, ISEF, PRIMES, World Championships
  const tier1Keywords = ["isef", "usamo", "usaco", "primes", "world", "worlds", "chopin", "international", "national finalist", "1st place world"];
  // Tier 2 keywords: State/Regional UIL, AMC, Robotics, Unity game dev, Research, Club President
  const tier2Keywords = ["uil", "amc", "frc", "robotics", "unity", "flappy", "research", "president", "captain", "founder", "regional", "state"];

  const matchedTier1 = tier1Keywords.filter((kw) => extrasTextLower.includes(kw));
  const matchedTier2 = tier2Keywords.filter((kw) => extrasTextLower.includes(kw));

  let extraBonusScore = 0;

  if (matchedTier1.length > 0) {
    completeness += 20;
    extraBonusScore += 30;
    strengths.push(`Distinguished Tier-1 national/international accomplishments (${matchedTier1.join(", ").toUpperCase()}).`);
  } else if (matchedTier2.length > 0) {
    completeness += 20;
    extraBonusScore += 18;
    strengths.push(`Strong technical initiative and regional extracurricular involvement (${matchedTier2.join(", ")}).`);
  } else if (extras.length >= 1) {
    completeness += 15;
    extraBonusScore += 8;
    strengths.push("Active participation in extracurricular activities.");
  } else {
    improvements.push({
      field: "Extracurriculars",
      issue: "Extracurriculars empty",
      suggestion: "Add clubs, competitions, software projects, or research programs.",
    });
  }

  const courseworkStr = Array.isArray(profile.coursework) ? profile.coursework.join(", ") : profile.coursework || "";
  const skillsStr = Array.isArray(profile.skills_and_tools) ? profile.skills_and_tools.join(", ") : profile.skills_and_tools || "";
  
  if (courseworkStr.length > 5) completeness += 10;
  if (skillsStr.length > 5) completeness += 10;

  let clarity = 65;
  if (bio.length > 60) clarity += 15;
  if (interests.length >= 3) clarity += 10;
  if (extras.length >= 3) clarity += 10;
  clarity = Math.min(100, clarity);

  let academicTone = 65;
  const keywords = ["research", "study", "analysis", "science", "data", "engineering", "lab", "project", "algorithm", "biology", "computing", "math", "physics", "primes", "usaco", "usamo", "isef", "ap", "ib", "pytorch", "python", "c++"];
  const textCombined = `${bio} ${interestsStr} ${extrasStr} ${courseworkStr} ${skillsStr}`.toLowerCase();
  const matchedKw = keywords.filter((kw) => textCombined.includes(kw));
  if (matchedKw.length > 0) {
    academicTone += Math.min(35, matchedKw.length * 7);
  }
  academicTone = Math.min(100, academicTone + (matchedTier1.length > 0 ? 15 : 0));

  let alignment = interests.length >= 2 ? 85 : 60;
  if (matchedTier1.length > 0 || matchedTier2.length > 0) alignment = Math.min(100, alignment + 15);

  const rawOverall = Math.round((completeness * 0.35) + (clarity * 0.2) + (academicTone * 0.25) + (alignment * 0.2)) + extraBonusScore;
  const overall = Math.max(0, Math.min(100, rawOverall));

  let readiness: ProfileReviewResult["outreachReadiness"] = "needs_work";
  if (overall >= 75 && completeness >= 65) readiness = "ready";
  else if (overall < 50) readiness = "incomplete";

  const summary = matchedTier1.length > 0
    ? "Exceptional candidate profile with world-class extracurricular & competition achievements. Strongly aligned for high-impact research mentorship."
    : readiness === "ready"
    ? "Your profile is well-crafted and ready for professor outreach. Your academic interests and extracurricular initiatives provide clear context for faculty."
    : "Your profile gives a solid baseline. Elaborating on your bio and academic research goals will further elevate your outreach response rate.";

  const suggestedInterests = interests.length >= 2
    ? [interests[0], interests[1], "Computer Science", "Biology"].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)
    : ["Computer Science", "Biology", "Engineering", "Mathematics"];

  return {
    overallScore: overall,
    clarityScore: Math.min(100, clarity),
    academicToneScore: Math.min(100, academicTone),
    alignmentScore: Math.min(100, alignment),
    completenessScore: Math.min(100, completeness),
    summary,
    strengths: strengths.length > 0 ? strengths : ["Basic account details configured."],
    improvements: improvements.slice(0, 4),
    suggestedInterests,
    outreachReadiness: readiness,
  };
}
