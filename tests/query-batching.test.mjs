/**
 * Pins the set-based shape of the queries that used to fan out per row.
 *
 * These are static checks, like tests/internal-links.test.mjs: this suite runs
 * without a database, so what it can prove is that the N+1 was not quietly
 * reintroduced. Each of these loops was a real cost, not a style preference —
 * every `sql` call is its own HTTP round trip to Neon, so one query per
 * recipient or per applicant multiplied the latency of a single user action.
 *
 *   - notifications: one INSERT ... SELECT unnest(...) for the whole audience.
 *   - admin scoring: one SELECT and one joined UPDATE for the whole batch.
 *   - the review table: one server action for every unscored applicant.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "..", "src");

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : /\.(ts|tsx)$/.test(entry)
        ? [path]
        : [];
  });
}

const files = new Map(sourceFiles(SRC).map((path) => [path, readFileSync(path, "utf8")]));

function source(name) {
  const text = files.get(join(SRC, name));
  assert.ok(text, `${name} should exist`);
  return text;
}

test("notifications are inserted for the whole audience in one statement", () => {
  const text = source("lib/notifications.ts");

  assert.match(
    text,
    /INSERT INTO notifications[\s\S]*?SELECT unnest\(/,
    "createNotifications should insert every recipient with one unnest",
  );
  assert.doesNotMatch(
    text,
    /VALUES \(\$\{userId\}/,
    "the per-recipient VALUES insert should be gone",
  );
});

test("no server action notifies recipients one round trip at a time", () => {
  const offenders = [];
  for (const [path, text] of files) {
    if (/for\s*\([^)]*\)\s*\{[\s\S]{0,200}?await createNotification\(/.test(text)) {
      offenders.push(relative(SRC, path));
    }
  }
  assert.deepEqual(offenders, [], `per-recipient notification loops: ${offenders.join(", ")}`);
});

test("admin scoring reads and writes a batch, not one applicant at a time", () => {
  const text = source("app/admin/dashboard/actions.ts");

  assert.match(text, /WHERE id = ANY\(\$\{unique\}::text\[\]\)/);
  assert.match(text, /UPDATE profiles p[\s\S]*?FROM \([\s\S]*?unnest\(/);
  assert.doesNotMatch(
    text,
    /for \(const item of pending\)/,
    "the pending queue should be scored as one batch",
  );
});

test("the review table asks the server to score the batch once", () => {
  const text = source("components/features/AdminReviewTable.tsx");

  assert.match(text, /await scoreApplications\(/);
  assert.doesNotMatch(text, /Promise\.all\(unscored\.map/);
});
