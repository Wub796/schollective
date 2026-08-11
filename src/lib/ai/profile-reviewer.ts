import { getGeminiClient } from "./client";
import { ProfileReviewResult } from "./types";
import { truncatePromptText, getCachedAiResult, setCachedAiResult } from "./guardrails";

export interface StudentProfileData {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  institution?: string | null;
  major?: string | null;
  gpa?: string | number | null;
  bio?: string | null;
  expertise_fields?: string[] | string | null;
  publications?: string | string[] | null;
  statement_of_purpose?: string | null;
}

/**
 * Reviews a student profile using Gemini AI with strict token guardrails and caching.
 */
export async function reviewStudentProfile(
  profile: StudentProfileData
): Promise<ProfileReviewResult> {
  // Check TTL cache to avoid burning API tokens on repeated requests
  const profileKey = `${profile.id || profile.email || "anon"}_${profile.bio || ""}_${profile.major || ""}`;
  const cacheKey = `profile_review_${profileKey}`;
  const cached = getCachedAiResult<ProfileReviewResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const gemini = getGeminiClient();

  if (gemini) {
    try {
      // Truncate fields to prevent runaway prompt size
      const safeBio = truncatePromptText(profile.bio, 400);
      const safeStatement = truncatePromptText(profile.statement_of_purpose, 400);
      const safeMajor = truncatePromptText(profile.major, 80);
      const safeInst = truncatePromptText(profile.institution, 80);

      const prompt = `You are an academic advisor reviewing a student profile on Schollective.
Profile:
- Institution: ${safeInst || "Not specified"}
- Major: ${safeMajor || "Not specified"}
- GPA: ${profile.gpa || "Not specified"}
- Bio: "${safeBio}"
- Research Fields: ${Array.isArray(profile.expertise_fields) ? profile.expertise_fields.join(", ") : profile.expertise_fields || "None"}
- Statement: "${safeStatement}"

Evaluate this profile and return a JSON object matching this schema:
{
  "overallScore": number (0-100),
  "clarityScore": number (0-100),
  "academicToneScore": number (0-100),
  "alignmentScore": number (0-100),
  "completenessScore": number (0-100),
  "summary": "1-2 sentences assessment",
  "strengths": ["2-3 concise strengths"],
  "improvements": [
    {
      "field": "Bio | Research Fields | Statement",
      "issue": "Specific area needing work",
      "suggestion": "Actionable advice"
    }
  ],
  "outreachReadiness": "ready" | "needs_work" | "incomplete"
}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 500, // Token Safety Guard
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as ProfileReviewResult;
        setCachedAiResult(cacheKey, parsed, 15 * 60 * 1000); // 15-min cache
        return parsed;
      }
    } catch (err) {
      console.warn("[reviewStudentProfile] Gemini call failed or unconfigured, using fallback:", err);
    }
  }

  // Fallback Rule-Based Scoring Engine (0 tokens spent)
  const result = generateRuleBasedProfileReview(profile);
  setCachedAiResult(cacheKey, result, 15 * 60 * 1000);
  return result;
}

/**
 * Intelligent deterministic fallback algorithm for student profile evaluation.
 */
function generateRuleBasedProfileReview(profile: StudentProfileData): ProfileReviewResult {
  const bio = (profile.bio || "").trim();
  const inst = (profile.institution || "").trim();
  const major = (profile.major || "").trim();
  const gpa = profile.gpa ? String(profile.gpa).trim() : "";
  const statement = (profile.statement_of_purpose || "").trim();
  
  let fields: string[] = [];
  if (Array.isArray(profile.expertise_fields)) fields = profile.expertise_fields;
  else if (typeof profile.expertise_fields === "string") {
    fields = profile.expertise_fields.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const strengths: string[] = [];
  const improvements: ProfileReviewResult["improvements"] = [];

  let completeness = 0;
  if (inst) completeness += 20; else improvements.push({ field: "Institution", issue: "Institution missing", suggestion: "Add your current university or college." });
  if (major) completeness += 20; else improvements.push({ field: "Major", issue: "Academic major missing", suggestion: "Specify your field of study (e.g. Computer Science, Bioengineering)." });
  if (gpa) completeness += 15; else improvements.push({ field: "GPA", issue: "GPA not listed", suggestion: "Include your GPA if it strengthens your academic profile." });
  if (fields.length >= 2) completeness += 20; else improvements.push({ field: "Research Fields", issue: "Few research interests listed", suggestion: "List at least 2-3 specific research fields or methods." });
  if (bio.length >= 50) completeness += 15; else improvements.push({ field: "Bio", issue: "Bio is brief", suggestion: "Expand your bio to highlight your background and research motivations." });
  if (statement.length >= 50) completeness += 10;

  let clarity = 60;
  if (bio.length > 80) clarity += 20;
  if (fields.length >= 3) clarity += 15;
  if (bio.includes("research") || bio.includes("lab") || bio.includes("project")) {
    clarity += 5;
    strengths.push("Clear focus on research and practical academic experience.");
  }
  clarity = Math.min(100, clarity);

  let academicTone = 70;
  const academicKeywords = ["analysis", "algorithm", "hypothesis", "data", "investigation", "study", "engineering", "model", "publication", "laboratory", "theory"];
  const matches = academicKeywords.filter((kw) => bio.toLowerCase().includes(kw) || statement.toLowerCase().includes(kw));
  if (matches.length > 0) {
    academicTone += Math.min(25, matches.length * 8);
    strengths.push(`Strong academic vocabulary (${matches.slice(0, 3).join(", ")}).`);
  } else {
    improvements.push({
      field: "Bio / Statement",
      issue: "Casual tone",
      suggestion: "Incorporate domain-specific academic terminology and methodology keywords.",
    });
  }
  academicTone = Math.min(100, academicTone);

  let alignment = fields.length >= 2 ? 80 : 50;
  if (inst.toLowerCase().includes("university") || inst.toLowerCase().includes("college") || inst.toLowerCase().includes("institute")) {
    alignment += 15;
    strengths.push("Affiliated with an established academic institution.");
  }
  alignment = Math.min(100, alignment);

  const overall = Math.round((completeness * 0.35) + (clarity * 0.25) + (academicTone * 0.25) + (alignment * 0.15));

  let readiness: ProfileReviewResult["outreachReadiness"] = "needs_work";
  if (overall >= 75 && completeness >= 70) readiness = "ready";
  else if (overall < 50) readiness = "incomplete";

  const summary = readiness === "ready"
    ? "Your profile is well-rounded and ready for professor outreach. Your research interests and background are clear."
    : "Your profile provides a good foundation, but expanding your research focus and statement of purpose will boost response rates from professors.";

  return {
    overallScore: overall,
    clarityScore: Math.min(100, clarity),
    academicToneScore: Math.min(100, academicTone),
    alignmentScore: Math.min(100, alignment),
    completenessScore: Math.min(100, completeness),
    summary,
    strengths: strengths.length > 0 ? strengths : ["Basic academic profile created."],
    improvements: improvements.slice(0, 4),
    outreachReadiness: readiness,
  };
}
