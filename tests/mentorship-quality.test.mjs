// Executable contract for src/lib/mentorship-quality.ts:
// The generic-outreach rejection promised on the for-professors page must
// catch copy-pasted template blasts while never rejecting a specific,
// individualised request — a false positive blocks a real student.
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mentorship-quality-"));
const outfile = path.join(tmp, "module.mjs");

await build({
  entryPoints: ["src/lib/mentorship-quality.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile,
  logLevel: "silent",
});

const { checkGenericOutreach } = await import(pathToFileURL(outfile).href);
fs.rmSync(tmp, { recursive: true, force: true });

test("rejects an obvious copy-pasted template blast", () => {
  const blast = [
    "Dear Professor,",
    "I hope this email finds you well. I am writing to inquire about opportunities in your esteemed lab.",
    "I have always been passionate about your renowned research, and I would be honored to join your group.",
    "Kindly consider my application.",
  ].join("\n");
  const result = checkGenericOutreach(blast, blast);
  assert.equal(result.allowed, false);
  assert.match(result.reason, /template/i);
});

test("allows a specific request that merely opens politely", () => {
  const background =
    "Third-year biology major, GPA 3.9. I completed your lab's CRISPR protocol in my genetic engineering class and " +
    "ran a 96-sample pilot with Python analysis in pandas. My project extended the fluorescence method from your 2024 paper.";
  const goals =
    "I want to reproduce figure 3 of your Nature paper on chromatin remodeling this fall 2026, then adapt the " +
    "pipeline to my own dataset of 200 participants. I can commit 15 hours per week.";
  const result = checkGenericOutreach(background, goals);
  assert.equal(result.allowed, true);
});

test("rejects content-thin goals when the text is templated", () => {
  const background =
    "I came across your profile and was very impressed by your prestigious research group. " +
    "I have always been passionate about science and hope this message finds you well, professor. " +
    "Your esteemed lab is renowned, and I would be honored to join your group. Kindly consider my application.";
  const result = checkGenericOutreach(background, "I would love to join your lab sometime soon.");
  assert.equal(result.allowed, false);
  assert.match(result.reason, /too brief|template/i);
});

test("rejects long text that names nothing concrete", () => {
  const vague =
    "I have been thinking a lot about the future and what I want to do with my life and my studies. " +
    "Your work seems really interesting to me and I feel like I could learn so much from someone with your " +
    "experience and wisdom. I am a hardworking person who loves to read and think about big questions every day.";
  const result = checkGenericOutreach(vague, vague);
  assert.equal(result.allowed, false);
  assert.match(result.reason, /specifics/i);
});

test("does not double-punish short requests", () => {
  // Below MIN_TOTAL_LENGTH the length validators upstream own the decision.
  const result = checkGenericOutreach("I love your lab.", "Can I join?");
  assert.equal(result.allowed, true);
});
