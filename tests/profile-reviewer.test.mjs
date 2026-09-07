import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

let cachedReviewerModule = null;
let cachedJobsModule = null;
let cachedResumeModule = null;

async function loadReviewer() {
  if (cachedReviewerModule) return cachedReviewerModule;

  const tempFile = path.join(os.tmpdir(), `reviewer_${Date.now()}_${Math.random().toString(36).substring(7)}.mjs`);
  await build({
    entryPoints: ["src/lib/ai/profile-reviewer.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: tempFile,
    logLevel: "silent",
    plugins: [
      {
        name: "test-stubs",
        setup(b) {
          b.onResolve({ filter: /^@google\/genai$/ }, (args) => ({
            path: args.path,
            namespace: "stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            loader: "js",
            contents: "export class GoogleGenAI {};",
          }));
          b.onResolve({ filter: /^@amplitude\/ai$/ }, (args) => ({
            path: args.path,
            namespace: "amplitude-stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "amplitude-stub" }, () => ({
            loader: "js",
            contents: `
              export class AIConfig { constructor(opts) { this.opts = opts; } }
              export class AmplitudeAI { trackAiMessage() {} }
            `,
          }));
        },
      },
    ],
  });

  cachedReviewerModule = await import(pathToFileURL(tempFile).href);
  try {
    fs.unlinkSync(tempFile);
  } catch {}
  return cachedReviewerModule;
}

async function loadJobs() {
  if (cachedJobsModule) return cachedJobsModule;

  const tempFile = path.join(os.tmpdir(), `jobs_${Date.now()}_${Math.random().toString(36).substring(7)}.mjs`);
  await build({
    entryPoints: ["src/lib/ai/profile-review-jobs.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: tempFile,
    logLevel: "silent",
    plugins: [
      {
        name: "test-stubs",
        setup(b) {
          b.onResolve({ filter: /^@google\/genai$/ }, (args) => ({
            path: args.path,
            namespace: "stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            loader: "js",
            contents: "export class GoogleGenAI {};",
          }));
          b.onResolve({ filter: /^@amplitude\/ai$/ }, (args) => ({
            path: args.path,
            namespace: "amplitude-stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "amplitude-stub" }, () => ({
            loader: "js",
            contents: `
              export class AIConfig { constructor(opts) { this.opts = opts; } }
              export class AmplitudeAI { trackAiMessage() {} }
            `,
          }));
          b.onResolve({ filter: /^@\/lib\/neon\// }, (args) => ({
            path: args.path,
            namespace: "neon-stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "neon-stub" }, () => ({
            loader: "js",
            contents: "export const sql = () => {}; export const ensureAuthSchema = async () => {}; export const runAs = (uid, fn) => fn();",
          }));
        },
      },
    ],
  });

  cachedJobsModule = await import(pathToFileURL(tempFile).href);
  try {
    fs.unlinkSync(tempFile);
  } catch {}
  return cachedJobsModule;
}

async function loadResumeParser() {
  if (cachedResumeModule) return cachedResumeModule;

  const tempFile = path.join(os.tmpdir(), `resume_${Date.now()}_${Math.random().toString(36).substring(7)}.mjs`);
  await build({
    entryPoints: ["src/lib/ai/resume-parser.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: tempFile,
    logLevel: "silent",
    plugins: [
      {
        name: "test-stubs",
        setup(b) {
          b.onResolve({ filter: /^@google\/genai$/ }, (args) => ({
            path: args.path,
            namespace: "stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            loader: "js",
            contents: "export class GoogleGenAI {};",
          }));
          b.onResolve({ filter: /^@amplitude\/ai$/ }, (args) => ({
            path: args.path,
            namespace: "amplitude-stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "amplitude-stub" }, () => ({
            loader: "js",
            contents: `
              export class AIConfig { constructor(opts) { this.opts = opts; } }
              export class AmplitudeAI { trackAiMessage() {} }
            `,
          }));
        },
      },
    ],
  });

  cachedResumeModule = await import(pathToFileURL(tempFile).href);
  try {
    fs.unlinkSync(tempFile);
  } catch {}
  return cachedResumeModule;
}

test("Troll detection penalizes nonsense or empty submissions below 35% without an artificial floor", async () => {
  const { isTrollSubmission, generateRuleBasedProfileReview } = await loadReviewer();

  const trollProfiles = [
    { bio: "asdf", institution: "", academic_interests: [], extracurriculars: [] },
    { bio: "lol", institution: "", academic_interests: ["test"], extracurriculars: [] },
    { bio: "aaaaaaaaaaaaaaa", institution: "", academic_interests: [], extracurriculars: [] },
    { bio: "", institution: "", academic_interests: [], extracurriculars: [] },
    { bio: "1", institution: "a", academic_interests: [], extracurriculars: [] },
  ];

  for (const profile of trollProfiles) {
    assert.equal(isTrollSubmission(profile), true, `Expected troll profile for ${JSON.stringify(profile)}`);
    const result = generateRuleBasedProfileReview(profile, "", "", "");
    assert.equal(result.status, "Needs Edits");
    assert.ok(result.pillar_scores.academic_rigor < 35, `Expected <35 but got ${result.pillar_scores.academic_rigor}`);
    assert.ok(result.pillar_scores.domain_alignment < 35, `Expected <35 but got ${result.pillar_scores.domain_alignment}`);
    assert.ok(result.pillar_scores.leadership_initiative < 35, `Expected <35 but got ${result.pillar_scores.leadership_initiative}`);
    assert.ok(result.pillar_scores.completeness < 35, `Expected <35 but got ${result.pillar_scores.completeness}`);
  }
});

test("Negative constraint sanitizer strips all forbidden punctuation (em-dashes, en-dashes, semicolons, exclamations)", async () => {
  const { sanitizeReviewText } = await loadReviewer();

  const rawText = "Great start! This is a test—with an em-dash and an en-dash – right here; let's check! Multiple exclamations!!!";
  const cleaned = sanitizeReviewText(rawText);

  assert.ok(!cleaned.includes("—"), "Must not contain em-dash");
  assert.ok(!cleaned.includes("–"), "Must not contain en-dash");
  assert.ok(!cleaned.includes(";"), "Must not contain semicolons");
  assert.ok(!cleaned.includes("!"), "Must not contain exclamation points");
  assert.ok(!cleaned.toLowerCase().includes("great start"), "Must not contain conversational filler");
});

test("Negative constraint sanitizer eliminates all 16 banned buzzwords from prompt requirements", async () => {
  const { sanitizeReviewText } = await loadReviewer();

  const bannedBuzzwords = [
    "delve",
    "testament",
    "foster",
    "showcase",
    "tapestry",
    "multifaceted",
    "leverage",
    "beacon",
    "synergy",
    "holistic",
    "baseline",
    "robust",
    "optimize",
    "elevate",
    "passion for",
    "dedicated to",
  ];

  for (const word of bannedBuzzwords) {
    const raw = `This is a clear ${word} in our research approach.`;
    const cleaned = sanitizeReviewText(raw);
    assert.ok(!cleaned.toLowerCase().includes(word), `Cleaned text must replace banned word '${word}', got: ${cleaned}`);
  }
});

test("Negative constraint sanitizer eliminates all conversational fillers", async () => {
  const { sanitizeReviewText } = await loadReviewer();

  const fillers = ["Great start!", "Keep it up!", "Let's dive in:", "I noticed that you have strong skills."];
  for (const filler of fillers) {
    const cleaned = sanitizeReviewText(filler);
    assert.ok(!cleaned.toLowerCase().includes("great start"));
    assert.ok(!cleaned.toLowerCase().includes("keep it up"));
    assert.ok(!cleaned.toLowerCase().includes("let's dive in"));
    assert.ok(!cleaned.toLowerCase().includes("i noticed"));
  }
});

test("Negative constraint sanitizer enforces sentence length cap (<= 22 words per sentence)", async () => {
  const { sanitizeReviewText } = await loadReviewer();

  const longSentence = "This is an extremely long sentence written by an applicant who continues to add extra unnecessary words beyond the twenty two word limit without pausing for breath or punctuation.";
  const cleaned = sanitizeReviewText(longSentence);

  const sentences = cleaned.split(/(?<=[.?!])\s+/).filter(Boolean);
  for (const sentence of sentences) {
    const wordCount = sentence.replace(/[.?!]$/, "").split(/\s+/).filter(Boolean).length;
    assert.ok(wordCount <= 22, `Sentence exceeded 22 words (${wordCount}): ${sentence}`);
  }
});

test("Calibrated 4-pillar rubric scores exceptional Tier-1 profiles into the 92-100 band", async () => {
  const { generateRuleBasedProfileReview } = await loadReviewer();

  const eliteProfile = {
    institution: "Stuyvesant High School",
    education_level: "high-school-senior",
    bio: "Focused on graph neural networks for molecular docking. Published first-author paper in computational biology.",
    academic_interests: ["Machine Learning", "Computational Biology"],
    extracurriculars: ["ISEF 1st Place Grand Award Winner in Computational Biology", "USACO Platinum Competitor"],
    coursework: ["AP Calculus BC", "AP Physics C", "Multivariable Calculus", "Linear Algebra"],
    skills_and_tools: ["Python", "PyTorch", "R", "Git"],
  };

  const result = generateRuleBasedProfileReview(
    eliteProfile,
    "Machine Learning, Computational Biology",
    "ISEF 1st Place Grand Award Winner, USACO Platinum Competitor",
    "AP Calculus BC, AP Physics C, Multivariable Calculus, Linear Algebra"
  );

  assert.equal(result.status, "Ready for Outreach");
  assert.ok(result.pillar_scores.academic_rigor >= 92, `Expected >=92, got ${result.pillar_scores.academic_rigor}`);
  assert.ok(result.pillar_scores.leadership_initiative >= 80, `Expected >=80, got ${result.pillar_scores.leadership_initiative}`);
  assert.ok(result.pillar_scores.domain_alignment >= 80, `Expected >=80, got ${result.pillar_scores.domain_alignment}`);
});

test("Database compatibility: Dirty legacy records with strings, percentages and alternative keys deserialize safely", async () => {
  const { adaptLegacyReviewResult } = await loadJobs();

  // Legacy dirty row containing strings like "20%", alternative keys, nulls
  const dirtyLegacyPayload = {
    overall: "84%",
    clarity: "88",
    academic_tone: "82%",
    domain_alignment: 90,
    completeness: "20%",
    summary: "Historical profile review summary.",
    strengths: ["Existing strength 1"],
    improvements: [{ field: "Bio", issue: "Too short", suggestion: "Add coursework" }],
    suggested_interests: ["Bioinformatics", "Neuroscience"],
    outreach_readiness: "ready",
  };

  const adapted = adaptLegacyReviewResult(dirtyLegacyPayload);

  assert.equal(adapted.status, "Ready for Outreach");
  // Ensure no NaNs exist
  assert.ok(!Number.isNaN(adapted.pillar_scores.academic_rigor));
  assert.ok(!Number.isNaN(adapted.pillar_scores.domain_alignment));
  assert.ok(!Number.isNaN(adapted.pillar_scores.leadership_initiative));
  assert.ok(!Number.isNaN(adapted.pillar_scores.completeness));

  assert.equal(adapted.pillar_scores.completeness, 20);
  assert.equal(adapted.pillar_scores.domain_alignment, 90);
  assert.deepEqual(adapted.recommended_topics, ["Bioinformatics", "Neuroscience"]);
});

test("Resume Merge Utility: preserves existing non-empty primitives and deduplicates arrays", async () => {
  const { mergeResumeIntoProfile } = await loadResumeParser();

  const existingDraft = {
    first_name: "Jane",
    last_name: "Doe",
    bio: "Pre-existing bio written by student.",
    institution: "MIT",
    academic_stats: {
      unweighted_gpa: "3.95",
      advanced_coursework: ["AP Calculus BC", "AP Physics C"],
    },
    activities: [
      { id: "act_1", title: "Robotics Club President", category: "School Club / Leadership" },
    ],
    skills_and_tools: ["Python", "Git"],
    academic_interests: ["Robotics"],
  };

  const incomingResume = {
    first_name: "Janet", // Should NOT overwrite "Jane"
    last_name: "Doe",
    bio: "Resume auto-generated bio.", // Should NOT overwrite existing bio
    institution: "Harvard", // Should NOT overwrite existing "MIT"
    major: "Computer Science", // Should populate empty major
    graduation_year: "2026", // Should populate empty grad year
    academic_stats: {
      unweighted_gpa: "3.80", // Should preserve existing "3.95"
      advanced_coursework: ["ap calculus bc", "Linear Algebra", "AP Chemistry"], // "ap calculus bc" duplicate must be dropped
    },
    activities: [
      { id: "act_new_1", title: "robotics club president", category: "Other" }, // Duplicate title (case-insensitive) dropped
      { id: "act_new_2", title: "Math Team Captain", category: "Competition Team" },
    ],
    skills_and_tools: ["python", "PyTorch", "C++"], // "python" duplicate dropped
    academic_interests: ["robotics", "Artificial Intelligence"], // "robotics" duplicate dropped
  };

  const merged = mergeResumeIntoProfile(existingDraft, incomingResume);

  // Assert primitive preservation
  assert.equal(merged.first_name, "Jane");
  assert.equal(merged.last_name, "Doe");
  assert.equal(merged.bio, "Pre-existing bio written by student.");
  assert.equal(merged.institution, "MIT");

  // Assert empty fields populated
  assert.equal(merged.major, "Computer Science");
  assert.equal(merged.graduation_year, "2026");

  // Assert GPA preservation
  assert.equal(merged.academic_stats.unweighted_gpa, "3.95");

  // Assert array deduplication
  assert.deepEqual(merged.academic_stats.advanced_coursework, [
    "AP Calculus BC",
    "AP Physics C",
    "Linear Algebra",
    "AP Chemistry",
  ]);

  const activityTitles = merged.activities.map((a) => a.title);
  assert.deepEqual(activityTitles, ["Robotics Club President", "Math Team Captain"]);

  assert.deepEqual(merged.skills_and_tools, ["Python", "Git", "PyTorch", "C++"]);
  assert.deepEqual(merged.academic_interests, ["Robotics", "Artificial Intelligence"]);
});
