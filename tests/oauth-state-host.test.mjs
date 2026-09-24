/**
 * The OAuth state cookie, and the host it is set on.
 *
 * `state_mismatch` is the failure this file exists for, and it is worth being
 * precise about what it means, because the two Better Auth errors look alike and
 * are not:
 *
 *   - `state_not_found` — the server has no stored verification for that state.
 *     Google's round trip never completed, or the record was cleaned up.
 *   - `state_mismatch`  — the record EXISTS, and the cookie presented alongside it
 *     does not agree. The handshake was fine; the browser simply did not send
 *     back the cookie that was set when it started.
 *
 * That second case has two causes in this app, both of them ours:
 *
 *   1. The handshake started on a host other than the apex. Better Auth sets
 *      `__Secure-better-auth.state` as a HOST-ONLY cookie, while `redirect_uri`
 *      is built from BETTER_AUTH_URL and always names the apex. Start on
 *      `www.schollective.com` and Google returns to `schollective.com`, which
 *      cannot see the cookie. The middleware's canonical-host redirect covered
 *      pages and, because its matcher excluded `api/auth`, never covered the
 *      endpoint that sets this cookie — so www would hand back a 200 and a
 *      Set-Cookie and the flow was already lost.
 *   2. The handshake was started twice. Every start issues a new state and
 *      OVERWRITES the cookie, so the tab the visitor actually finishes is the one
 *      whose state is gone. The Google buttons carried no `disabled`, and React
 *      state is not a lock: a second click in the same frame still reads
 *      `loading === false`.
 *
 * Both are covered here, along with the reason the failure was invisible: Better
 * Auth's error endpoint defaults to `/`, and `/` is a prerendered page that reads
 * no query parameters, so the visitor was shown a normal-looking landing page and
 * had to read the address bar to learn anything had gone wrong.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { middleware, config } from "../src/middleware.ts";

/** Runs the real middleware and reports only what it decided. */
async function decide(url, init) {
  const response = await middleware(new NextRequest(url, init));
  return { status: response.status, location: response.headers.get("location") };
}

/**
 * The matcher is applied by Next, not by the function, so calling the middleware
 * directly proves the logic and says nothing about whether it ever runs. Build
 * the pattern and test it as a path.
 */
const matcher = new RegExp(`^${config.matcher[0]}$`);

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("the matcher lets the auth API through, so the canonical-host redirect reaches it", () => {
  assert.equal(
    matcher.test("/api/auth/sign-in/social"),
    true,
    "excluding api/auth from the matcher is what let www set a host-only state cookie and lose the handshake",
  );
  assert.equal(matcher.test("/api/auth/callback/google"), true);
  // The exclusions that are still wanted.
  assert.equal(matcher.test("/_next/static/chunks/main.js"), false);
  assert.equal(matcher.test("/og-image.png"), false);
});

test("starting sign-in on www is canonicalised to the apex", async () => {
  const res = await decide("https://www.schollective.com/api/auth/sign-in/social", { method: "POST" });
  assert.equal(res.status, 308);
  assert.equal(
    res.location,
    "https://schollective.com/api/auth/sign-in/social",
    "the state cookie has to be set on the host the callback is delivered to",
  );
});

test("the apex is left alone", async () => {
  const res = await decide("https://schollective.com/api/auth/sign-in/social", { method: "POST" });
  assert.equal(res.location, null, "the canonical host must not redirect to itself");
  assert.equal(res.status, 200);
});

test("pages are still canonicalised and signed-in routes still gated", async () => {
  const page = await decide("https://www.schollective.com/login");
  assert.equal(page.status, 308);
  assert.equal(page.location, "https://schollective.com/login");

  const gated = await decide("https://schollective.com/dashboard");
  assert.equal(gated.status, 307);
  assert.equal(gated.location, "https://schollective.com/login?next=%2Fdashboard");
});

test("an OAuth error landing on / is forwarded to the page that can explain it", async () => {
  const res = await decide("https://schollective.com/?error=state_mismatch");
  assert.equal(res.status, 307);
  assert.equal(
    res.location,
    "https://schollective.com/login?error=state_mismatch",
    "the landing page renders no query parameters, so the reason has to reach the login page",
  );
});

test("a clean landing page is not redirected", async () => {
  const res = await decide("https://schollective.com/");
  assert.equal(res.location, null);
  assert.equal(res.status, 200);
});

test("the error forward cannot be turned into an open redirect", async () => {
  const res = await decide("https://schollective.com/?error=https://evil.example");
  assert.equal(res.status, 307);
  assert.ok(
    res.location.startsWith("https://schollective.com/login?error="),
    `expected a same-origin login URL, got ${res.location}`,
  );
});

/**
 * The button guards are markup, so they are read as source. The assertion that
 * matters is that the Google button carries a `disabled` that includes the
 * pending state — without it every click starts another handshake.
 */
for (const [label, path] of [
  ["login", "src/app/(auth)/login/page.tsx"],
  ["signup", "src/app/(auth)/signup/page.tsx"],
]) {
  test(`${label}: the Google button is disabled while a sign-in is pending`, () => {
    const source = read(path);
    const at = source.indexOf("onClick={handleGoogleSignIn}");
    assert.notEqual(at, -1, `${label} must still render the Google button`);

    const button = source.slice(Math.max(0, source.lastIndexOf("<Button", at)), source.indexOf(">", at));
    assert.match(button, /disabled=\{loading \|\| !hydrated\}/, `${label}: the Google button has no disabled guard`);

    assert.match(
      source,
      /googlePending\.current\) return;/,
      `${label}: a re-entrant click must be refused, because React state does not update before the next click`,
    );
  });
}

test("the state failures are named rather than reported as a generic error", () => {
  for (const path of ["src/app/(auth)/login/page.tsx", "src/app/(auth)/signup/page.tsx"]) {
    const source = read(path);
    assert.match(
      source,
      /errorParam === "state_mismatch" \|\| errorParam === "state_not_found"/,
      `${path} must distinguish a lost state handshake from an unknown error`,
    );
  }
});
