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
  const vercel = JSON.parse(read("vercel.json"));

  assert.ok(
    Array.isArray(vercel.crons) && vercel.crons.length > 0,
    "vercel.json declares no Cron Job, so nothing runs the purge",
  );
  assert.ok(
    vercel.crons.some(
      (cron) => cron.path === "/api/cron/purge-accounts" && cron.schedule === "17 3 * * *",
    ),
    "vercel.json must schedule /api/cron/purge-accounts daily",
  );

  const route = read("src", "app", "api", "cron", "purge-accounts", "route.ts");
  assert.match(
    route,
    /purgeExpiredDeactivatedAccounts/,
    "the cron route must invoke purgeExpiredDeactivatedAccounts",
  );
});

test("the cron route enforces CRON_SECRET and returns the sweep summary", async () => {
  const { handlePurgeCron } = await import(
    "../src/app/api/cron/purge-accounts/route.ts"
  );

  const unauthNoSecret = await handlePurgeCron(
    new Request("https://schollective.com/api/cron/purge-accounts", {
      headers: { authorization: "Bearer test-secret" },
    }),
    async () => ({ examined: 0, removed: 0, refused: [] }),
    "",
  );
  assert.equal(unauthNoSecret.status, 401, "must fail closed when CRON_SECRET is unset");

  const unauthWrongSecret = await handlePurgeCron(
    new Request("https://schollective.com/api/cron/purge-accounts", {
      headers: { authorization: "Bearer wrong-secret" },
    }),
    async () => ({ examined: 0, removed: 0, refused: [] }),
    "expected-secret",
  );
  assert.equal(unauthWrongSecret.status, 401, "must reject a mismatched bearer token");

  const authorized = await handlePurgeCron(
    new Request("https://schollective.com/api/cron/purge-accounts", {
      headers: { authorization: "Bearer expected-secret" },
    }),
    async () => ({ examined: 3, removed: 3, refused: [] }),
    "expected-secret",
  );
  assert.equal(authorized.status, 200);
  assert.deepEqual(await authorized.json(), { examined: 3, removed: 3, refused: [] });
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
