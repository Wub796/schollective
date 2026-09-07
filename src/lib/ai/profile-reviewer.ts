import { executeWithGeminiFailover } from "./client";
import { PillarScores, ProfileReviewOutput } from "./types";
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

// Word ban list as per prompt guidelines
const BANNED_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdelve\s+into\b/gi, "explore"],
  [/\bdelve\b/gi, "explore"],
  [/\btestament\s+to\b/gi, "evidence of"],
  [/\btestament\b/gi, "evidence"],
  [/\bfoster(?:ing|ed|s)?\b/gi, "build"],
  [/\bshowcase(?:ing|ed|s)?\b/gi, "highlight"],
  [/\btapestry\b/gi, "combination"],
  [/\bmultifaceted\b/gi, "varied"],
  [/\bleverage(?:ing|ed|s)?\b/gi, "use"],
  [/\bbeacon\b/gi, "example"],
  [/\bsynergy\b/gi, "alignment"],
  [/\bholistic(?:ally)?\b/gi, "complete"],
  [/\bbaseline\b/gi, "foundation"],
  [/\brobust(?:ly)?\b/gi, "strong"],
  [/\boptimize(?:ing|ed|s)?\b/gi, "refine"],
  [/\belevate(?:ing|ed|s)?\b/gi, "strengthen"],
  [/\bpassion\s+for\b/gi, "interest in"],
  [/\bdedicated\s+to\b/gi, "focused on"],
];

const CONVERSATIONAL_FILLERS = [
  /^(?:great\s+start|keep\s+it\s+up|let'?s\s+dive\s+in|i\s+noticed)[\s,.:;!-]*/i,
  /\b(?:great\s+start|keep\s+it\s+up|let'?s\s+dive\s+in|i\s+noticed)\b/gi,
];

/**
 * Deterministic text sanitizer enforcing style constraints:
 * - Zero em-dashes (—) and en-dashes (–)
 * - Zero semicolons (;)
 * - Zero exclamation marks (!)
 * - Word ban replacements
 * - Strips conversational fillers
 * - Clamps sentences to <= 22 words
 */
export function sanitizeReviewText(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let text = raw
    .replace(/[—–]/g, " - ")
    .replace(/;/g, ".")
    .replace(/!+/g, ".");

  for (const filler of CONVERSATIONAL_FILLERS) {
    text = text.replace(filler, "");
  }

  for (const [pattern, replacement] of BANNED_WORD_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  // Normalize duplicate spaces and clean periods
  text = text.replace(/\s+/g, " ").replace(/\s*\.\s*\./g, ".").trim();

  // Enforce sentence word limit: max 22 words per sentence
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const constrainedSentences = sentences.map((sentence) => {
    const cleanSentence = sentence.replace(/[.?!]$/, "");
    const words = cleanSentence.split(/\s+/).filter(Boolean);
    if (words.length > 22) {
      return words.slice(0, 22).join(" ") + ".";
    }
    return cleanSentence ? `${cleanSentence}.` : "";
  });

  return constrainedSentences.filter(Boolean).join(" ");
}

/**
 * Validates whether a profile is a troll, nonsensical, or joke submission.
 * Checks for minimal substantive content (<15 chars) or repetitive characters.
 */
export function isTrollSubmission(profile: StudentProfileData): boolean {
  const bio = (profile.bio || "").trim();
  const interests = Array.isArray(profile.academic_interests)
    ? profile.academic_interests.join(" ")
    : typeof profile.academic_interests === "string"
    ? profile.academic_interests
    : "";
  const extras = Array.isArray(profile.extracurriculars)
    ? profile.extracurriculars.join(" ")
    : typeof profile.extracurriculars === "string"
    ? profile.extracurriculars
    : "";
  const coursework = Array.isArray(profile.coursework)
    ? profile.coursework.join(" ")
    : typeof profile.coursework === "string"
    ? profile.coursework
    : "";
  const skills = Array.isArray(profile.skills_and_tools)
    ? profile.skills_and_tools.join(" ")
    : typeof profile.skills_and_tools === "string"
    ? profile.skills_and_tools
    : "";

  const combined = `${bio} ${interests} ${extras} ${coursework} ${skills}`.toLowerCase().replace(/\s+/g, "");

  // Empty or less than 15 total characters across all content fields
  if (combined.length < 15) return true;

  // Known troll tokens or repeated single character strings
  const trollStrings = ["asdf", "qwerty", "lol", "lmao", "fake", "none", "test", "idk", "nothing", "haha"];
  if (trollStrings.includes(combined)) return true;

  // Check character repetition (e.g. "aaaaaaaaaaaaaaa" or "11111111111")
  const uniqueChars = new Set(combined.split(""));
  if (uniqueChars.size <= 2 && combined.length > 8) return true;

  return false;
}

function normaliseScore(value: unknown, fallback = 50): number {
  const numeric = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(numeric) ? Math.round(Math.max(0, Math.min(100, numeric))) : fallback;
}

function normaliseStringList(value: unknown, maxItems: number, maxItemWords = 22): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeReviewText(item))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normaliseSummary(summary: unknown): string {
  if (typeof summary !== "string") {
    return "Your profile is registered with basic details. Add specific coursework and technical project highlights to prepare for faculty outreach.";
  }
  const cleaned = sanitizeReviewText(summary);
  const sentences = cleaned.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length >= 2) {
    return `${sentences[0]} ${sentences[1]}`;
  }
  if (sentences.length === 1) {
    return `${sentences[0]} Expand your profile with coursework and lab projects to attract faculty mentors.`;
  }
  return "Your profile is registered with basic details. Add specific coursework and technical project highlights to prepare for faculty outreach.";
}

function normaliseProfileReviewOutput(raw: Record<string, unknown>): ProfileReviewOutput {
  const rawPillars = (raw.pillar_scores && typeof raw.pillar_scores === "object" ? raw.pillar_scores : {}) as Record<string, unknown>;

  const pillarScores: PillarScores = {
    academic_rigor: normaliseScore(rawPillars.academic_rigor ?? raw.academicRigor ?? raw.clarityScore, 65),
    domain_alignment: normaliseScore(rawPillars.domain_alignment ?? raw.domainAlignment ?? raw.alignmentScore, 65),
    leadership_initiative: normaliseScore(rawPillars.leadership_initiative ?? raw.leadershipInitiative ?? raw.academicToneScore, 60),
    completeness: normaliseScore(rawPillars.completeness ?? raw.completenessScore, 50),
  };

  const avg = Math.round(
    (pillarScores.academic_rigor +
      pillarScores.domain_alignment +
      pillarScores.leadership_initiative +
      pillarScores.completeness) /
      4
  );

  const isReady =
    pillarScores.academic_rigor >= 75 &&
    pillarScores.domain_alignment >= 75 &&
    pillarScores.leadership_initiative >= 75 &&
    pillarScores.completeness >= 75 &&
    avg >= 80;

  const status = isReady ? "Ready for Outreach" : "Needs Edits";

  const strengths = normaliseStringList(raw.strengths, 3);
  const flags = normaliseStringList(raw.flags ?? raw.improvements, 3);
  const nextSteps = normaliseStringList(raw.next_steps ?? raw.suggestions, 3);
  const recommendedTopics = normaliseStringList(raw.recommended_topics ?? raw.suggestedInterests, 4);

  return {
    status,
    summary: normaliseSummary(raw.summary),
    pillar_scores: pillarScores,
    strengths: strengths.length > 0 ? strengths : ["Registered academic institution and basic standing."],
    flags: flags.length > 0 ? flags : ["Provide tangible metrics and specific tools for current projects."],
    next_steps: nextSteps.length > 0 ? nextSteps : ["Add relevant advanced coursework and software tools."],
    recommended_topics: recommendedTopics.length > 0 ? recommendedTopics : ["Computer Science", "Biology", "Mathematics", "Physics"],
  };
}

/**
 * Reviews a student profile using Gemini AI with Harvard 1-6 curve distribution,
 * strict negative constraints, troll detection, and deterministic fallback.
 */
export async function reviewStudentProfile(
  profile: StudentProfileData
): Promise<ProfileReviewOutput> {
  // 1. Immediate deterministic troll protection
  if (isTrollSubmission(profile)) {
    return generateTrollReviewOutput();
  }

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

  const courseworkList = Array.isArray(profile.coursework)
    ? profile.coursework.join(", ")
    : typeof profile.coursework === "string"
    ? profile.coursework
    : "";

  const skillsList = Array.isArray(profile.skills_and_tools)
    ? profile.skills_and_tools.join(", ")
    : typeof profile.skills_and_tools === "string"
    ? profile.skills_and_tools
    : "";

  const sanitizedBio = sanitizeAiPromptInput(profile.bio, 400);
  const sanitizedInst = sanitizeAiPromptInput(profile.institution, 100);
  const sanitizedLevel = sanitizeAiPromptInput(profile.education_level, 60);
  const sanitizedInterests = sanitizeAiPromptInput(interestsList, 300);
  const sanitizedExtras = sanitizeAiPromptInput(extrasList, 800);
  const sanitizedCoursework = sanitizeAiPromptInput(courseworkList, 400);
  const sanitizedSkills = sanitizeAiPromptInput(skillsList, 300);

  const profileKey = `${profile.id || profile.email || "anon"}_${sanitizedBio}_${sanitizedInterests}_${sanitizedExtras}_${sanitizedCoursework}_${sanitizedLevel}_${sanitizedInst}`;
  const cacheKey = `profile_review_v7_curved_${profileKey}`;
  const cached = getCachedAiResult<ProfileReviewOutput>(cacheKey);
  if (cached) {
    return cached;
  }

  const systemPrompt = `You are a senior undergraduate researcher and graduate lab mentor evaluating a student cold-email pitch on Schollective.
Be direct, grounded, honest, and encouraging without false cheerleading.

CALIBRATION CURVE & SCORE BENCHMARKS (Harvard admissions 1-6 scale):
- 92-100 (Exceptional / Rare Top Tier): National/international olympiads (USAMO, USACO Platinum, ISEF finalist), first-author peer-reviewed paper, or rare state/national distinction with rigorous coursework.
- 78-91 (Strong / Ready for Lab Outreach): Rigorous AP/IB/Dual enrollment coursework, focused domain alignment, multi-year leadership or sustained technical craft.
- 65-77 (Developing / Baseline): Typical starting student profile with solid fundamentals but vague project descriptions, missing metrics, or scattered interests.
- 40-64 (Thin / Underdeveloped): Sparse coursework, generic club participation, or lack of project highlights.
- 0-35 (Troll / Bad-Faith Submissions): One-word inputs, nonsensical text, joke profiles. Do NOT protect fake entries with an artificial score floor.

STRICT WRITING STYLE CONSTRAINTS:
1. Zero em-dashes (—) and zero en-dashes (–). Use standard hyphens or commas only.
2. Zero semicolons (;). Use periods or separate sentences.
3. Zero exclamation marks (!). Use periods.
4. Sentence length cap: maximum 22 words per sentence.
5. No conversational filler like "Great start", "Keep it up", "Let's dive in", or "I noticed".
6. FORBIDDEN WORDS: Do not use delve, testament, foster, showcase, tapestry, multifaceted, leverage, beacon, synergy, holistic, baseline, robust, optimize, elevate, "passion for", or "dedicated to".
7. Mandatory concrete rewrites: every critique must specify the exact section and suggest precise tools, datasets, or metrics.
8. The summary must be EXACTLY 2 sentences, with at most 22 words in each sentence.

STUDENT PROFILE DATA:
- Institution: "${sanitizedInst || "Not specified"}"
- Education Level: "${sanitizedLevel || "Not specified"}"
- Short Bio: "${sanitizedBio || "Empty"}"
- Academic Interests: "${sanitizedInterests || "Empty"}"
- Extracurriculars & Honors: "${sanitizedExtras || "Empty"}"
- Coursework: "${sanitizedCoursework || "Empty"}"
- Technical Skills & Tools: "${sanitizedSkills || "Empty"}"

Return ONLY valid JSON matching this schema:
{
  "status": "Ready for Outreach" | "Needs Edits",
  "summary": "Exactly 2 sentences. Max 22 words each.",
  "pillar_scores": {
    "academic_rigor": number (0-100),
    "domain_alignment": number (0-100),
    "leadership_initiative": number (0-100),
    "completeness": number (0-100)
  },
  "strengths": ["2-3 genuine concrete hooks"],
  "flags": ["2-3 specific issues like vagueness or lack of metrics"],
  "next_steps": ["2-3 actionable rewrites naming specific tools or datasets"],
  "recommended_topics": ["3-4 clickable technical sub-field tags"]
}`;

  const callModel = async (modelName: string) => {
    const startTime = performance.now();
    try {
      const response = await executeWithGeminiFailover(async (gemini) => {
        return await gemini.models.generateContent({
          model: modelName,
          contents: systemPrompt,
          config: {
            responseMimeType: "application/json",
            maxOutputTokens: 800,
            temperature: 0.1,
          },
        });
      });

      const latencyMs = performance.now() - startTime;
      const text = response.text;
      if (!text) throw new Error(`Empty response from ${modelName}`);

      void ai.trackAiMessage({
        content: text,
        sessionId: "schollective",
        model: modelName,
        provider: "google",
        latencyMs,
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      });

      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanedText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Gemini returned an invalid profile review payload");
      }
      const normalised = normaliseProfileReviewOutput(parsed as Record<string, unknown>);

      setCachedAiResult(cacheKey, normalised, 15 * 60 * 1000);
      return normalised;
    } catch (err: any) {
      void ai.trackAiMessage({
        content: "",
        sessionId: "schollective",
        model: modelName,
        provider: "google",
        latencyMs: performance.now() - startTime,
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
      const fallbackResult = generateRuleBasedProfileReview(
        profile,
        sanitizedInterests,
        sanitizedExtras,
        sanitizedCoursework
      );
      setCachedAiResult(cacheKey, fallbackResult, 15 * 60 * 1000);
      return fallbackResult;
    }
  );
}

function generateTrollReviewOutput(): ProfileReviewOutput {
  return {
    status: "Needs Edits",
    summary: "Profile lacks verifiable academic context and coursework. Add genuine courses and project details to prepare for faculty review.",
    pillar_scores: {
      academic_rigor: 15,
      domain_alignment: 10,
      leadership_initiative: 10,
      completeness: 15,
    },
    strengths: ["Profile account was created."],
    flags: [
      "No authentic coursework or academic accomplishments provided.",
      "Entries are too brief to present to research faculty.",
    ],
    next_steps: [
      "Add your current math and science coursework under Academic Identity.",
      "Detail at least one technical project or laboratory experience under Activities.",
    ],
    recommended_topics: ["Computer Science", "Biology", "Mathematics", "Physics"],
  };
}

/**
 * Calibrated deterministic fallback scoring engine adhering to the Harvard 1-6 rubric.
 */
export function generateRuleBasedProfileReview(
  profile: StudentProfileData,
  interestsStr: string,
  extrasStr: string,
  courseworkStr: string
): ProfileReviewOutput {
  if (isTrollSubmission(profile)) {
    return generateTrollReviewOutput();
  }

  const bio = (profile.bio || "").trim();
  const inst = (profile.institution || "").trim();
  const level = (profile.education_level || "high-school-senior").trim().toLowerCase();

  const interests = interestsStr ? interestsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const extras = extrasStr ? extrasStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const coursework = courseworkStr ? courseworkStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const skills = Array.isArray(profile.skills_and_tools)
    ? profile.skills_and_tools
    : typeof profile.skills_and_tools === "string"
    ? profile.skills_and_tools.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // --- 1. Academic Rigor Scoring (0-100 Curved) ---
  const extrasLower = extrasStr.toLowerCase();
  const courseworkLower = courseworkStr.toLowerCase();
  const bioLower = bio.toLowerCase();
  const combinedText = `${extrasLower} ${courseworkLower} ${bioLower}`;

  const tier1Keywords = ["isef", "usamo", "usaco platinum", "usaco gold", "primes", "rsi", "first author", "peer reviewed", "chopin"];
  const tier2Keywords = ["usaco silver", "amc 10", "amc 12", "aime", "uil", "frc", "robotics lead", "science olympiad state", "co-author"];
  const apIbKeywords = ["ap ", "advanced placement", "ib ", "international baccalaureate", "multivariable", "linear algebra", "organic chemistry", "dual enrollment"];

  const hasTier1 = tier1Keywords.some((kw) => combinedText.includes(kw));
  const hasTier2 = tier2Keywords.some((kw) => combinedText.includes(kw));
  const apCount = apIbKeywords.filter((kw) => courseworkLower.includes(kw)).length + (coursework.length >= 3 ? 2 : 0);

  let academicRigor = 65; // Baseline starting score
  if (hasTier1) academicRigor = 94;
  else if (hasTier2) academicRigor = 84;
  else if (apCount >= 4) academicRigor = 80;
  else if (apCount >= 2) academicRigor = 74;
  else if (coursework.length === 0) academicRigor = 48;

  // --- 2. Domain Alignment (0-100 Curved) ---
  let domainAlignment = 62;
  const commonTech = ["python", "pytorch", "r", "c++", "cad", "crispr", "matlab", "java", "sql", "git"];
  const matchedTech = commonTech.filter((t) => skills.some((s) => s.toLowerCase().includes(t)) || combinedText.includes(t));

  if (interests.length >= 2 && matchedTech.length >= 2) {
    domainAlignment = 82;
  } else if (interests.length >= 1 && (matchedTech.length >= 1 || bio.length >= 60)) {
    domainAlignment = 72;
  } else if (interests.length === 0) {
    domainAlignment = 42;
  }

  // --- 3. Leadership & Initiative (0-100 Curved) ---
  let leadershipInitiative = 60;
  const leadershipKeywords = ["founder", "president", "captain", "lead", "organized", "creator", "developed", "published", "tutored"];
  const leadershipMatches = leadershipKeywords.filter((kw) => extrasLower.includes(kw) || bioLower.includes(kw));

  if (hasTier1 || leadershipMatches.length >= 2) {
    leadershipInitiative = 85;
  } else if (hasTier2 || leadershipMatches.length >= 1) {
    leadershipInitiative = 76;
  } else if (extras.length >= 2) {
    leadershipInitiative = 68;
  } else if (extras.length === 0) {
    leadershipInitiative = 35;
  }

  // --- 4. Completeness (0-100 Checklist) ---
  let completeness = 0;
  if (inst) completeness += 20;
  if (level) completeness += 20;
  if (bio.length >= 40) completeness += 20;
  if (interests.length >= 2) completeness += 20;
  if (extras.length >= 1 || coursework.length >= 1) completeness += 20;

  const pillarScores: PillarScores = {
    academic_rigor: Math.max(0, Math.min(100, academicRigor)),
    domain_alignment: Math.max(0, Math.min(100, domainAlignment)),
    leadership_initiative: Math.max(0, Math.min(100, leadershipInitiative)),
    completeness: Math.max(0, Math.min(100, completeness)),
  };

  const avg = Math.round(
    (pillarScores.academic_rigor +
      pillarScores.domain_alignment +
      pillarScores.leadership_initiative +
      pillarScores.completeness) /
      4
  );

  const isReady =
    pillarScores.academic_rigor >= 75 &&
    pillarScores.domain_alignment >= 75 &&
    pillarScores.leadership_initiative >= 75 &&
    pillarScores.completeness >= 75 &&
    avg >= 80;

  const status = isReady ? "Ready for Outreach" : "Needs Edits";

  const strengths: string[] = [];
  if (hasTier1) {
    strengths.push("Distinguished competition distinction signals strong lab readiness.");
  } else if (hasTier2) {
    strengths.push("Regional competition experience demonstrates sustained discipline.");
  } else if (apCount >= 2) {
    strengths.push("Rigorous coursework provides adequate quantitative background.");
  } else if (inst) {
    strengths.push(`Clear institutional affiliation with ${inst}.`);
  }

  if (matchedTech.length > 0) {
    strengths.push(`Technical proficiency in ${matchedTech.slice(0, 2).join(" and ")} directly supports lab workflows.`);
  } else if (interests.length >= 2) {
    strengths.push(`Focused academic interests in ${interests.slice(0, 2).join(" and ")}.`);
  }

  const flags: string[] = [];
  if (coursework.length === 0) {
    flags.push("Coursework section is empty. Faculty look for advanced math and science rigor.");
  }
  if (bio.length < 50) {
    flags.push("Research pitch is brief. Explain specific hypotheses and academic curiosity.");
  }
  if (matchedTech.length === 0) {
    flags.push("Missing concrete technical tools. List specific software packages or laboratory techniques.");
  }

  const nextSteps: string[] = [];
  if (coursework.length === 0) {
    nextSteps.push("Add AP or upper division math and science courses under Academic Identity.");
  }
  if (matchedTech.length === 0) {
    nextSteps.push("Specify data tools like Python, R, or PyTorch in your skills list.");
  }
  nextSteps.push("Quantify project outcomes with hours per week, lines of code, or data points analyzed.");

  const fallbackTopics = interests.length >= 2
    ? [interests[0], interests[1], "Computational Biology", "Applied Machine Learning"].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)
    : ["Computer Science", "Neuroscience", "Applied Mathematics", "Biomedical Engineering"];

  const summary = isReady
    ? "Your profile demonstrates strong academic preparation and clear research focus. It presents sufficient context for initial faculty outreach."
    : "Your profile provides a solid foundation with clear potential. Adding specific quantitative coursework and project metrics will strengthen your outreach.";

  return {
    status,
    summary: sanitizeReviewText(summary),
    pillar_scores: pillarScores,
    strengths: strengths.map(sanitizeReviewText).slice(0, 3),
    flags: flags.map(sanitizeReviewText).slice(0, 3),
    next_steps: nextSteps.map(sanitizeReviewText).slice(0, 3),
    recommended_topics: fallbackTopics.map(sanitizeReviewText).slice(0, 4),
  };
}
