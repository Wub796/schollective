/**
 * Post-login redirect safety.
 *
 * The login and onboarding pages navigate to a `next` query parameter after a
 * successful sign-in. That value is attacker-controlled, and `router.push`
 * follows an absolute URL without complaint, so `/login?next=https://evil.example`
 * would hand a freshly authenticated user to another site at the exact moment
 * they are primed to trust the page. These cases are the hostile inputs.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  safeInternalPath,
  resolvePostLoginPath,
  DEFAULT_POST_LOGIN_PATH,
} from "../src/lib/safe-redirect.ts";

test("accepts ordinary in-app destinations", () => {
  for (const path of [
    "/dashboard",
    "/threads",
    "/messages/abc123",
    "/prof/dashboard",
    "/professors?query=neuro&page=2",
    "/profile#academics",
    "/request/new?prof=xyz",
  ]) {
    assert.equal(safeInternalPath(path), path, `should accept ${path}`);
  }
});

test("rejects absolute and protocol-relative URLs", () => {
  // The core open-redirect vectors. `//host` is the subtle one: it has no
  // scheme, looks relative, and browsers resolve it as absolute.
  for (const hostile of [
    "https://evil.example",
    "http://evil.example/path",
    "//evil.example",
    "//evil.example/dashboard",
    "///evil.example",
    "https://schollective.com.evil.example",
  ]) {
    assert.equal(safeInternalPath(hostile), null, `should reject ${hostile}`);
  }
});

test("rejects backslash and scheme smuggling", () => {
  for (const hostile of [
    "/\\evil.example",
    "/javascript:alert(1)",
    "/data:text/html,<script>alert(1)</script>",
    "javascript:alert(1)",
    "data:text/html,x",
  ]) {
    assert.equal(safeInternalPath(hostile), null, `should reject ${hostile}`);
  }
});

test("rejects control characters used for header and URL splitting", () => {
  for (const hostile of [
    "/dashboard\nLocation: https://evil.example",
    "/dashboard\r\nSet-Cookie: a=b",
    `/dash${String.fromCharCode(0)}board`,
    `/dash${String.fromCharCode(127)}board`,
  ]) {
    assert.equal(safeInternalPath(hostile), null, `should reject ${JSON.stringify(hostile)}`);
  }
});

test("rejects values that are not strings", () => {
  for (const bad of [null, undefined, 42, {}, [], true]) {
    assert.equal(safeInternalPath(bad), null);
  }
});

test("rejects empty and unrooted values", () => {
  for (const bad of ["", "   ", "dashboard", "./dashboard", "../admin"]) {
    assert.equal(safeInternalPath(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
});

test("refuses to bounce the user back to the page they just used", () => {
  // Otherwise a successful sign-in lands back on the sign-in form, which reads
  // as a silent failure.
  assert.equal(safeInternalPath("/login"), null);
  assert.equal(safeInternalPath("/login?error=x"), null);
  assert.equal(safeInternalPath("/signup"), null);
  // But a path that merely starts with those letters is a different route.
  assert.equal(safeInternalPath("/loginhelp"), "/loginhelp");
});

test("resolvePostLoginPath falls back rather than returning null", () => {
  assert.equal(resolvePostLoginPath("https://evil.example"), DEFAULT_POST_LOGIN_PATH);
  assert.equal(resolvePostLoginPath(null), DEFAULT_POST_LOGIN_PATH);
  assert.equal(resolvePostLoginPath("/threads"), "/threads");
  assert.equal(resolvePostLoginPath(undefined, "/prof/dashboard"), "/prof/dashboard");
});
