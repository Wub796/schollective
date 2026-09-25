/**
 * Guards the self-service account deletion rules.
 *
 * Two things here can silently break users rather than tests:
 *
 *   1. The grace window. It is quoted to the user in an email and on the
 *      restore page; if the module, the email and the purge sweep disagree, the
 *      account is deleted on a different day than the one it was told.
 *   2. The restore status. It must never hand back a privilege the account did
 *      not hold, and it must hand back the one it did — a professor returning
 *      from a self-disable should not be dropped into review for a decision
 *      they already passed.
 *
 * The migration checks are text checks, like tests/social-schema.test.mjs: they
 * cannot prove a policy works (that needs a database), but they catch the drift
 * that is cheap to introduce and invisible in production — the code shipped
 * without the policy that lets it delete, or a guard that stopped covering the
 * column the restore path depends on.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as A from "../src/lib/account-deletion.ts";
import * as S from "../src/lib/status.ts";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");

function read(relative) {
  return readFileSync(join(ROOT, relative), "utf8");
}

/** SQL with `--` comments removed, so prose cannot satisfy a match. */
function stripComments(sql) {
  return sql.replace(/--[^\n]*/g, "");
}

const MIGRATION = "db/migrations/0010_self_service_account_deletion.sql";
const PURGE = "db/maintenance/002_purge_deactivated_accounts.sql";

test("disabled is a profile status, and not a request or member status", () => {
  assert.ok(S.PROFILE_STATUSES.includes(A.DEACTIVATED_STATUS));
  assert.ok(S.isProfileStatus(A.DEACTIVATED_STATUS));
  assert.ok(!S.isRequestStatus(A.DEACTIVATED_STATUS), "a disabled account is not a thread state");
  assert.ok(!S.isMemberStatus(A.DEACTIVATED_STATUS), "a disabled account is not a membership state");
  // Moderation and self-service are different states with different owners.
  assert.notEqual(A.DEACTIVATED_STATUS, "suspended");
});

test("isDeactivated reads the status vocabulary, nothing else", () => {
  assert.equal(A.isDeactivated({ status: A.DEACTIVATED_STATUS }), true);
  assert.equal(A.isDeactivated({ status: "active" }), false);
  assert.equal(A.isDeactivated({ status: "suspended" }), false, "moderation is not self-disable");
  assert.equal(A.isDeactivated(null), false);
  assert.equal(A.isDeactivated(undefined), false);
});

test("the grace window runs from the recorded timestamp", () => {
  const disabledAt = new Date("2026-01-01T00:00:00.000Z");
  const deadline = A.purgeAfter(disabledAt);
  assert.ok(deadline instanceof Date);
  assert.equal(
    deadline.toISOString(),
    new Date("2026-01-31T00:00:00.000Z").toISOString(),
    "the deadline is the disable moment plus the published grace period",
  );

  // A timestamp that never got written means no deadline to show, not a
  // deadline of now — "delete immediately" is the one wrong answer here.
  assert.equal(A.purgeAfter(null), null);
  assert.equal(A.purgeAfter(undefined), null);
  assert.equal(A.purgeAfter("not a date"), null);
});

test("days remaining counts down and stops at zero", () => {
  const disabledAt = "2026-01-01T00:00:00.000Z";
  const profile = { status: A.DEACTIVATED_STATUS, deactivated_at: disabledAt };

  assert.equal(A.daysUntilPurge(profile, new Date("2026-01-01T00:00:00.000Z")), A.DEACTIVATION_GRACE_DAYS);
  assert.equal(A.daysUntilPurge(profile, new Date("2026-01-21T00:00:00.000Z")), 10);
  // Rounded up: with any part of the window left, "1 day" is the honest label.
  assert.equal(A.daysUntilPurge(profile, new Date("2026-01-30T12:00:00.000Z")), 1);
  assert.equal(A.daysUntilPurge(profile, new Date("2026-01-31T00:00:00.000Z")), 0);
  assert.equal(A.daysUntilPurge(profile, new Date("2027-01-01T00:00:00.000Z")), 0, "never negative");

  assert.equal(A.daysUntilPurge({ status: "active", deactivated_at: disabledAt }), null);
  assert.equal(A.daysUntilPurge(null), null);
});

test("the grace window is only closed for an account that has one", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");
  assert.equal(
    A.isPastGraceWindow({ status: A.DEACTIVATED_STATUS, deactivated_at: "2026-01-01T00:00:00.000Z" }, now),
    true,
  );
  assert.equal(
    A.isPastGraceWindow({ status: A.DEACTIVATED_STATUS, deactivated_at: "2026-02-28T00:00:00.000Z" }, now),
    false,
  );
  // No timestamp recorded, no window to be past: sweeping an account that has
  // no record of when it was disabled would delete it on the spot.
  assert.equal(A.isPastGraceWindow({ status: A.DEACTIVATED_STATUS, deactivated_at: null }, now), false);
  assert.equal(A.isPastGraceWindow({ status: "active" }, now), false);
  assert.equal(A.isPastGraceWindow(null, now), false);
});

test("restore returns the status the account held, and only that one", () => {
  assert.equal(
    A.profileStatusOnRestore({ status: A.DEACTIVATED_STATUS, status_before_deactivation: "approved" }),
    "approved",
  );
  assert.equal(
    A.profileStatusOnRestore({ status: A.DEACTIVATED_STATUS, status_before_deactivation: "active" }),
    "active",
  );

  // Junk, an empty column, or the disabled status itself must not become a
  // privilege: the fallback is the ordinary student state.
  for (const claimed of [null, undefined, "", "ADMIN", "superuser", A.DEACTIVATED_STATUS]) {
    assert.equal(
      A.profileStatusOnRestore({ status: A.DEACTIVATED_STATUS, status_before_deactivation: claimed }),
      "active",
      `"${claimed}" must not restore into anything but the default`,
    );
  }
  assert.notEqual(A.profileStatusOnRestore({}), "admin");
});

test("the confirmation phrases are matched exactly, after trimming only whitespace", () => {
  assert.ok(A.confirmationMatches("DELETE", A.DELETE_CONFIRMATION_PHRASE));
  assert.ok(A.confirmationMatches("  DISABLE  ", A.DISABLE_CONFIRMATION_PHRASE));

  // Forgiving anything else removes the hesitation the phrase exists to create.
  assert.ok(!A.confirmationMatches("delete", A.DELETE_CONFIRMATION_PHRASE));
  assert.ok(!A.confirmationMatches("DELETED", A.DELETE_CONFIRMATION_PHRASE));
  assert.ok(!A.confirmationMatches("", A.DELETE_CONFIRMATION_PHRASE));
  assert.ok(!A.confirmationMatches("   ", A.DELETE_CONFIRMATION_PHRASE));
  assert.ok(!A.confirmationMatches(null, A.DELETE_CONFIRMATION_PHRASE));
  assert.ok(!A.confirmationMatches(undefined, A.DELETE_CONFIRMATION_PHRASE));
  assert.ok(!A.confirmationMatches({}, A.DELETE_CONFIRMATION_PHRASE));

  // The two actions must not share a word: the destructive one has to be the
  // one that takes deliberate effort to type.
  assert.notEqual(A.DELETE_CONFIRMATION_PHRASE, A.DISABLE_CONFIRMATION_PHRASE);
});

test("the database lets an account delete its own profile row", () => {
  const sql = stripComments(read(MIGRATION));

  // Without this the endpoint answers success and deletes nothing: profiles
  // carries FORCE ROW LEVEL SECURITY, so the owner is policy-checked too.
  const policy = sql.match(/CREATE POLICY profiles_delete[\s\S]*?;/i);
  assert.ok(policy, "profiles_delete is not redefined in 0010");
  assert.match(policy[0], /id\s*=\s*app_user_id\(\)/, "a user still cannot delete their own row");
  assert.match(policy[0], /app_is_admin\(\)/, "0004's admin power must survive the rewrite");
  assert.match(policy[0], /FOR DELETE/i);
});

test("the delete route checks that the profile row actually went", () => {
  const route = read("src/app/api/auth/account/delete/route.ts");

  // The policy above is the intent; this is the only guard that survives the
  // database disagreeing with it. A DELETE that matches no rows is not an
  // error — `profiles` carries FORCE ROW LEVEL SECURITY, so if the live
  // database still has the admin-only version of profiles_delete the statement
  // simply affects nothing. The next statement takes the auth row, and what is
  // left is a profile nobody can reach: the user is signed out of an account
  // that still exists, with their date of birth and thread history in it.
  assert.match(
    route,
    /DELETE FROM profiles WHERE id = \$\{user\.id\} RETURNING id/,
    "the profile delete no longer reports which rows it removed",
  );
  assert.match(route, /if \(!deletedProfile\.length\)/, "the row count is not checked");
  assert.doesNotMatch(
    route,
    /DELETE FROM profiles WHERE id = \$\{user\.id\};/,
    "an unchecked DELETE FROM profiles is back: it cannot tell a deletion from a refusal",
  );

  // Ordering is the second half of the guard: the auth row is only removed once
  // the profile row is confirmed gone, so a refusal leaves a working account.
  const profileDelete = route.indexOf("DELETE FROM profiles WHERE id =");
  const authDelete = route.indexOf('DELETE FROM "user" WHERE id =');
  assert.ok(profileDelete >= 0, "the route no longer deletes the profile row");
  assert.ok(
    authDelete > profileDelete,
    "the auth row is deleted before the profile deletion is confirmed",
  );

  // Which is what db/migrations/0010 promises, and what `npm run verify:db`
  // reports for the database this is deployed against.
  assert.match(read("db/README.md"), /npm run verify:db/);
});

test("the guard still refuses self-approval, and only reopens the restore path", () => {
  const sql = stripComments(read(MIGRATION));

  assert.match(sql, /refusing to self-approve/, "the self-approval guard was dropped");
  // The one allowed way back to 'approved': the row records that the account
  // held it before it was disabled.
  assert.match(
    sql,
    /OLD\.status = 'deactivated' AND OLD\.status_before_deactivation = 'approved'/,
    "a restore of a previously approved professor cannot succeed",
  );
  // And the bookkeeping column cannot be written on its own, which is the hole
  // that rule would otherwise leave open.
  assert.match(sql, /BEFORE UPDATE OF role, status, status_before_deactivation/);
  assert.match(
    sql,
    /status_before_deactivation may only be recorded when an account disables itself/,
  );
});

test("the disable columns exist so a grace window can be recorded", () => {
  const sql = stripComments(read(MIGRATION));
  for (const column of ["deactivated_at", "status_before_deactivation"]) {
    assert.match(
      sql,
      new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`, "i"),
      `${column} is never added by the migration`,
    );
  }
});

test("the purge sweep deletes on the same deadline the user was told", () => {
  const sql = stripComments(read(PURGE));

  assert.match(
    sql,
    new RegExp(`interval '${A.DEACTIVATION_GRACE_DAYS} days'`),
    `the sweep no longer matches DEACTIVATION_GRACE_DAYS (${A.DEACTIVATION_GRACE_DAYS})`,
  );
  // Order matters: the auth row last, so a failure leaves a working account
  // rather than data with no way in.
  const order = ["DELETE FROM session", "ai_profile_review_jobs", "DELETE FROM profiles", 'DELETE FROM "user"']
    .map((statement) => sql.indexOf(statement));
  assert.ok(order.every((index) => index >= 0), "the sweep is missing one of its deletes");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "the sweep deletes in the wrong order");
});

test("every leave-account route exists and does its own checking", () => {
  const routes = {
    "src/app/api/auth/account/disable/route.ts": "disable",
    "src/app/api/auth/account/delete/route.ts": "delete",
    "src/app/api/auth/account/restore/route.ts": "restore",
  };

  for (const [path, name] of Object.entries(routes)) {
    assert.ok(existsSync(join(ROOT, path)), `${name}: ${path} does not exist`);
    const source = read(path);
    assert.match(source, /export async function POST/, `${name}: no POST handler`);
    // The button is not the control: each route re-reads the session itself.
    assert.match(source, /getCurrentUserAndProfile/, `${name}: the route trusts its caller`);
    assert.match(source, /runAs\(/, `${name}: the route writes without a database identity`);
  }

  // Both self-service exits demand a typed phrase server side, not just in the UI.
  for (const path of [
    "src/app/api/auth/account/disable/route.ts",
    "src/app/api/auth/account/delete/route.ts",
  ]) {
    assert.match(read(path), /confirmationMatches\(/, `${path} accepts any body`);
  }
});

test("the Settings nav entry carries no subscript", () => {
  const sidebar = read("src/components/layout/Sidebar.tsx");
  const accountNav = sidebar.match(/const accountNav[\s\S]*?\];/);
  assert.ok(accountNav, "the account nav list moved or was renamed");
  assert.match(accountNav[0], /label: "Settings"/, "the page is still called Profile in the sidebar");
  assert.ok(
    !/\bsub:/.test(accountNav[0]),
    "the Settings entry grew a subscript again — the label is the whole name of the page",
  );
});
