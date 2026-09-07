import { executeWithGeminiFailover } from "./client";
import { ai } from "@/lib/amplitude";
import type {
  ActivityItem,
  HonorAwardItem,
  LanguageItem,
  SocialLinks,
  AcademicStats,
} from "@/lib/neon/profiles";

export interface ParsedResumeProfile {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  institution?: string | null;
  education_level?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  bio?: string | null;
  academic_stats?: AcademicStats | null;
  activities?: ActivityItem[];
  honors_awards?: HonorAwardItem[];
  skills_and_tools?: string[];
  academic_interests?: string[];
  languages?: LanguageItem[];
  social_links?: SocialLinks;
}

const VALID_EDUCATION_LEVELS = [
  "high-school-senior",
  "high-school-junior",
  "high-school-underclassman",
  "undergraduate-lower",
  "undergraduate-upper",
  "graduate",
  "postdoc",
  "other",
] as const;

const VALID_ACTIVITY_CATEGORIES = [
  "Research",
  "Software / Engineering Project",
  "Competition Team",
  "School Club / Leadership",
  "Fine Arts / Athletics",
  "Work / Volunteer",
  "Other",
] as const;

const VALID_HONOR_LEVELS = [
  "School",
  "Regional",
  "State",
  "National",
  "International",
  "Other",
] as const;

const RESUME_EXTRACTION_PROMPT = `You are an expert academic advisor and resume parser for Schollective, a platform connecting high school and college student researchers with faculty mentors.

Analyze the uploaded student resume PDF carefully and extract their academic profile into structured JSON.

MAPPING & NORMALIZATION RULES:
1. "education_level":
   - High School 12th Grade / Class of next year -> "high-school-senior"
   - High School 11th Grade -> "high-school-junior"
   - High School 9th or 10th Grade -> "high-school-underclassman"
   - College / University 1st or 2nd year -> "undergraduate-lower"
   - College / University 3rd or 4th year -> "undergraduate-upper"
   - Master's, PhD, Doctoral -> "graduate"
   - Postdoctoral -> "postdoc"
   - If unclear -> "other"

2. "activities" categories MUST be one of:
   - "Research" (lab assistant, scientific research, academic paper, independent study)
   - "Software / Engineering Project" (coding apps, robotics build, hardware, web dev)
   - "Competition Team" (Science Olympiad, Math Olympiad, Hackathon, Mock Trial, Debate, Robotics Team)
   - "School Club / Leadership" (Student Council, Club President, Peer Tutor, Newspaper)
   - "Fine Arts / Athletics" (Varsity Sports, Orchestra, Choir, Theater, Visual Arts)
   - "Work / Volunteer" (Internship, part-time job, community service, charity)
   - "Other"

3. "honors_awards" issuer_or_level MUST be one of:
   - "School" | "Regional" | "State" | "National" | "International" | "Other"

4. "academic_stats":
   - "unweighted_gpa": Number on 4.0 scale if mentioned, or null.
   - "weighted_gpa": Number on 5.0 scale if mentioned, or null.
   - "advanced_coursework": Array of advanced classes (e.g. AP, IB, Honors, upper-division university courses).

5. "bio": A concise, polished 2-3 sentence academic research pitch/summary of who the student is and what they aspire to research.

6. "skills_and_tools": Array of technical skills, programming languages, lab instruments, or tools (e.g. Python, PyTorch, PCR, MATLAB, React, Excel).

7. "academic_interests": 3-6 specific academic/scientific research fields (e.g. "Computational Neuroscience", "Machine Learning", "Molecular Genetics").

8. "languages": Array of { language: string, proficiency: "Native / Bilingual" | "Professional Working" | "Limited Working" | "Elementary" }.

9. "social_links": Extract github_url, linkedin_url, or personal portfolio_url if present in contact info.

Output strictly valid JSON matching this schema:
{
  "first_name": string | null,
  "last_name": string | null,
  "preferred_name": string | null,
  "institution": string | null,
  "education_level": "high-school-senior" | "high-school-junior" | "high-school-underclassman" | "undergraduate-lower" | "undergraduate-upper" | "graduate" | "postdoc" | "other" | null,
  "major": string | null,
  "graduation_year": string | null,
  "bio": string | null,
  "academic_stats": {
    "unweighted_gpa": number | null,
    "weighted_gpa": number | null,
    "advanced_coursework": string[]
  } | null,
  "activities": [
    {
      "title": string,
      "organization": string,
      "category": string,
      "date_range": string,
      "description": string
    }
  ],
  "honors_awards": [
    {
      "title": string,
      "issuer_or_level": string,
      "year": string
    }
  ],
  "skills_and_tools": string[],
  "academic_interests": string[],
  "languages": [
    {
      "language": string,
      "proficiency": string
    }
  ],
  "social_links": {
    "github_url": string | null,
    "linkedin_url": string | null,
    "portfolio_url": string | null
  }
}`;

function sanitizeText(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeNumber(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function normalizeEducationLevel(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const lower = val.toLowerCase().trim();
  const matched = VALID_EDUCATION_LEVELS.find((lvl) => lvl === lower);
  if (matched) return matched;

  if (lower.includes("senior") || lower.includes("12")) return "high-school-senior";
  if (lower.includes("junior") || lower.includes("11")) return "high-school-junior";
  if (lower.includes("freshman") || lower.includes("sophomore") || lower.includes("9") || lower.includes("10")) {
    return lower.includes("college") || lower.includes("undergrad")
      ? "undergraduate-lower"
      : "high-school-underclassman";
  }
  if (lower.includes("college") || lower.includes("undergrad") || lower.includes("bachelor")) {
    return "undergraduate-lower";
  }
  if (lower.includes("postdoc")) return "postdoc";
  if (lower.includes("master") || lower.includes("phd") || lower.includes("doctor")) return "graduate";
  return "other";
}

export function normalizeCategory(val: unknown): ActivityItem["category"] {
  if (typeof val !== "string") return "Other";
  const trimmed = val.trim();
  const match = VALID_ACTIVITY_CATEGORIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (match) return match;

  const lower = trimmed.toLowerCase();
  if (lower.includes("research") || lower.includes("lab")) return "Research";
  if (
    lower.includes("software") ||
    lower.includes("code") ||
    lower.includes("engineer") ||
    lower.includes("project") ||
    lower.includes("dev") ||
    lower.includes("web") ||
    lower.includes("app")
  ) {
    return "Software / Engineering Project";
  }
  if (lower.includes("competition") || lower.includes("olympiad") || lower.includes("hackathon") || lower.includes("team")) {
    return "Competition Team";
  }
  if (lower.includes("club") || lower.includes("lead") || lower.includes("president") || lower.includes("officer")) {
    return "School Club / Leadership";
  }
  if (
    lower.includes("art") ||
    lower.includes("sport") ||
    lower.includes("music") ||
    lower.includes("athletic") ||
    lower.includes("varsity") ||
    lower.includes("track") ||
    lower.includes("orchestra") ||
    lower.includes("choir") ||
    lower.includes("theater") ||
    lower.includes("theatre") ||
    lower.includes("dance")
  ) {
    return "Fine Arts / Athletics";
  }
  if (lower.includes("volunteer") || lower.includes("work") || lower.includes("intern") || lower.includes("job")) {
    return "Work / Volunteer";
  }
  return "Other";
}

export function normalizeHonorLevel(val: unknown): string {
  if (typeof val !== "string") return "Other";
  const trimmed = val.trim();
  const match = VALID_HONOR_LEVELS.find(
    (l) => l.toLowerCase() === trimmed.toLowerCase()
  );
  if (match) return match;

  const lower = trimmed.toLowerCase();
  if (lower.includes("inter")) return "International";
  if (lower.includes("nation")) return "National";
  if (lower.includes("state")) return "State";
  if (lower.includes("region")) return "Regional";
  if (lower.includes("school")) return "School";
  return "Other";
}

export function normalizeLanguageProficiency(val: unknown): LanguageItem["proficiency"] {
  if (typeof val !== "string") return "Professional Working";
  const lower = val.toLowerCase().trim();
  if (lower.includes("native") || lower.includes("bilingual") || lower.includes("fluent")) return "Native / Bilingual";
  if (lower.includes("profess") || lower.includes("advance")) return "Professional Working";
  if (lower.includes("limit") || lower.includes("convers") || lower.includes("intermed")) return "Limited Working";
  if (lower.includes("elem") || lower.includes("basic") || lower.includes("beginner")) return "Elementary";
  return "Professional Working";
}

/**
 * Parses a digital PDF resume using gemini-3.6-flash and maps it into Phase 1 profile schema.
 */
export async function parseResumePdf(pdfBuffer: Buffer): Promise<ParsedResumeProfile> {
  const base64Pdf = pdfBuffer.toString("base64");
  const modelName = "gemini-3.6-flash";
  const startTime = performance.now();

  try {
    const response = await executeWithGeminiFailover(async (gemini) => {
      return await gemini.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            text: RESUME_EXTRACTION_PROMPT,
          },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });
    });

    const latencyMs = performance.now() - startTime;
    const text = response.text;
    if (!text) throw new Error("Empty response from AI parser.");

    void ai.trackAiMessage({
      content: "PDF Resume Parsed",
      sessionId: "schollective-resume",
      model: modelName,
      provider: "google",
      latencyMs,
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
      totalTokens: response.usageMetadata?.totalTokenCount,
    });

    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
    const raw = JSON.parse(cleanedText) as Record<string, any>;

    // Normalize and sanitize into Phase 1 profile schema
    const activities: ActivityItem[] = Array.isArray(raw.activities)
      ? raw.activities.map((act: any) => ({
          id: `act_${crypto.randomUUID()}`,
          title: sanitizeText(act.title) || "Activity",
          organization: sanitizeText(act.organization) || "",
          category: normalizeCategory(act.category),
          date_range: sanitizeText(act.date_range) || undefined,
          description: sanitizeText(act.description) || undefined,
        }))
      : [];

    const honors_awards: HonorAwardItem[] = Array.isArray(raw.honors_awards)
      ? raw.honors_awards.map((h: any) => ({
          id: `honor_${crypto.randomUUID()}`,
          title: sanitizeText(h.title) || "Award",
          issuer_or_level: normalizeHonorLevel(h.issuer_or_level),
          year: sanitizeText(h.year) || new Date().getFullYear().toString(),
        }))
      : [];

    const skills_and_tools: string[] = Array.isArray(raw.skills_and_tools)
      ? raw.skills_and_tools
          .map((s: any) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean)
      : [];

    const academic_interests: string[] = Array.isArray(raw.academic_interests)
      ? raw.academic_interests
          .map((i: any) => (typeof i === "string" ? i.trim() : ""))
          .filter(Boolean)
      : [];

    const languages: LanguageItem[] = Array.isArray(raw.languages)
      ? raw.languages
          .filter((l: any) => l && typeof l.language === "string")
          .map((l: any) => ({
            id: `lang_${crypto.randomUUID()}`,
            language: l.language.trim(),
            proficiency: normalizeLanguageProficiency(l.proficiency),
          }))
      : [];

    let academic_stats: AcademicStats | null = null;
    if (raw.academic_stats && typeof raw.academic_stats === "object") {
      const coursework = Array.isArray(raw.academic_stats.advanced_coursework)
        ? raw.academic_stats.advanced_coursework
            .map((c: any) => (typeof c === "string" ? c.trim() : ""))
            .filter(Boolean)
        : [];

      academic_stats = {
        unweighted_gpa: sanitizeNumber(raw.academic_stats.unweighted_gpa),
        weighted_gpa: sanitizeNumber(raw.academic_stats.weighted_gpa),
        advanced_coursework: coursework.length > 0 ? coursework : undefined,
      };
    }

    const social_links: SocialLinks = {
      github_url: sanitizeText(raw.social_links?.github_url),
      linkedin_url: sanitizeText(raw.social_links?.linkedin_url),
      portfolio_url: sanitizeText(raw.social_links?.portfolio_url),
    };

    return {
      first_name: sanitizeText(raw.first_name),
      last_name: sanitizeText(raw.last_name),
      preferred_name: sanitizeText(raw.preferred_name),
      institution: sanitizeText(raw.institution),
      education_level: normalizeEducationLevel(raw.education_level),
      major: sanitizeText(raw.major),
      graduation_year: sanitizeText(raw.graduation_year),
      bio: sanitizeText(raw.bio),
      academic_stats,
      activities,
      honors_awards,
      skills_and_tools,
      academic_interests,
      languages,
      social_links,
    };
  } catch (err: any) {
    void ai.trackAiMessage({
      content: "",
      sessionId: "schollective-resume",
      model: modelName,
      provider: "google",
      latencyMs: performance.now() - startTime,
      isError: true,
      errorMessage: err?.message || "Unknown error during resume parsing",
    });
    throw err;
  }
}

export interface CurrentProfileDraft {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  institution?: string | null;
  education_level?: string | null;
  major?: string | null;
  graduation_year?: string | null;
  bio?: string | null;
  academic_stats?: AcademicStats | null;
  activities?: ActivityItem[] | null;
  honors_awards?: HonorAwardItem[] | null;
  skills_and_tools?: string[] | null;
  academic_interests?: string[] | null;
  languages?: LanguageItem[] | null;
  social_links?: SocialLinks | null;
}

/**
 * Merges parsed resume information into an existing profile draft non-destructively:
 * - Preserves existing non-empty primitive strings
 * - Deduplicates incoming array items (coursework, activities, honors, skills, interests)
 */
export function mergeResumeIntoProfile(
  current: CurrentProfileDraft,
  incoming: ParsedResumeProfile
): CurrentProfileDraft {
  const isFilled = (val?: string | null) => Boolean(val && val.trim());

  // Existing advanced coursework
  const existingCourses = current.academic_stats?.advanced_coursework || [];
  const existingCourseSet = new Set(existingCourses.map((c) => c.toLowerCase().trim()));
  const newCourses = (incoming.academic_stats?.advanced_coursework || []).filter(
    (c) => c.trim() && !existingCourseSet.has(c.toLowerCase().trim())
  );

  // Existing activities
  const existingActivities = current.activities || [];
  const existingActivitySet = new Set(
    existingActivities.map((a) => (a.title || "").toLowerCase().trim()).filter(Boolean)
  );
  const newActivities = (incoming.activities || []).filter(
    (a) => a.title && !existingActivitySet.has((a.title || "").toLowerCase().trim())
  );

  // Existing honors
  const existingHonors = current.honors_awards || [];
  const existingHonorSet = new Set(
    existingHonors.map((h) => (h.title || "").toLowerCase().trim()).filter(Boolean)
  );
  const newHonors = (incoming.honors_awards || []).filter(
    (h) => h.title && !existingHonorSet.has((h.title || "").toLowerCase().trim())
  );

  // Existing skills
  const existingSkills = current.skills_and_tools || [];
  const existingSkillSet = new Set(existingSkills.map((s) => s.toLowerCase().trim()).filter(Boolean));
  const newSkills = (incoming.skills_and_tools || []).filter(
    (s) => s.trim() && !existingSkillSet.has(s.toLowerCase().trim())
  );

  // Existing interests
  const existingInterests = current.academic_interests || [];
  const existingInterestSet = new Set(existingInterests.map((i) => i.toLowerCase().trim()).filter(Boolean));
  const newInterests = (incoming.academic_interests || []).filter(
    (i) => i.trim() && !existingInterestSet.has(i.toLowerCase().trim())
  );

  // Existing languages
  const existingLanguages = current.languages || [];
  const existingLanguageSet = new Set(existingLanguages.map((l) => l.language.toLowerCase().trim()).filter(Boolean));
  const newLanguages = (incoming.languages || []).filter(
    (l) => l.language && !existingLanguageSet.has(l.language.toLowerCase().trim())
  );

  return {
    first_name: isFilled(current.first_name) ? current.first_name : incoming.first_name || current.first_name || "",
    last_name: isFilled(current.last_name) ? current.last_name : incoming.last_name || current.last_name || "",
    preferred_name: isFilled(current.preferred_name) ? current.preferred_name : incoming.preferred_name || current.preferred_name || "",
    institution: isFilled(current.institution) ? current.institution : incoming.institution || current.institution || "",
    education_level: isFilled(current.education_level) && current.education_level !== "high-school-senior"
      ? current.education_level
      : incoming.education_level || current.education_level || "high-school-senior",
    major: isFilled(current.major) ? current.major : incoming.major || current.major || "",
    graduation_year: isFilled(current.graduation_year) ? current.graduation_year : incoming.graduation_year || current.graduation_year || "",
    bio: isFilled(current.bio) ? current.bio : incoming.bio || current.bio || "",
    academic_stats: {
      unweighted_gpa: current.academic_stats?.unweighted_gpa || incoming.academic_stats?.unweighted_gpa,
      weighted_gpa: current.academic_stats?.weighted_gpa || incoming.academic_stats?.weighted_gpa,
      advanced_coursework: [...existingCourses, ...newCourses],
    },
    activities: [...existingActivities, ...newActivities],
    honors_awards: [...existingHonors, ...newHonors],
    skills_and_tools: [...existingSkills, ...newSkills],
    academic_interests: [...existingInterests, ...newInterests],
    languages: [...existingLanguages, ...newLanguages],
    social_links: {
      ...incoming.social_links,
      ...current.social_links,
    },
  };
}
