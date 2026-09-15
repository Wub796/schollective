/**
 * Keeps the social schema in db/migrations honest against the application.
 *
 * Like schema-drift.test.mjs, this reads SQL as text. It cannot prove a policy
 * is correct — that needs a database — but it catches the drift that is cheap
 * to introduce and silent in production: a status added in TypeScript that the
 * CHECK constraint rejects, a new table shipped without enforced RLS, and a
 * SECURITY DEFINER function whose search_path an attacker-created object could
 * hijack.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as S from "../src/lib/status.ts";

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(here, "..", "db", "migrations");
const SOCIAL = readFileSync(join(MIGRATIONS, "0008_friends_and_group_mentorship.sql"), "utf8");

/** SQL with `--` comments removed, so prose cannot satisfy or break a match. */
function stripComments(sql) {
  return sql.replace(/--[^\n]*/g, "");
}

/** The quoted values of `CHECK (column IN ('a', 'b'))` on a named constraint. */
function checkValues(sql, constraint) {
  const match = stripComments(sql).match(new RegExp(`CONSTRAINT ${constraint}\\s+CHECK \\(\\s*\\w+ IN \\(([^)]*)\\)`, "i"));
  assert.ok(match, `could not find CHECK constraint ${constraint}`);
  return [...match[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

test("the member status CHECK accepts exactly the TypeScript vocabulary", () => {
  assert.deepEqual(checkValues(SOCIAL, "request_members_status_check"), [...S.MEMBER_STATUSES]);
});

test("the friendship status CHECK accepts exactly the TypeScript vocabulary", () => {
  assert.deepEqual(checkValues(SOCIAL, "friendships_status_check"), [...S.FRIENDSHIP_STATUSES]);
});

test("every 'open request' literal in the migration matches OPEN_TO_MEMBERS", () => {
  const sql = stripComments(SOCIAL);
  // Anchored to comparisons on a request row (`r.status`, `req.status`), so the
  // friendships and membership CHECK lists are not mistaken for these — and a
  // drifted list such as ('pending', 'active') still fails.
  const literals = [...sql.matchAll(/\b(?:r|req)\.status\s+(?:NOT\s+)?IN\s+\(([^)]*)\)/gi)].map((m) =>
    [...m[1].matchAll(/'([^']*)'/g)].map((v) => v[1]),
  );
  assert.ok(literals.length >= 2, "expected the trigger and the insert policy to name the open statuses");
  for (const values of literals) {
    assert.deepEqual(values, [...S.OPEN_TO_MEMBERS]);
  }
});

test("every table 0008 creates has row-level security enabled, forced, and a SELECT policy", () => {
  const sql = stripComments(SOCIAL);
  const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/gi)].map((m) => m[1]);
  assert.deepEqual(tables.sort(), ["friendships", "request_members", "thread_reads", "user_blocks"]);

  for (const table of tables) {
    assert.match(sql, new RegExp(`ALTER TABLE ${table}\\s+ENABLE ROW LEVEL SECURITY`, "i"), `${table}: RLS not enabled`);
    assert.match(sql, new RegExp(`ALTER TABLE ${table}\\s+FORCE\\s+ROW LEVEL SECURITY`, "i"), `${table}: RLS not forced`);
    assert.match(sql, new RegExp(`CREATE POLICY \\w+ ON ${table}\\s+FOR SELECT`, "i"), `${table}: no SELECT policy`);
    assert.match(sql, new RegExp(`ALTER TABLE ${table}\\s+OWNER TO schollective_app`, "i"), `${table}: not handed to the app role`);
  }
});

test("every SECURITY DEFINER function in any migration pins its search_path", () => {
  const problems = [];
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql"))) {
    const sql = stripComments(readFileSync(join(MIGRATIONS, file), "utf8"));
    for (const match of sql.matchAll(/CREATE OR REPLACE FUNCTION\s+([\w.]+)\s*\(([\s\S]*?)\bAS \$\$/gi)) {
      const header = match[2];
      if (/SECURITY DEFINER/i.test(header) && !/SET search_path/i.test(header)) {
        problems.push(`${file}: ${match[1]}`);
      }
    }
  }
  assert.deepEqual(problems, [], `SECURITY DEFINER without a pinned search_path:\n  ${problems.join("\n  ")}`);
});

test("migrations from 0008 on are plain ASCII", () => {
  // 0007 was applied through a client whose encoding was not UTF-8: an em dash
  // in one of its exception messages is stored in production as three Mac-Roman
  // characters. Keeping new migrations ASCII makes the encoding of whatever
  // client applies them irrelevant.
  const problems = [];
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql") && Number.parseInt(f, 10) >= 8)) {
    const text = readFileSync(join(MIGRATIONS, file), "utf8");
    text.split("\n").forEach((line, index) => {
      if (/[^\x00-\x7F]/.test(line)) problems.push(`${file}:${index + 1}`);
    });
  }
  assert.deepEqual(problems, [], `non-ASCII characters in:\n  ${problems.join("\n  ")}`);
});

test("0008 refuses to run as a role that RLS applies to", () => {
  // The membership helpers rely on their owner bypassing RLS; created by the app
  // role they would recurse inside the very policies that call them.
  assert.match(stripComments(SOCIAL), /rolbypassrls[\s\S]*RAISE EXCEPTION/i);
});
