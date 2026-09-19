/**
 * The beta feedback pipeline: the validation in src/lib/feedback.ts and the
 * CHECK constraints in db/migrations/0013, which have to agree.
 *
 * Like the other schema tests here, this reads SQL as text — it cannot prove a
 * policy is right, but it catches the drift that is cheap to introduce and
 * silent in production: a category the form can produce and the database
 * rejects, a new state shipped without a CHECK that accepts it, or a new table
 * created without the RLS that keeps one person's report out of another's.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as F from "../src/lib/feedback.ts";

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(here, "..", "db", "migrations");
const MIGRATION_FILE = "0013_feedback_reports.sql";
const FEEDBACK = readFileSync(join(MIGRATIONS, MIGRATION_FILE), "utf8");

/** SQL with `--` comments removed, so prose cannot satisfy or break a match. */
function stripComments(sql) {
  return sql.replace(/--[^\n]*/g, "");
}

/** The quoted values of `CONSTRAINT <name> CHECK (<column> IN ('a', 'b'))`. */
function checkValues(sql, constraint) {
  const match = stripComments(sql).match(
    new RegExp(`CONSTRAINT ${constraint}\\s+CHECK \\(\\w+\\s+IN\\s*\\(([^)]*)\\)`, "i"),
  );
  assert.ok(match, `could not find CHECK constraint ${constraint}`);
  return [...match[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

// ── Validation ───────────────────────────────────────────────────────────────

test("a well-formed report survives validation intact", () => {
  const result = F.validateFeedbackReport({
    category: "bug",
    subject: "Notifications never clear",
    message: "I opened the bell, clicked one item, and the badge still says 3.",
    page: "/dashboard",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    category: "bug",
    subject: "Notifications never clear",
    message: "I opened the bell, clicked one item, and the badge still says 3.",
    page: "/dashboard",
  });
});

test("an unknown category is refused rather than silently reclassified", () => {
  const result = F.validateFeedbackReport({ category: "complaint", message: "This is long enough." });
  assert.equal(result.ok, false);
  assert.match(result.error, /bug, a suggestion or something else/);
});

test("a report shorter than the minimum names the minimum", () => {
  const result = F.validateFeedbackReport({ category: "idea", message: "fix it" });
  assert.equal(result.ok, false);
  assert.match(result.error, new RegExp(String(F.FEEDBACK_MESSAGE_MIN)));
});

test("the minimum is counted in code points, like the database's char_length", () => {
  // Five emoji are ten UTF-16 units and five characters. Counting units here
  // would pass validation and then fail the CHECK constraint as a 500.
  const emoji = "\u{1F600}".repeat(5);
  assert.equal(F.validateFeedbackReport({ category: "bug", message: emoji }).ok, false);

  const tenEmoji = "\u{1F600}".repeat(10);
  assert.equal(F.validateFeedbackReport({ category: "bug", message: tenEmoji }).ok, true);
});

test("a message never carries half a surrogate pair into the database", () => {
  // A lone surrogate is not valid UTF-8: TextEncoder turns it into U+FFFD and
  // Postgres may refuse the value outright, which would surface as a 500 from a
  // report that looked fine in the form. The odd leading "a" is what makes the
  // shared sanitiser's unit-based cap land in the middle of an emoji.
  const message = F.sanitiseFeedbackMessage("a" + "\u{1F600}".repeat(1500));

  assert.ok([...message].length <= F.FEEDBACK_MESSAGE_MAX, "still within the cap");
  assert.equal(
    new TextDecoder().decode(new TextEncoder().encode(message)),
    message,
    "no lone surrogate survived",
  );
  assert.match(message, /^a\u{1F600}+$/u, "the text that does survive is intact");
});

test("whitespace does not count towards the minimum length", () => {
  const padded = " ".repeat(50) + "no";
  assert.equal(F.validateFeedbackReport({ category: "bug", message: padded }).ok, false);
});

test("a message keeps its paragraphs and loses its markup", () => {
  const message = F.sanitiseFeedbackMessage(
    "First line.<br><script>alert(1)</script>\n\n\n\nSecond paragraph.\n\u0000",
  );

  assert.ok(!message.includes("<"), "tags are stripped");
  assert.ok(!message.includes("\u0000"), "control characters are stripped");
  assert.ok(!/\n{3}/.test(message), "runs of blank lines collapse");
  assert.match(message, /First line\.[\s\S]*Second paragraph\./);
  assert.equal(message.split("\n\n").length, 2, "the two paragraphs stay two paragraphs");
});

test("the message is capped at the documented maximum", () => {
  const long = "x".repeat(F.FEEDBACK_MESSAGE_MAX + 500);
  assert.equal(F.sanitiseFeedbackMessage(long).length <= F.FEEDBACK_MESSAGE_MAX, true);
});

test("the recorded page is an in-app path or nothing at all", () => {
  assert.equal(F.sanitiseFeedbackPage("/professors/abc123?tab=about"), "/professors/abc123?tab=about");
  assert.equal(F.sanitiseFeedbackPage("https://evil.test/x"), "", "an absolute URL is not a page");
  assert.equal(F.sanitiseFeedbackPage("//evil.test/x"), "", "protocol-relative is not a page either");
  assert.equal(F.sanitiseFeedbackPage("dashboard"), "");
  assert.equal(F.sanitiseFeedbackPage("/two words"), "");
  assert.equal(F.sanitiseFeedbackPage(undefined), "");
});

test("labels fall back rather than throwing on an unrecognised value", () => {
  assert.equal(F.feedbackCategoryLabel("idea"), "Suggestion");
  assert.equal(F.feedbackCategoryLabel("vandalism"), F.FEEDBACK_CATEGORY_LABELS.other);
  assert.equal(F.feedbackStatusLabel("closed"), "Closed");
  assert.equal(F.feedbackStatusLabel("gone"), F.FEEDBACK_STATUS_LABELS.new);
});

// ── Migration agreement ──────────────────────────────────────────────────────

test("the category CHECK accepts exactly the TypeScript vocabulary", () => {
  assert.deepEqual(checkValues(FEEDBACK, "feedback_reports_category_check"), [...F.FEEDBACK_CATEGORIES]);
});

test("the status CHECK accepts exactly the TypeScript vocabulary", () => {
  assert.deepEqual(checkValues(FEEDBACK, "feedback_reports_status_check"), [...F.FEEDBACK_STATUSES]);
});

test("the message-length CHECK matches FEEDBACK_MESSAGE_MIN and MAX", () => {
  const sql = stripComments(FEEDBACK);
  const match = sql.match(/CONSTRAINT feedback_reports_message_check\s+CHECK \(char_length\(message\) BETWEEN (\d+) AND (\d+)\)/i);
  assert.ok(match, "could not find the message-length CHECK");
  assert.equal(Number(match[1]), F.FEEDBACK_MESSAGE_MIN);
  assert.equal(Number(match[2]), F.FEEDBACK_MESSAGE_MAX);
});

test("0013 enables, forces and scopes RLS on the table it creates", () => {
  const sql = stripComments(FEEDBACK);

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.feedback_reports/i);
  assert.match(sql, /ALTER TABLE public\.feedback_reports ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /ALTER TABLE public\.feedback_reports FORCE\s+ROW LEVEL SECURITY/i);
  assert.match(sql, /ALTER TABLE public\.feedback_reports OWNER TO schollective_app/i);

  // One policy per verb, all of them keyed on the caller's identity or on
  // app_is_admin() — a policy that allows everything is the failure this checks
  // for, so an unconditional `USING (true)` must not appear.
  const policies = [...sql.matchAll(/CREATE POLICY (\w+) ON public\.feedback_reports\s+FOR (\w+)([\s\S]*?);/gi)];
  const byVerb = Object.fromEntries(policies.map((p) => [p[2].toUpperCase(), { name: p[1], body: p[3] }]));

  assert.deepEqual(Object.keys(byVerb).sort(), ["DELETE", "INSERT", "SELECT", "UPDATE"]);
  assert.match(byVerb.SELECT.body, /app_user_id\(\)/);
  assert.match(byVerb.SELECT.body, /app_is_admin\(\)/);
  assert.match(byVerb.INSERT.body, /app_user_id\(\)/);
  assert.match(byVerb.UPDATE.body, /app_is_admin\(\)/);
  assert.match(byVerb.DELETE.body, /app_is_admin\(\)/);
  assert.ok(!/USING\s*\(\s*true\s*\)/i.test(sql), "no policy may be unconditional");
});

test("0013 refuses to run without the role and helpers its policies need", () => {
  const sql = stripComments(FEEDBACK);
  assert.match(sql, /rolbypassrls[\s\S]*RAISE EXCEPTION/i);
  assert.match(sql, /app_user_id\(\)[\s\S]*app_is_admin\(\)[\s\S]*RAISE EXCEPTION/i);
});

test("0013 is plain ASCII like every migration from 0008 on", () => {
  const text = readFileSync(join(MIGRATIONS, MIGRATION_FILE), "utf8");
  const problems = [];
  text.split("\n").forEach((line, index) => {
    if (/[^\x00-\x7F]/.test(line)) problems.push(`${MIGRATION_FILE}:${index + 1}`);
  });
  assert.deepEqual(problems, []);
});

test("the runtime bootstrap creates the same table the migration does", () => {
  // The bootstrap (src/lib/neon/schema.ts) is what makes the feature work on a
  // database that never ran 0013. If it drifts from the migration, one of the
  // two paths writes a shape the other cannot read.
  const schema = readFileSync(join(here, "..", "src", "lib", "neon", "schema.ts"), "utf8");

  assert.match(schema, /CREATE TABLE IF NOT EXISTS feedback_reports \(/);
  for (const column of ["user_id", "category", "message", "page_path", "status", "created_at"]) {
    assert.match(schema, new RegExp(`\\b${column}\\b`), `bootstrap is missing ${column}`);
  }
});

test("the migration list the README documents includes 0013", () => {
  const readme = readFileSync(join(here, "..", "db", "README.md"), "utf8");
  assert.match(readme, /0013/, "db/README.md does not mention migration 0013");
  assert.ok(
    readdirSync(MIGRATIONS).includes(MIGRATION_FILE),
    "the migration file is not in db/migrations",
  );
});
