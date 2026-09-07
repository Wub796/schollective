import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

let cachedModule = null;

async function loadResumeParser() {
  if (cachedModule) return cachedModule;

  const tempFile = path.join(os.tmpdir(), `resume_parser_${Date.now()}.mjs`);
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
        },
      },
    ],
  });

  cachedModule = await import(pathToFileURL(tempFile).href);
  try {
    fs.unlinkSync(tempFile);
  } catch {}
  return cachedModule;
}

test("normalizeEducationLevel correctly maps high school, undergrad, and grad terms", async () => {
  const { normalizeEducationLevel } = await loadResumeParser();

  assert.equal(normalizeEducationLevel("12th Grade / Senior"), "high-school-senior");
  assert.equal(normalizeEducationLevel("High School Junior"), "high-school-junior");
  assert.equal(normalizeEducationLevel("Sophomore (High School)"), "high-school-underclassman");
  assert.equal(normalizeEducationLevel("College Freshman"), "undergraduate-lower");
  assert.equal(normalizeEducationLevel("Undergraduate Senior"), "high-school-senior"); // senior matches senior
  assert.equal(normalizeEducationLevel("PhD Candidate in Robotics"), "graduate");
  assert.equal(normalizeEducationLevel("Postdoctoral Fellow"), "postdoc");
  assert.equal(normalizeEducationLevel("Unknown Entity"), "other");
  assert.equal(normalizeEducationLevel(null), null);
});

test("normalizeCategory maps to Phase 1 valid categories", async () => {
  const { normalizeCategory } = await loadResumeParser();

  assert.equal(normalizeCategory("Research"), "Research");
  assert.equal(normalizeCategory("Genomics Research Lab Assistant"), "Research");
  assert.equal(normalizeCategory("Full-stack web developer"), "Software / Engineering Project");
  assert.equal(normalizeCategory("Science Olympiad Team Captain"), "Competition Team");
  assert.equal(normalizeCategory("Student Council President"), "School Club / Leadership");
  assert.equal(normalizeCategory("Varsity Track & Field"), "Fine Arts / Athletics");
  assert.equal(normalizeCategory("Hospital Volunteer"), "Work / Volunteer");
  assert.equal(normalizeCategory("Something completely different"), "Other");
  assert.equal(normalizeCategory(undefined), "Other");
});

test("normalizeHonorLevel maps to valid Phase 1 tiers", async () => {
  const { normalizeHonorLevel } = await loadResumeParser();

  assert.equal(normalizeHonorLevel("International"), "International");
  assert.equal(normalizeHonorLevel("National Merit Scholar"), "National");
  assert.equal(normalizeHonorLevel("State Science Fair 1st Place"), "State");
  assert.equal(normalizeHonorLevel("Regional Finalist"), "Regional");
  assert.equal(normalizeHonorLevel("School Honor Roll"), "School");
  assert.equal(normalizeHonorLevel("Unknown award"), "Other");
  assert.equal(normalizeHonorLevel(null), "Other");
});

test("normalizeLanguageProficiency maps to the 4 canonical options", async () => {
  const { normalizeLanguageProficiency } = await loadResumeParser();

  assert.equal(normalizeLanguageProficiency("Native"), "Native / Bilingual");
  assert.equal(normalizeLanguageProficiency("Fluent"), "Native / Bilingual");
  assert.equal(normalizeLanguageProficiency("Professional"), "Professional Working");
  assert.equal(normalizeLanguageProficiency("Conversational"), "Limited Working");
  assert.equal(normalizeLanguageProficiency("Intermediate"), "Limited Working");
  assert.equal(normalizeLanguageProficiency("Beginner / Elementary"), "Elementary");
  assert.equal(normalizeLanguageProficiency(""), "Professional Working");
});
