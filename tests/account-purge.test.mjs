/**
 * The sweep behind the 30 day promise, and the reason this file reads the
 * repository as text.
 *
 * Same argument as tests/db-invariants.test.mjs: these prove what the repository
 * intends, never what a given database has, and there is no database in CI. That
 * gap is not theoretical here either. The deletion existed, `isPastGraceWindow`
 * had tests, the maintenance script worked, and nothing ran any of it on a
 * timer. `wrangler.jsonc` declared no cron triggers and the Worker entry had no
 * `scheduled` handler, so every test in the suite passed while a disabled
 * account's data stayed put past the date the user was given.
 *
 * So the first test pins the wiring that was missing, and the rest keep the
 * deletion from being restated in a second place, which is how one copy drifts.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFileSync(join(ROOT, ...parts), "utf8");

test("the deployment can run the sweep on a timer", () => {
  const wrangler = read("wrangler.jsonc");

  assert.match(
    wrangler,
    /"crons"\s*:\s*\[/,
    "wrangler.jsonc declares no Cron Trigger, so nothing runs the purge",
  );
  assert.match(
    wrangler,
    /"main"\s*:\s*"worker\.mjs"/,
    "the Worker entry is not the wrapper that carries the scheduled handler",
  );

  const worker = read("worker.mjs");

  assert.match(worker, /async scheduled\s*\(/, "the Worker entry has no scheduled handler");
  assert.match(
    worker,
    /purgeExpiredDeactivatedAccounts/,
    "the scheduled handler exists but does not run the purge",
  );
  assert.match(
    worker,
    /export \* from "\.\/\.open-next\/worker\.js"/,
    "the wrapper must re-export the generated entry's Durable Object classes",
  );
});

test("the deletion order has one definition, not one per caller", () => {
  const maintenance = read("db", "maintenance", "002_purge_deactivated_accounts.sql");

  assert.match(
    maintenance,
    /purge_expired_deactivated_accounts\(/,
    "the manual sweep no longer calls the shared function",
  );
  assert.doesNotMatch(
    maintenance,
    /DELETE FROM profiles/,
    "the manual sweep restates the deletion order instead of calling it",
  );
});

test("the purge function is reachable only through a role the policies do not apply to", () => {
  const migration = read("db", "migrations", "0016_deactivated_account_purge.sql");

  assert.match(migration, /SECURITY DEFINER/, "the function must run as its owner");
  assert.match(
    migration,
    /REVOKE EXECUTE ON FUNCTION public\.purge_expired_deactivated_accounts\(integer, integer\) FROM PUBLIC/,
    "PUBLIC must not be able to call a function that deletes accounts",
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.purge_expired_deactivated_accounts\(integer, integer\) TO schollective_app/,
    "the app role must be granted EXECUTE or the sweep can never run",
  );
  assert.match(
    migration,
    /rolbypassrls/,
    "the migration must refuse to create the function as a role RLS applies to, or its deletes match no rows and report success",
  );
});

test("the grace window is read, not restated, and one run is bounded", () => {
  const source = read("src", "lib", "account-purge.ts");

  assert.match(
    source,
    /DEACTIVATION_GRACE_DAYS/,
    "the sweep must read the one place the 30 is written",
  );
  assert.match(source, /PURGE_BATCH_LIMIT/, "one run must be bounded");
  assert.doesNotMatch(
    source,
    /DELETE FROM/,
    "app code must not restate the deletion order the function owns",
  );
});

test("the sweep is callable and bounded by default", async () => {
  const { PURGE_BATCH_LIMIT, purgeExpiredDeactivatedAccounts } = await import(
    "../src/lib/account-purge.ts"
  );

  assert.equal(typeof purgeExpiredDeactivatedAccounts, "function");
  assert.ok(
    PURGE_BATCH_LIMIT > 0 && PURGE_BATCH_LIMIT <= 100,
    `the default batch limit must be small and positive, got ${PURGE_BATCH_LIMIT}`,
  );
});
