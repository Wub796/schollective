import { getGeminiClient } from "./client";
import { ProfileReviewResult } from "./types";
import { truncatePromptText, getCachedAiResult, setCachedAiResult } from "./guardrails";

export interface StudentProfileData {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  email?: string | null;
  institution?: string | null;
  education_level?: string | null;
  bio?: string | null;
  academic_interests?: string[] | string | null;
  extracurriculars?: string[] | string | null;
  expertise_fields?: string[] | string | null; // professor field compatibility
}

/**
 * Reviews a student profile using Gemini AI (or rule-based fallback) matching Schollective's exact form fields.
 */
export async function reviewStudentProfile(
  profile: StudentProfileData
): Promise<ProfileReviewResult> {
  // Normalize interests and extracurriculars arrays/strings
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

  // Check TTL cache to save token costs
  const profileKey = `${profile.id || profile.email || "anon"}_${profile.bio || ""}_${interestsList}_${profile.education_level || ""}`;
  const cacheKey = `profile_review_${profileKey}`;
  const cached = getCachedAiResult<ProfileReviewResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const safeInst = truncatePromptText(profile.institution, 80);
      const safeLevel = truncatePromptText(profile.education_level, 50);
      const safeBio = truncatePromptText(profile.bio, 280);
      const safeInterests = truncatePromptText(interestsList, 150);
      const safeExtras = truncatePromptText(extrasList, 150);

      const prompt = `You are an academic advisor reviewing a student profile on Schollective.
The student can update these EXACT fields on their profile page:
1. Institution: "${safeInst || "Not specified"}"
2. Education Level: "${safeLevel || "Not specified"}"
3. Short Bio: "${safeBio || "Empty"}"
4. Academic Interests: "${safeInterests || "Empty"}"
5. Extracurriculars: "${safeExtras || "Empty"}"

Analyze the profile for outreach readiness to professors and return a JSON object with this exact schema:
{
  "overallScore": number (0-100),
  "clarityScore": number (0-100),
  "academicToneScore": number (0-100),
  "alignmentScore": number (0-100),
  "completenessScore": number (0-100),
  "summary": "1-2 sentence overall feedback",
  "strengths": ["2-3 specific strengths based on their actual inputs"],
  "improvements": [
    {
      "field": "Short Bio | Academic Interests | Extracurriculars | Institution | Education Level",
      "issue": "What is weak or missing in this specific input field",
      "suggestion": "Actionable advice on what text/keywords the student should type into this field"
    }
  ],
  "outreachReadiness": "ready" | "needs_work" | "incomplete"
}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 500,
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as ProfileReviewResult;
        setCachedAiResult(cacheKey, parsed, 15 * 60 * 1000);
        return parsed;
      }
    } catch (err) {
      console.warn("[reviewStudentProfile] Gemini API call failed or unconfigured, using fallback:", err);
    }
  }

  // Fallback Rule-Based Scoring Engine tailored to Schollective student fields
  const result = generateRuleBasedProfileReview(profile, interestsList, extrasList);
  setCachedAiResult(cacheKey, result, 15 * 60 * 1000);
  return result;
}

/**
 * Deterministic fallback scoring algorithm matching Schollective student fields.
 */
function generateRuleBasedProfileReview(
  profile: StudentProfileData,
  interestsStr: string,
  extrasStr: string
): ProfileReviewResult {
  const bio = (profile.bio || "").trim();
  const inst = (profile.institution || "").trim();
  const level = (profile.education_level || "").trim();

  const interests = interestsStr ? interestsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const extras = extrasStr ? extrasStr.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const strengths: string[] = [];
  const improvements: ProfileReviewResult["improvements"] = [];

  // 1. Completeness Score
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
    completeness += 25;
    if (bio.length >= 80) strengths.push("Informative short bio.");
  } else {
    improvements.push({
      field: "Short Bio",
      issue: "Short bio is brief or empty",
      suggestion: "Write 1-2 sentences about your research goals and academic curiosity.",
    });
  }

  if (interests.length >= 2) {
    completeness += 20;
    strengths.push(`${interests.length} academic interests listed (${interests.slice(0, 2).join(", ")}).`);
  } else {
    improvements.push({
      field: "Academic Interests",
      issue: "Few or no academic interests listed",
      suggestion: "Enter comma-separated topics (e.g. Machine Learning, Neuroscience, AI Ethics).",
    });
  }

  if (extras.length >= 1) {
    completeness += 15;
    strengths.push("Active in extracurricular activities.");
  } else {
    improvements.push({
      field: "Extracurriculars",
      issue: "Extracurriculars empty",
      suggestion: "Add clubs, competitions, or research projects you participate in.",
    });
  }

  // 2. Clarity Score
  let clarity = 60;
  if (bio.length > 60) clarity += 20;
  if (interests.length >= 3) clarity += 20;
  clarity = Math.min(100, clarity);

  // 3. Academic Tone Score
  let academicTone = 65;
  const keywords = ["research", "study", "analysis", "science", "data", "engineering", "lab", "project", "algorithm", "biology", "computing"];
  const textCombined = `${bio} ${interestsStr}`.toLowerCase();
  const matchedKw = keywords.filter((kw) => textCombined.includes(kw));
  if (matchedKw.length > 0) {
    academicTone += Math.min(30, matchedKw.length * 10);
  }
  academicTone = Math.min(100, academicTone);

  // 4. Alignment Score
  let alignment = interests.length >= 2 ? 85 : 50;

  const overall = Math.round((completeness * 0.4) + (clarity * 0.25) + (academicTone * 0.25) + (alignment * 0.1));

  let readiness: ProfileReviewResult["outreachReadiness"] = "needs_work";
  if (overall >= 75 && completeness >= 70) readiness = "ready";
  else if (overall < 50) readiness = "incomplete";

  const summary = readiness === "ready"
    ? "Your profile is well-crafted and ready for professor outreach. Your academic interests and bio provide clear context for faculty."
    : "Your profile gives a good start, but filling in your Short Bio and Academic Interests will significantly improve your outreach response rate.";

  return {
    overallScore: overall,
    clarityScore: Math.min(100, clarity),
    academicToneScore: Math.min(100, academicTone),
    alignmentScore: Math.min(100, alignment),
    completenessScore: Math.min(100, completeness),
    summary,
    strengths: strengths.length > 0 ? strengths : ["Basic account details configured."],
    improvements: improvements.slice(0, 4),
    outreachReadiness: readiness,
  };
}
