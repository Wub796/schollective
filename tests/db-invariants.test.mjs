/**
 * Pins the database preflight (tools/verify-db.mjs).
 *
 * The file checks that exist in this suite read migrations as text — they prove
 * what the repository intends, never what a given database has. That gap is not
 * theoretical: `profiles_delete` was rewritten by db/migrations/0010 to let an
 * account delete its own row, the live database still carried 0004's
 * admin-only version, and under FORCE ROW LEVEL SECURITY the app's delete
 * matched zero rows and answered success. Every test in the suite passed.
 *
 * So this pins the part of the preflight that CI *can* run: that the offline
 * mode still finds each invariant declared by a migration (a deleted file fails
 * here), that a missing connection string is reported rather than skipped, and
 * that the connection string itself never reaches the output.
 *
 * The online mode is deliberately not exercised: it needs a database, and a
 * check that quietly passes without one would be the same silence this file
 * exists to end.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = "tools/verify-db.mjs";

/** The preflight must not inherit a developer's database, or a real one. */
const DB_VARS = ["DATABASE_URL", "DATABASE_URL_UNPOOLED"];

async function preflight(args, env = {}) {
  const inherited = { ...process.env };
  for (const name of DB_VARS) delete inherited[name];

  try {
    const { stdout, stderr } = await run(process.execPath, [SCRIPT, ...args], {
      cwd: ROOT,
      env: { ...inherited, ...env },
      timeout: 30_000,
    });
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error) {
    return { code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

test("every invariant is still declared by a migration", async () => {
  const { code, output } = await preflight(["--offline", "--json"]);

  assert.equal(code, 0, `the offline check failed:\n${output}`);

  const report = JSON.parse(output);
  assert.deepEqual(report.problems, [], "an invariant is no longer declared by any migration");

  // The three that a live database can have got wrong while the repository
  // looks right — each one is here because it has a failure mode that no other
  // test in this suite can see.
  const passed = report.ok.join("\n");
  for (const id of [
    "profiles_delete_names_the_owner",
    "guard_knows_the_disable_pair",
    "youth_protection_owner_and_admin",
  ]) {
    assert.match(passed, new RegExp(id), `${id} is no longer checked`);
  }
});

test("a database with no connection string is a problem, not a pass", async () => {
  const { code, output } = await preflight(["--no-env"]);

  assert.equal(code, 1, "an unconfigured check must not exit 0");
  assert.match(output, /Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set/);
  assert.match(output, /--offline/, "it must say how to run the checks that need no database");
});

test("the connection string is never printed, even when connecting fails", async () => {
  const secret = "sup3rs3cret";
  const { code, output } = await preflight(["--no-env"], {
    DATABASE_URL_UNPOOLED: `postgresql://someone:${secret}@127.0.0.1:5432/neondb`,
  });

  assert.equal(code, 1, "an unreachable database must fail the check");
  assert.ok(!output.includes(secret), `the preflight printed the password:\n${output}`);
  assert.match(output, /Could not read the schema/);
});

test("the npm script and the docs point at the same command", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  assert.equal(pkg.scripts["verify:db"], "node tools/verify-db.mjs");

  // A check nobody is told to run is a check nobody runs.
  const readme = readFileSync(join(ROOT, "db", "README.md"), "utf8");
  assert.match(readme, /npm run verify:db/);
});
