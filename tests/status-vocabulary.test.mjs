/**
 * Guards the status vocabulary in src/lib/status.ts.
 *
 * These are the assertions that would have caught the thread-list bug: the page
 * bucketed everything that was not `closed` as an ongoing conversation, so
 * `declined`, `viewed` and admin-`deleted` threads all rendered as live threads
 * the user could not post to. The rules below are about the MEANING of the
 * vocabulary, not about any one screen, so they hold whatever the UI does next.
 *
 * The module is imported directly as TypeScript — Node strips the types natively
 * (22.18+/23+, and CI pins 24). That matters: these tests exercise the real
 * exported values rather than a copy, and a test that restates the
 * implementation proves only that it was typed twice.
 */

import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../src/lib/status.ts";



test("every status list is a subset of the declared vocabulary", () => {
  const all = new Set(S.REQUEST_STATUSES);
  assert.ok(all.size > 0, "REQUEST_STATUSES did not load");

  for (const name of [
    "AWAITING_PROFESSOR",
    "PROFESSOR_DECIDABLE_FROM",
    "TERMINAL_STATUSES",
    "PARTICIPANT_VISIBLE",
    "PARTICIPANT_ONGOING",
    "PARTICIPANT_PAST",
    "PROFESSOR_ROSTER",
    "UNREAD_COUNTABLE",
  ]) {
    const list = S[name];
    assert.ok(Array.isArray(list), `${name} is missing`);
    for (const value of list) {
      assert.ok(all.has(value), `${name} contains "${value}", which is not a declared request status`);
    }
  }
});

test("an admin soft-delete is hidden from participants", () => {
  // The whole point of the 'deleted' status. If it ever appears in a
  // participant-facing list, moderation silently stops working.
  assert.ok(
    !S.PARTICIPANT_VISIBLE.includes("deleted"),
    "'deleted' must never be visible to a thread participant",
  );
  assert.ok(!S.PARTICIPANT_ONGOING.includes("deleted"));
  assert.ok(!S.PARTICIPANT_PAST.includes("deleted"));
  assert.ok(!S.PROFESSOR_ROSTER.includes("deleted"));
});

test("ongoing and past partition the participant-visible statuses exactly", () => {
  // This is the invariant the thread page got wrong by using `!== 'closed'`.
  const ongoing = new Set(S.PARTICIPANT_ONGOING);
  const past = new Set(S.PARTICIPANT_PAST);

  for (const status of S.PARTICIPANT_VISIBLE) {
    const inOngoing = ongoing.has(status);
    const inPast = past.has(status);
    assert.ok(
      inOngoing !== inPast,
      `"${status}" is visible but is in ${inOngoing && inPast ? "both" : "neither"} bucket — it would be rendered twice or not at all`,
    );
  }

  for (const status of [...ongoing, ...past]) {
    assert.ok(
      S.PARTICIPANT_VISIBLE.includes(status),
      `"${status}" is bucketed but not visible`,
    );
  }
});

test("a declined request is not presented as a live conversation", () => {
  assert.ok(!S.PARTICIPANT_ONGOING.includes("declined"));
  assert.ok(S.PARTICIPANT_PAST.includes("declined"));
});

test("only an active thread accepts messages and produces unread badges", () => {
  assert.equal(S.MESSAGEABLE_STATUS, "active");

  // A badge the user cannot clear is worse than no badge: clearing requires
  // opening the thread, and a closed or declined thread has nothing to open.
  for (const status of S.UNREAD_COUNTABLE) {
    assert.equal(
      status,
      S.MESSAGEABLE_STATUS,
      `"${status}" counts toward unread but cannot receive a reply`,
    );
  }
});

test("terminal statuses are not decidable, and decidable ones are not terminal", () => {
  for (const status of S.PROFESSOR_DECIDABLE_FROM) {
    assert.ok(
      !S.TERMINAL_STATUSES.includes(status),
      `"${status}" is both terminal and decidable — a professor could reopen a finished thread`,
    );
  }
  // Accepting or declining must only be possible from a state that is waiting.
  for (const status of S.PROFESSOR_DECIDABLE_FROM) {
    assert.ok(S.AWAITING_PROFESSOR.includes(status));
  }
});

test("becoming a professor always re-enters review", () => {
  // The guard against self-promotion into a live faculty listing.
  assert.equal(S.defaultStatusForRole("professor"), "pending");
  assert.notEqual(S.defaultStatusForRole("professor"), S.PROFESSOR_LIVE_STATUS);
  assert.equal(S.defaultStatusForRole("student"), "active");
  assert.equal(S.defaultStatusForRole("admin"), "active");
});

test("role and status type guards reject junk", () => {
  assert.ok(S.isUserRole("student"));
  assert.ok(S.isUserRole("admin"));
  assert.ok(!S.isUserRole("Admin"), "role matching must be case-sensitive");
  assert.ok(!S.isUserRole("superuser"));
  assert.ok(!S.isUserRole(""));
  assert.ok(!S.isUserRole(null));
  assert.ok(!S.isUserRole(undefined));

  assert.ok(S.isProfileStatus("approved"));
  assert.ok(!S.isProfileStatus("APPROVED"));
  assert.ok(!S.isProfileStatus("deleted"), "'deleted' is a request status, not a profile status");

  assert.ok(S.isRequestStatus("viewed"));
  assert.ok(!S.isRequestStatus("rejected"), "'rejected' is a profile status, not a request status");
});

test("asSqlArray returns a plain mutable array the driver can bind", () => {
  const out = S.asSqlArray(S.PARTICIPANT_ONGOING);
  assert.ok(Array.isArray(out));
  assert.deepEqual(out, [...S.PARTICIPANT_ONGOING]);
  // Must be a copy: binding the module's own constant and having a driver mutate
  // it would corrupt every later query.
  assert.notEqual(out, S.PARTICIPANT_ONGOING);
});
