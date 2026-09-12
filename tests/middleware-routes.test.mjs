/**
 * Route gating: does the middleware's protected-path list actually cover the
 * app's protected pages?
 *
 * The important test here is the last one. It walks the real `src/app` tree,
 * derives every route the router will serve, and asserts that each one which
 * renders signed-in product surface is classified as requiring a session. Before
 * this, the list was a chain of `||` conditions inside the middleware with
 * nothing comparing it to the route tree — so adding a protected page and
 * forgetting to extend the list produced a page that served its shell to anyone,
 * silently, with no test and no type error to catch it.
 *
 * Defence in depth, to be clear: every page also re-checks authorization server
 * side. The middleware is the cheap first gate, and it should not quietly stop
 * covering a route.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { requiresSession, PROTECTED_EXACT, PROTECTED_PREFIXES } from "../src/lib/route-access.ts";

const here = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(here, "..", "src", "app");

/**
 * Derives router paths from the filesystem, applying the App Router conventions
 * this project uses: `(group)` segments are organisational and contribute nothing
 * to the URL, and `[param]` / `[...param]` become placeholder segments.
 */
function routePaths(dir = APP_DIR, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Route groups are invisible in the URL.
      const segment = /^\(.+\)$/.test(entry) ? "" : `/${entry}`;
      out.push(...routePaths(full, prefix + segment));
    } else if (entry === "page.tsx") {
      out.push(prefix === "" ? "/" : prefix);
    }
  }
  return out;
}

/** Substitutes a realistic value for each dynamic segment. */
function concrete(path) {
  return path
    .replace(/\[\.\.\.([^\]]+)\]/g, "avatars/u1/1700000000000.png")
    .replace(/\[([^\]]+)\]/g, "abc12345");
}

const ROUTES = routePaths().sort();

/**
 * The product surface: every route that renders something only a signed-in user
 * should see. Listed by intent rather than derived, so that adding a page forces
 * a deliberate decision about which side of the wall it belongs on.
 */
const MUST_REQUIRE_SESSION = [
  "/dashboard",
  "/onboarding",
  "/professors",
  "/profile",
  "/threads",
  "/request/new",
  "/messages/abc12345",
  "/prof/dashboard",
  "/prof/pending",
  "/prof/profile",
  "/prof/students",
  "/admin/dashboard",
  "/admin/professors",
  "/admin/threads",
  "/admin/users",
];

/** Routes that must stay reachable without a session. */
const MUST_BE_PUBLIC = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/verify-email",
  "/suspended",
  "/about",
  "/features",
  "/for-professors",
  "/for-students",
  "/privacy",
  "/terms",
  "/professors/abc12345",
];

test("the app tree was discovered", () => {
  assert.ok(ROUTES.length > 15, `only found ${ROUTES.length} routes — the walker is broken`);
  assert.ok(ROUTES.includes("/dashboard"));
  assert.ok(ROUTES.includes("/"));
});

test("every signed-in surface requires a session", () => {
  for (const path of MUST_REQUIRE_SESSION) {
    assert.equal(requiresSession(path), true, `${path} must require a session`);
  }
});

test("public pages are not gated", () => {
  for (const path of MUST_BE_PUBLIC) {
    assert.equal(requiresSession(path), false, `${path} must stay public`);
  }
});

test("a public professor page is not caught by the /professors gate", () => {
  // The index is behind the wall; an individual faculty page is the public,
  // shareable, SEO-indexed one. These differ by a single trailing segment, which
  // is exactly the kind of distinction a prefix check gets wrong.
  assert.equal(requiresSession("/professors"), true);
  assert.equal(requiresSession("/professors/abc12345"), false);
  assert.equal(requiresSession("/professors/abc12345/anything"), false);
});

test("/prof is gated but /professors is not mistaken for it", () => {
  assert.equal(requiresSession("/prof"), true);
  assert.equal(requiresSession("/prof/dashboard"), true);
  // The original implementation needed an explicit `!path.startsWith("/professors")`
  // guard because `/prof` was tested as a prefix. Confirm the current shape does
  // not reintroduce that overlap.
  assert.equal(requiresSession("/professors/abc12345"), false);
});

test("no route in the real tree is left unclassified by accident", () => {
  // Every discovered route must appear in one of the two intent lists above.
  // A new page shows up here as a failure, which forces the author to say
  // whether it is public or protected instead of defaulting to public.
  const declared = new Set([...MUST_REQUIRE_SESSION, ...MUST_BE_PUBLIC]);
  const unclassified = ROUTES.map(concrete).filter((p) => !declared.has(p));

  assert.deepEqual(
    unclassified,
    [],
    `these routes exist but are not declared public or protected in this test:\n  ${unclassified.join("\n  ")}`,
  );
});

test("the protected lists contain no redundant entries", () => {
  // An exact entry that a prefix already covers is dead configuration, and dead
  // configuration is how the list drifts out of step with reality.
  for (const exact of PROTECTED_EXACT) {
    const covered = PROTECTED_PREFIXES.some((p) => exact.startsWith(p));
    assert.equal(covered, false, `"${exact}" is already covered by a prefix`);
  }
});
