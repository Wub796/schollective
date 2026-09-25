/**
 * The youth protection boundary in src/lib/youth-protection.ts.
 *
 * These are the assertions that matter for the rule itself, not for any one
 * screen. Three of them are the reason the module exists:
 *
 *   1. An adult-only thread is left alone. The rules are about minors, and a
 *      boundary that quietly grew to cover professors' ordinary messages would
 *      be turned off within a week.
 *   2. Ordinary academic writing survives. A lecture on consent, a paper about
 *      messenger RNA, a dataset on signal processing — the pattern list is drawn
 *      to catch the move toward a private channel, not the vocabulary of a
 *      subject. A false block here silences a lesson.
 *   3. The wiring is checked, not assumed. The rules only protect anyone if the
 *      send path calls them, so the last test reads the source and fails if a
 *      module that writes messages stops asking.
 *
 * The module is imported directly as TypeScript — Node strips the types natively
 * (22.18+/23+, and CI pins 24) — so these tests exercise the real exported
 * functions rather than a copy of them.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  ADULT_AGE,
  GUARDIAN_CONSENT_STATEMENT,
  GUARDIAN_CONSENT_VERSION,
  MINIMUM_AGE,
  SAFETY_CONCERN_CATEGORIES,
  SAFETY_REPORT_EMAIL,
  SAFETY_REPORT_MESSAGE_MAX,
  SAFETY_REPORT_MESSAGE_MIN,
  SAFETY_REPORT_STATUSES,
  URGENT_CONCERN_CATEGORIES,
  YOUTH_SAFETY_SECTIONS,
  ageBandFor,
  ageInYears,
  guardianConsentRequiredFor,
  isPresumedMinorEducationLevel,
  isSafetyConcernCategory,
  isUrgentConcern,
  minorThreadNotice,
  needsAgeStatement,
  parseDateOfBirth,
  resolveMinorFlag,
  reviewMentorMessage,
  summaryOfSnapshot,
  threadInvolvesMinor,
  validateGuardianConsent,
  validateSafetyReport,
} from "../src/lib/youth-protection.ts";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const MIGRATION_FILE = "0014_youth_protection.sql";
const MIGRATIONS = join(ROOT, "db", "migrations");

/** A minor thread, written by a mentor unless the case says otherwise. */
function mentorSays(text, senderRole = "professor") {
  return reviewMentorMessage({ text, senderRole, involvesMinor: true });
}

// ─────────────────────────────────────────────────────────────────
// WHO IS A MINOR
// ─────────────────────────────────────────────────────────────────

test("every high-school education level counts as a minor", () => {
  for (const level of [
    "high-school",
    "high-school-underclassman",
    "high-school-junior",
    "high-school-senior",
    "HIGH-SCHOOL-SENIOR",
    " high-school",
  ]) {
    assert.equal(isPresumedMinorEducationLevel(level), true, `${level} must count as a minor`);
  }
});

test("college and graduate students are not treated as minors", () => {
  for (const level of ["college", "undergraduate", "undergraduate-upper", "graduate", "phd"]) {
    assert.equal(isPresumedMinorEducationLevel(level), false, `${level} is not a minor signal`);
  }
});

test("an unknown or missing education level is not a block", () => {
  // The boundary fails open on purpose: "we do not know" must not become
  // "this professor cannot write to any student".
  for (const level of [null, undefined, "", "   ", "something-else"]) {
    assert.equal(isPresumedMinorEducationLevel(level), false);
  }
});

test("one minor on a group thread protects the whole thread", () => {
  assert.equal(threadInvolvesMinor(["college", "high-school-senior"]), true);
  assert.equal(threadInvolvesMinor(["college", "graduate"]), false);
  assert.equal(threadInvolvesMinor([]), false);
  assert.equal(threadInvolvesMinor([null, undefined]), false);
});

// ─────────────────────────────────────────────────────────────────
// THE RULES
// ─────────────────────────────────────────────────────────────────

test("an all-adult thread passes whatever is written on it", () => {
  // Two adults arranging a call on WhatsApp is not this platform's business.
  const adult = reviewMentorMessage({
    text: "Text me on WhatsApp at 555-867-5309, my gmail is jane@gmail.com",
    senderRole: "professor",
    involvesMinor: false,
  });
  assert.equal(adult.action, "pass");
  assert.deepEqual(adult.signals, []);
});

test("a mentor cannot ask a minor off the platform", () => {
  const cases = [
    "My number is 555-867-5309, call me whenever.",
    "Add me on Snapchat so we can talk more easily.",
    "Add me on discord: profjane",
    "just text me instead",
    "Let's take this off the platform.",
    "Email me at jane.smith@gmail.com and we'll sort it out.",
  ];
  for (const text of cases) {
    const result = mentorSays(text);
    assert.equal(result.action, "block", `should have blocked: ${text}`);
    assert.ok(result.reason && result.reason.length > 0, "a block needs a reason for the sender");
  }
});

test("a student sharing contact details is blocked with student-facing wording", () => {
  const result = mentorSays("you can reach me on my instagram or text 555-123-4567", "student");
  assert.equal(result.action, "block");
  assert.match(result.reason, /your safety/i);
  assert.match(result.reason, new RegExp(SAFETY_REPORT_EMAIL.replace(".", "\\.")));
});

test("secrecy, images and private meetings are blocked from anyone", () => {
  const cases = [
    "Don't tell your parents about this, it's between us.",
    "keep this between us for now",
    "Are you home alone right now?",
    "send me a picture",
    "Can you delete this conversation afterwards?",
    "Let's meet in private first.",
  ];
  for (const text of cases) {
    assert.equal(mentorSays(text).action, "block", `should have blocked: ${text}`);
    assert.equal(mentorSays(text, "student").action, "block", `student blocked too: ${text}`);
  }
});

test("an institutional address and a video link are allowed", () => {
  // Both are how research groups legitimately work, and neither is a private
  // channel. Blocking them would break the mentorship to protect nothing.
  const result = mentorSays(
    "Join our group lab meeting on Zoom at 4pm, or email me at j.smith@university.edu about the protocol.",
  );
  assert.equal(result.action, "pass", result.reason ?? "");
});

test("ordinary academic writing about difficult subjects is not blocked", () => {
  // The rule catches the move toward a private channel, never the vocabulary of
  // a subject. Every one of these is a normal sentence on a mentorship thread.
  const cases = [
    "This paper covers consent frameworks in clinical trials — read section 3 before Thursday.",
    "Our dataset is messenger RNA read counts; the signal processing is in the supplementary code.",
    "The literature seminar this week discusses depictions of violence in the novel.",
    "I will call the lab line when the sequencing finishes.",
    "Add me on the shared Zotero group when you get a chance.",
    "My office number is on my department page.",
    "Please do not tell your parents to skip the readings — tell me and we'll adjust the plan.",
  ];
  for (const text of cases) {
    const result = mentorSays(text);
    assert.equal(result.action, "pass", `should not have blocked: ${text} — ${result.reason ?? ""}`);
  }
});

// ─────────────────────────────────────────────────────────────────
// THE NOTICE AND THE PUBLISHED POLICY
// ─────────────────────────────────────────────────────────────────

test("the in-thread notice tells each side what it needs", () => {
  const mentor = minorThreadNotice("professor");
  const student = minorThreadNotice("student");
  assert.notEqual(mentor.headline, student.headline);
  // The mentor is told what not to do; the student is told what they may refuse
  // and who to tell.
  assert.match(mentor.detail, /do not ask/i);
  assert.match(student.detail, /parent|guardian|teacher/i);
  assert.match(student.detail, /report/i);
});

test("the published policy names the ages it enforces and how to report", () => {
  const published = YOUTH_SAFETY_SECTIONS.map((section) => `${section.title}\n${section.body}`).join("\n\n");

  assert.ok(YOUTH_SAFETY_SECTIONS.length >= 5, "the policy must cover the essentials");
  for (const section of YOUTH_SAFETY_SECTIONS) {
    assert.ok(section.title.trim().length > 0);
    assert.ok(section.body.trim().length > 0, `${section.title} has no body`);
  }

  // The thresholds appear in the prose from the constants, so changing one
  // changes the page rather than leaving it stating a number nobody enforces.
  assert.match(published, new RegExp(String(MINIMUM_AGE)));
  assert.match(published, new RegExp(String(ADULT_AGE - 1)));
  assert.match(published, new RegExp(SAFETY_REPORT_EMAIL.replace(".", "\\.")));
});

test("the /safety page renders the shared policy rather than its own copy", () => {
  // The same drift this project guards everywhere else: a policy page with its
  // own prose is a second source of truth, and the enforcement cannot be checked
  // against it. The page must read the module.
  const page = readFileSync(join(ROOT, "src", "app", "(public)", "safety", "page.tsx"), "utf8");
  assert.match(page, /YOUTH_SAFETY_SECTIONS/);
  assert.match(page, /SAFETY_REPORT_EMAIL/);
});

test("every module that writes a message asks the youth protection rules first", () => {
  // The rules protect nobody unless the send path calls them. This is the
  // failure the codebase keeps re-learning: a guard that exists and is never
  // invoked reads exactly like a guard that works.
  const sendActions = readFileSync(join(ROOT, "src", "app", "messages", "[id]", "actions.ts"), "utf8");
  assert.match(sendActions, /INSERT INTO messages/, "the send path moved — update this test");
  assert.match(sendActions, /reviewMentorMessage\s*\(/);
  assert.match(sendActions, /threadInvolvesMinor|threadHasMinorStudent/);
});

// ─────────────────────────────────────────────────────────────────
// AGE
// ─────────────────────────────────────────────────────────────────

/** A fixed "now" so these do not start failing on somebody's birthday. */
const NOW = new Date("2026-09-24T12:00:00Z");

function yearsAgo(years, { days = 0 } = {}) {
  const date = new Date(NOW);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

test("a date of birth is only accepted in the one unambiguous form", () => {
  assert.equal(parseDateOfBirth("2010-04-03"), "2010-04-03");
  assert.equal(parseDateOfBirth("  2010-04-03 "), "2010-04-03");

  // Ambiguous or impossible values are refused rather than guessed: this field
  // decides whether somebody is a child.
  for (const bad of [
    "03/04/2010", // March or April, depending on the reader
    "2010-02-31", // a date the regex accepts and Postgres would not
    "2010-4-3",
    "2010/04/03",
    "",
    "   ",
    null,
    undefined,
    20100403,
    "1899-12-31",
  ]) {
    assert.equal(parseDateOfBirth(bad), null, `should have refused: ${String(bad)}`);
  }
});

test("age is counted on the birthday, not around it", () => {
  assert.equal(ageInYears(yearsAgo(16), NOW), 16);
  assert.equal(ageInYears(yearsAgo(16, { days: 0 }), NOW), 16);
  // One day short of the seventeenth birthday is still 16.
  const tomorrow = new Date(NOW);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const turning17Tomorrow = new Date(tomorrow);
  turning17Tomorrow.setUTCFullYear(turning17Tomorrow.getUTCFullYear() - 17);
  assert.equal(ageInYears(turning17Tomorrow.toISOString().slice(0, 10), NOW), 16);

  assert.equal(ageInYears(null, NOW), null);
  assert.equal(ageInYears("nonsense", NOW), null);
});

test("the age bands hold at the two thresholds", () => {
  assert.equal(ageBandFor(yearsAgo(12), NOW), "under-minimum");
  assert.equal(ageBandFor(yearsAgo(13), NOW), "minor");
  assert.equal(ageBandFor(yearsAgo(17), NOW), "minor");
  assert.equal(ageBandFor(yearsAgo(18), NOW), "adult");
  assert.equal(ageBandFor(yearsAgo(40), NOW), "adult");
  assert.equal(ageBandFor(null, NOW), "unknown");
});

test("a guardian is required for exactly the minor band", () => {
  assert.equal(guardianConsentRequiredFor(yearsAgo(16), NOW), true);
  assert.equal(guardianConsentRequiredFor(yearsAgo(18), NOW), false);
  // Unknown is not "require consent": an account with no date of birth is asked
  // for one, and is not blocked while it has not answered.
  assert.equal(guardianConsentRequiredFor(null, NOW), false);
});

test("the recorded age wins over the education level, in both directions", () => {
  // This is the whole point of asking. A 19-year-old who picked "high school"
  // in tenth grade is an adult once they say so.
  assert.equal(resolveMinorFlag({ dateOfBirth: yearsAgo(19), educationLevel: "high-school-senior", now: NOW }), false);
  // And a 15-year-old who listed "college" is still a minor.
  assert.equal(resolveMinorFlag({ dateOfBirth: yearsAgo(15), educationLevel: "college", now: NOW }), true);
  // With no date of birth, the education level decides, exactly as before.
  assert.equal(resolveMinorFlag({ educationLevel: "high-school-junior", now: NOW }), true);
  assert.equal(resolveMinorFlag({ educationLevel: "graduate", now: NOW }), false);
  assert.equal(resolveMinorFlag({ now: NOW }), false);
});

test("only a student with no date of birth is asked for one", () => {
  assert.equal(needsAgeStatement({ role: "student", dateOfBirth: null }), true);
  assert.equal(needsAgeStatement({ role: "student", dateOfBirth: "" }), true);
  assert.equal(needsAgeStatement({ role: "student", dateOfBirth: yearsAgo(16) }), false);
  // Faculty are not asked: a verified institutional address reviewed by an admin
  // is what creates that account, and an adult is who it creates.
  assert.equal(needsAgeStatement({ role: "professor", dateOfBirth: null }), false);
  assert.equal(needsAgeStatement({ role: "admin", dateOfBirth: null }), false);
});

// ─────────────────────────────────────────────────────────────────
// GUARDIAN CONSENT
// ─────────────────────────────────────────────────────────────────

test("a consent needs a name, an address and an actual agreement", () => {
  const good = { guardianName: "Alex Rivera", guardianEmail: "Alex@Example.com", attested: true };
  const accepted = validateGuardianConsent(good);
  assert.equal(accepted.ok, true);
  assert.equal(accepted.value.version, GUARDIAN_CONSENT_VERSION);
  assert.equal(accepted.value.guardianEmail, "alex@example.com", "addresses are stored lowercased");

  for (const bad of [
    { ...good, guardianName: "" },
    { ...good, guardianName: "A" },
    { ...good, guardianEmail: "not-an-address" },
    { ...good, guardianEmail: "" },
    { ...good, attested: false },
    { ...good, attested: "true" }, // a string is not a tick
    { ...good, attested: undefined },
    {},
  ]) {
    const result = validateGuardianConsent(bad);
    assert.equal(result.ok, false, `should have refused: ${JSON.stringify(bad)}`);
    assert.ok(result.error.length > 0);
  }
});

test("the statement agrees to what the platform actually does", () => {
  // Not a wording test for its own sake: the sentence is the record of what was
  // agreed, so it has to name on-platform messaging and retention rather than a
  // general promise of safety.
  assert.match(GUARDIAN_CONSENT_STATEMENT, /parent or legal guardian/i);
  assert.match(GUARDIAN_CONSENT_STATEMENT, /stay on the platform/i);
  assert.match(GUARDIAN_CONSENT_STATEMENT, /kept/i);
});

// ─────────────────────────────────────────────────────────────────
// SAFETY REPORTS
// ─────────────────────────────────────────────────────────────────

test("a report needs a real category and a real description", () => {
  const good = { category: "boundaries", message: "He kept asking for my number after I said no." };
  assert.equal(validateSafetyReport(good).ok, true);

  assert.equal(validateSafetyReport({ ...good, category: "whatever" }).ok, false);
  assert.equal(validateSafetyReport({ ...good, message: "" }).ok, false);
  assert.equal(validateSafetyReport({}).ok, false);
  assert.equal(validateSafetyReport(null).ok, false);

  // The floor is deliberately tiny: "asked me for my number" is a complete
  // report, and a minimum that made somebody pad it would produce worse
  // evidence, not better.
  assert.ok(SAFETY_REPORT_MESSAGE_MIN <= 20);
});

test("a report keeps its thread and its subject only when they are ids", () => {
  const base = { category: "other", message: "Something else happened on this thread." };

  const withIds = validateSafetyReport({ ...base, requestId: "abc-123-def", reportedProfileId: "user_1" });
  assert.equal(withIds.ok, true);
  assert.equal(withIds.value.requestId, "abc-123-def");
  assert.equal(withIds.value.reportedProfileId, "user_1");

  const without = validateSafetyReport(base);
  assert.equal(without.ok, true);
  assert.equal(without.value.requestId, null);
  assert.equal(without.value.reportedProfileId, null);

  // A blank string is "not named", not a subject whose id is "".
  const blank = validateSafetyReport({ ...base, requestId: "   ", reportedProfileId: "" });
  assert.equal(blank.value.requestId, null);
  assert.equal(blank.value.reportedProfileId, null);
});

test("the urgent categories are a subset of the categories", () => {
  for (const category of URGENT_CONCERN_CATEGORIES) {
    assert.ok(isSafetyConcernCategory(category), `${category} is not a declared category`);
  }
  assert.ok(URGENT_CONCERN_CATEGORIES.length > 0, "nothing would ever be urgent");
  assert.equal(isUrgentConcern("self-harm"), true);
  assert.equal(isUrgentConcern("other"), false);
  assert.equal(isUrgentConcern("nonsense"), false);
});

test("the report's snapshot summary says what was captured", () => {
  assert.match(summaryOfSnapshot(0, false), /No messages/i);
  assert.match(summaryOfSnapshot(1, false), /1 message copied/);
  assert.match(summaryOfSnapshot(7, false), /7 messages copied/);
  // Truncated, so it must not read as a complete record.
  assert.match(summaryOfSnapshot(200, true), /the thread had more/i);
});

// ─────────────────────────────────────────────────────────────────
// THE MIGRATION, AND THE WIRING
// ─────────────────────────────────────────────────────────────────

/** Strips `--` comments, so a comment naming a value is not read as one. */
function stripComments(sql) {
  return sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

test("the migration's CHECK constraints mirror the exported vocabularies", () => {
  // The same drift guard tests/feedback.test.mjs applies to 0013: a category the
  // form can produce and the database would reject is a runtime-only failure
  // (23514) that no type and no lint can catch.
  const sql = stripComments(readFileSync(join(MIGRATIONS, MIGRATION_FILE), "utf8"));

  const categoryBlock = sql.match(/safety_reports_category_check CHECK \(category IN \(([\s\S]*?)\)\)/i);
  assert.ok(categoryBlock, "the category CHECK constraint is missing or was renamed");
  const categories = [...categoryBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(categories, [...SAFETY_CONCERN_CATEGORIES]);

  const statusBlock = sql.match(/safety_reports_status_check CHECK \(status IN \(([\s\S]*?)\)\)/i);
  assert.ok(statusBlock, "the status CHECK constraint is missing or was renamed");
  const statuses = [...statusBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(statuses, [...SAFETY_REPORT_STATUSES]);

  // The message bounds are repeated in SQL so a row cannot be created by a
  // query that bypassed the app; the two have to agree.
  assert.match(sql, new RegExp(`char_length\\(message\\) BETWEEN ${SAFETY_REPORT_MESSAGE_MIN} AND ${SAFETY_REPORT_MESSAGE_MAX}`));
});

test("the migration keeps the date of birth out of profiles", () => {
  const sql = stripComments(readFileSync(join(MIGRATIONS, MIGRATION_FILE), "utf8"));

  // The one invariant this file exists to hold. If a future edit moves the date
  // of birth onto `profiles`, it becomes reachable by the SELECT * in
  // src/lib/neon/profiles.ts and its row is handed to client components.
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.youth_protection/);
  assert.doesNotMatch(sql, /ALTER TABLE public\.profiles[\s\S]{0,120}date_of_birth/i);

  // Both report foreign keys must survive the accounts they name.
  const reportTable = sql.match(/CREATE TABLE IF NOT EXISTS public\.safety_reports \(([\s\S]*?)\n\);/);
  assert.ok(reportTable, "safety_reports was renamed");
  const setNull = [...reportTable[1].matchAll(/REFERENCES public\.profiles \(id\) ON DELETE (\w+)/g)].map((m) => m[1]);
  assert.deepEqual(setNull, ["SET", "SET"]);

  // And the evidence copy references nothing that cascades from profiles.
  const evidenceTable = sql.match(/CREATE TABLE IF NOT EXISTS public\.safety_report_evidence \(([\s\S]*?)\n\);/);
  assert.ok(evidenceTable, "safety_report_evidence was renamed");
  assert.doesNotMatch(evidenceTable[1], /REFERENCES public\.profiles/);
});

test("the migration documents itself in db/README.md", () => {
  const readme = readFileSync(join(ROOT, "db", "README.md"), "utf8");
  assert.match(readme, /0014/, "db/README.md does not mention migration 0014");
  assert.ok(readdirSync(MIGRATIONS).includes(MIGRATION_FILE), "the migration file is not in db/migrations");
});

test("the age endpoint refuses an under-13 and a minor without a guardian", () => {
  // The server is the authority, not the onboarding form: the form decides what
  // to show, and this decides what is stored.
  const route = readFileSync(join(ROOT, "src", "app", "api", "auth", "profile", "age", "route.ts"), "utf8");
  assert.match(route, /band === "under-minimum"/);
  assert.match(route, /validateGuardianConsent/);
  assert.match(route, /saveAgeAndConsent/);
  // And it must never believe an age the client asserts.
  assert.doesNotMatch(route, /body\.isMinor|raw\.isMinor|body\.band/);
});

test("a thread report is copied and a non-participant cannot file one", () => {
  const route = readFileSync(join(ROOT, "src", "app", "api", "safety", "route.ts"), "utf8");
  assert.match(route, /requireParticipant\(requestId, user\.id\)/);
  assert.match(route, /copyThreadIntoReportAsEvidence/);
  assert.match(route, /threadMinority/);
  // The report row is written before the copy, so a failed copy still leaves
  // something an admin can act on.
  assert.ok(
    route.indexOf("createSafetyReport(") < route.indexOf("copyThreadIntoReportAsEvidence("),
    "the evidence copy must happen after the report row exists",
  );
});

test("analytics are suppressed for a minor and fail closed", () => {
  const route = readFileSync(join(ROOT, "src", "app", "api", "me", "analytics", "route.ts"), "utf8");
  // Unknown means suppress: the cost of a wrong no is usage data, and the cost
  // of a wrong yes is a recording of a child.
  assert.match(route, /suppress: true, reason: "unknown"/);

  const consent = readFileSync(join(ROOT, "src", "lib", "consent.ts"), "utf8");
  // Consent is necessary and not sufficient.
  assert.match(consent, /optionalAnalyticsAllowed/);
  assert.match(consent, /return false;\s*\n  }\n}/, "the eligibility check must fail closed");
  assert.match(consent, /suppressOptionalAnalytics/);
});

test("the safety queue and the AI moderation queue are different components", () => {
  // They were one name for about ten minutes, and the dashboard's
  // AdminSafetyQueue is a flagged-account table that has nothing to do with
  // reports. A shared name here would mean one of them silently rendering the
  // other's props.
  const reportQueue = readFileSync(
    join(ROOT, "src", "components", "features", "AdminSafetyReportQueue.tsx"),
    "utf8",
  );
  assert.match(reportQueue, /AdminSafetyReportRow/);
});
