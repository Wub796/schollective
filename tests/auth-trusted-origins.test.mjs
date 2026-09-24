/**
 * The auth trusted-origin list, and the two login outages its shape caused.
 *
 * Every mutating request to the auth API has its `Origin` header checked against
 * `trustedOrigins`. The answer when it is not in the list is a flat `403
 * INVALID_ORIGIN`, and the login form can only report that as a generic failure
 * — it reads as "login is broken", not as "this host is not trusted". First the
 * list named three dev ports, so a dev server on any other port rejected every
 * sign-in. Then it trusted loopback only outside production, which meant a
 * production build served locally (`next start` sets NODE_ENV=production) while
 * the client posted to `window.location.origin` — every sign-in got a 403.
 *
 * These assertions run the real resolver, imported from the module the auth
 * instance itself uses. They used to regex the text of src/lib/auth.ts, which
 * pinned the shape of the code rather than the decision it makes, and so could
 * only ever confirm that the list was still written one particular way.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { resolveTrustedOrigins, isLoopbackHost } from "../src/lib/trusted-origins.ts";

/** The deployed origins, whatever environment the tests run in. */
const DEPLOYED = [
  "https://schollective.com",
  "https://www.schollective.com",
  "https://schollective.schollective.workers.dev",
];

test("loopback hosts are recognised, with any port and in both IP forms", () => {
  for (const host of ["localhost", "localhost:3001", "LOCALHOST:8080", "127.0.0.1", "127.0.0.1:3001", "[::1]:3001"]) {
    assert.equal(isLoopbackHost(host), true, `${host} is the local machine`);
  }

  for (const host of ["schollective.com", "localhost.evil.example", "notlocalhost", "0.0.0.0:3000", "", null, undefined]) {
    assert.equal(isLoopbackHost(host), false, `${host} is not the local machine`);
  }
});

test("a local production build can sign in — the regression that read as 'login is broken'", () => {
  // `next start` serves on localhost with NODE_ENV=production. The client posts
  // to window.location.origin, so this is the exact pair that must agree.
  const origins = resolveTrustedOrigins("localhost:3001");

  assert.ok(
    origins.includes("http://localhost:*"),
    "serving a production build locally has to trust localhost, or every sign-in 403s",
  );
});

test("loopback is not trusted for a request that arrived somewhere else", () => {
  for (const host of ["schollective.com", "schollective.schollective.workers.dev", null]) {
    const origins = resolveTrustedOrigins(host);
    assert.ok(
      !origins.some((o) => o.includes("localhost")),
      `a request arriving on ${host} must not have loopback trusted`,
    );
  }
});

test("the loopback patterns keep their wildcard", () => {
  const origins = resolveTrustedOrigins("localhost:3001");
  const loopback = origins.filter((o) => o.includes("localhost") || o.includes("127.0.0.1"));

  assert.ok(loopback.length > 0);
  for (const pattern of loopback) {
    // Better Auth compares a wildcard-free pattern by exact full-origin
    // equality, so "http://localhost" would not match "http://localhost:3001".
    assert.ok(
      pattern.includes("*"),
      `${pattern} needs a port wildcard, or a dev server on any port still cannot sign in`,
    );
  }
});

test("no fixed dev port is pinned anywhere in the list", () => {
  const origins = resolveTrustedOrigins("localhost:3001");

  for (const origin of origins) {
    assert.doesNotMatch(
      origin,
      /localhost:\d+/,
      "a fixed dev port is only correct for the day it was picked — the wildcard covers dev instead",
    );
  }
});

test("the deployed domains are still trusted explicitly", () => {
  const origins = resolveTrustedOrigins("schollective.com");

  for (const origin of DEPLOYED) {
    assert.ok(
      origins.includes(origin),
      `${origin} must stay trusted or production sign-in breaks the same way`,
    );
  }
});

test("a configured app URL is trusted in whatever environment sets it", () => {
  const origins = resolveTrustedOrigins("schollective.com", {
    betterAuthUrl: "https://staging.schollective.com",
    publicAppUrl: "https://preview-abc.schollective.workers.dev/",
  });

  assert.ok(origins.includes("https://staging.schollective.com"), "BETTER_AUTH_URL must be trusted");
  assert.ok(
    origins.includes("https://preview-abc.schollective.workers.dev"),
    "NEXT_PUBLIC_APP_URL must be trusted, with any trailing slash trimmed",
  );
});

test("a host is never trusted for its trailing-slash variant", () => {
  // An Origin header never carries a trailing slash, and the comparison is
  // exact, so an untrimmed value would silently fail to match itself.
  const origins = resolveTrustedOrigins("schollective.com", {
    publicAppUrl: "https://schollective.com/",
  });

  assert.ok(origins.includes("https://schollective.com"));
  assert.ok(!origins.includes("https://schollective.com/"));
});
