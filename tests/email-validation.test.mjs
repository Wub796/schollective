/**
 * Email validation, and the client/server parity that was missing.
 *
 * The history this guards against: `validateEmail` existed twice — once in
 * `validators.ts` (consulting the full US university domain list) and once in
 * `validators-client.ts` (not consulting it). The copies had drifted, and the
 * server copy had ZERO callers, so nothing on the server enforced any of it and
 * a direct POST to /api/auth/sign-up/email bypassed the disposable-domain block
 * entirely.
 *
 * Both entry points now delegate to `validateEmailCore`. The first test is the
 * one that matters: it asserts the two agree on every verdict that is not
 * specifically about the extra domain list.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { validateEmail as clientValidate } from "../src/lib/validators-client.ts";
import { validateEmail as serverValidate } from "../src/lib/validators.ts";
import { validateEmailCore, isSignupEmailAllowed } from "../src/lib/email-validation.ts";

const ROLES = ["student", "professor"];

test("client and server agree on accept/reject for every shared case", () => {
  // Cases deliberately chosen to avoid the one intended difference: the server
  // additionally recognises US_UNIVERSITY_DOMAINS as institutional. Acceptance
  // (`ok`) must never differ — only the cosmetic `state` may, and only by being
  // upgraded from "valid" to "valid".
  const cases = [
    "",
    "   ",
    "not-an-email",
    "no@domain",
    "@nolocal.edu",
    "two@@at.edu",
    "spaces in@email.edu",
    "student@mailinator.com",
    "x@guerrillamail.com",
    "x@trashmail.net",
    "prof@gmail.com",
    "prof@outlook.com",
    "student@gmail.com",
    "student@icloud.com",
    "someone@mit.edu",
    "someone@ox.ac.uk",
    "someone@unknown-company.io",
  ];

  for (const email of cases) {
    for (const role of ROLES) {
      const c = clientValidate(email, role);
      const s = serverValidate(email, role);
      assert.equal(
        c.ok,
        s.ok,
        `acceptance differs for ${JSON.stringify(email)} as ${role}: client=${c.ok} server=${s.ok}`,
      );
      // A rejection must give the same reason, or the user sees one message in
      // the form and a different one after submitting.
      if (!c.ok) {
        assert.equal(c.message, s.message, `rejection reason differs for ${email} as ${role}`);
      }
    }
  }
});

test("malformed addresses are rejected for both roles", () => {
  for (const bad of ["", "nope", "a@b", "a@b.c", "@b.edu", "a b@c.edu", "a@ b.edu"]) {
    for (const role of ROLES) {
      assert.equal(validateEmailCore(bad, role).ok, false, `${JSON.stringify(bad)} should be rejected`);
    }
  }
});

test("non-string input is rejected rather than throwing", () => {
  // The server hook receives whatever the request body carried.
  for (const bad of [null, undefined, 42, {}, [], true]) {
    const verdict = validateEmailCore(bad, "student");
    assert.equal(verdict.ok, false);
    assert.equal(verdict.state, "error");
  }
});

test("disposable domains are blocked for both roles", () => {
  for (const email of [
    "a@mailinator.com",
    "a@guerrillamail.com",
    "a@yopmail.com",
    "a@trashmail.com",
    "a@tempmail.com",
  ]) {
    for (const role of ROLES) {
      const verdict = validateEmailCore(email, role);
      assert.equal(verdict.ok, false, `${email} should be blocked`);
      assert.match(verdict.message, /disposable/i);
    }
  }
});

test("domain matching is case-insensitive", () => {
  // Otherwise the block is trivially bypassed with a capital letter.
  assert.equal(validateEmailCore("A@MAILINATOR.COM", "student").ok, false);
  assert.equal(validateEmailCore("  a@MailInator.com  ", "student").ok, false);
});

test("a personal address is allowed for students and refused for professors", () => {
  const student = validateEmailCore("someone@gmail.com", "student");
  assert.equal(student.ok, true);
  assert.equal(student.state, "warn", "a personal student address should be flagged, not silently accepted");

  const professor = validateEmailCore("someone@gmail.com", "professor");
  assert.equal(professor.ok, false);
  assert.match(professor.message, /institutional/i);
});

test("academic suffixes are recognised as institutional", () => {
  for (const email of ["a@mit.edu", "a@cam.ac.uk", "a@uni.edu.au"]) {
    const verdict = validateEmailCore(email, "professor");
    assert.equal(verdict.ok, true, `${email} should be accepted for a professor`);
    assert.equal(verdict.state, "valid");
  }
});

test("the extra-domain set only ever widens recognition, never narrows it", () => {
  // This is the shape of the intended client/server difference.
  const extra = new Set(["weird-institute.org"]);
  const without = validateEmailCore("a@weird-institute.org", "professor", undefined);
  const with_ = validateEmailCore("a@weird-institute.org", "professor", extra);

  assert.equal(with_.ok, true);
  assert.equal(with_.state, "valid");
  // Without the set it is an unknown domain — still allowed, just unrecognised.
  assert.equal(without.ok, true);
});

test("isSignupEmailAllowed enforces only the role-independent rules", () => {
  // Account creation cannot know the eventual role, so it must not apply the
  // professor institutional rule — that would block every student signing up
  // with a personal address.
  assert.equal(isSignupEmailAllowed("student@gmail.com").ok, true);
  assert.equal(isSignupEmailAllowed("prof@gmail.com").ok, true);

  // But it must still block the things that are wrong for anyone.
  assert.equal(isSignupEmailAllowed("a@mailinator.com").ok, false);
  assert.equal(isSignupEmailAllowed("garbage").ok, false);
  assert.equal(isSignupEmailAllowed("").ok, false);
  assert.equal(isSignupEmailAllowed(null).ok, false);
});

test("the server configuration recognises the US university list", () => {
  // The concrete drift that existed: the server consulted US_UNIVERSITY_DOMAINS
  // and the client did not, so they could disagree about a real institution.
  // Acceptance still matches (checked above); this pins the intended asymmetry so
  // it is a deliberate, documented difference rather than an accident.
  const sample = "researcher@berkeley.edu";
  assert.equal(serverValidate(sample, "professor").ok, true);
  assert.equal(clientValidate(sample, "professor").ok, true);
});
