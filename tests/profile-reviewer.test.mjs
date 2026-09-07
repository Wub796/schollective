import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

let cachedReviewerModule = null;
let cachedJobsModule = null;

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
            contents: "export const sql = () => {}; export const ensureAuthSchema = async () => {};",
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

test("Troll detection penalizes nonsense or empty submissions below 35% without an artificial floor", async () => {
  const { isTrollSubmission, generateRuleBasedProfileReview } = await loadReviewer();

  const trollProfiles = [
    { bio: "asdf", institution: "", academic_interests: [], extracurriculars: [] },
    { bio: "lol", institution: "", academic_interests: ["test"], extracurriculars: [] },
    { bio: "aaaaaaaaaaaaaaa", institution: "", academic_interests: [], extracurriculars: [] },
    { bio: "", institution: "", academic_interests: [], extracurriculars: [] },
  ];

  for (const profile of trollProfiles) {
    assert.equal(isTrollSubmission(profile), true);
    const result = generateRuleBasedProfileReview(profile, "", "", "");
    assert.equal(result.status, "Needs Edits");
    assert.ok(result.pillar_scores.academic_rigor < 35, `Expected <35 but got ${result.pillar_scores.academic_rigor}`);
    assert.ok(result.pillar_scores.domain_alignment < 35, `Expected <35 but got ${result.pillar_scores.domain_alignment}`);
    assert.ok(result.pillar_scores.leadership_initiative < 35, `Expected <35 but got ${result.pillar_scores.leadership_initiative}`);
    assert.ok(result.pillar_scores.completeness < 35, `Expected <35 but got ${result.pillar_scores.completeness}`);
  }
});

test("Negative constraint sanitizer strips forbidden punctuation (em-dashes, en-dashes, semicolons, exclamations)", async () => {
  const { sanitizeReviewText } = await loadReviewer();

  const rawText = "Great start! This is a test—with an em-dash and an en-dash – right here; let's check!";
  const cleaned = sanitizeReviewText(rawText);

  assert.ok(!cleaned.includes("—"), "Must not contain em-dash");
  assert.ok(!cleaned.includes("–"), "Must not contain en-dash");
  assert.ok(!cleaned.includes(";"), "Must not contain semicolons");
  assert.ok(!cleaned.includes("!"), "Must not contain exclamation points");
  assert.ok(!cleaned.toLowerCase().includes("great start"), "Must not contain conversational filler");
});

test("Negative constraint sanitizer replaces forbidden words from the strict ban list", async () => {
  const { sanitizeReviewText } = await loadReviewer();

  const rawWithBanned = "Delve into this tapestry to leverage a robust synergy that will foster and showcase your passion for biology.";
  const cleaned = sanitizeReviewText(rawWithBanned);

  const bannedWords = ["delve", "tapestry", "leverage", "robust", "synergy", "foster", "showcase", "passion for"];
  for (const word of bannedWords) {
    assert.ok(!cleaned.toLowerCase().includes(word), `Cleaned text must not contain '${word}', got: ${cleaned}`);
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

test("Legacy database review records adapt cleanly into the 4-pillar ProfileReviewOutput schema", async () => {
  const { adaptLegacyReviewResult } = await loadJobs();

  const legacyPayload = {
    overallScore: 84,
    clarityScore: 88,
    academicToneScore: 82,
    alignmentScore: 90,
    completenessScore: 85,
    summary: "Strong candidate profile ready for professor outreach.",
    strengths: ["Clear interest in neuroscience", "Strong research background"],
    improvements: [
      { field: "Short Bio", issue: "Too brief", suggestion: "Add details about lab experiments" },
    ],
    suggestedInterests: ["Neuroscience", "Computational Biology"],
    outreachReadiness: "ready",
  };

  const adapted = adaptLegacyReviewResult(legacyPayload);

  assert.equal(adapted.status, "Ready for Outreach");
  assert.ok(adapted.pillar_scores.academic_rigor > 0);
  assert.ok(adapted.pillar_scores.domain_alignment === 90);
  assert.ok(adapted.pillar_scores.completeness === 85);
  assert.deepEqual(adapted.strengths, ["Clear interest in neuroscience", "Strong research background"]);
  assert.ok(adapted.flags[0].includes("Short Bio:"));
  assert.ok(adapted.next_steps[0].includes("Add details about lab experiments"));
  assert.deepEqual(adapted.recommended_topics, ["Neuroscience", "Computational Biology"]);
});
