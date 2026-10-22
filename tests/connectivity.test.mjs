/**
 * The connection store is what lets the island say "Offline" instead of
 * "All caught up", so the rule that separates a slow server from a broken one
 * is worth pinning: a 5xx is the backend (or its database) failing, while a
 * status it chose — 401, 429 — still proves the server answered.
 */

import test from "node:test";
import assert from "node:assert/strict";

const {
  currentConnection,
  reportOffline,
  reportOnline,
  reportRequestFailure,
  reportResponse,
} = await import("../src/lib/connectivity.ts");

test("a 5xx response marks the app offline", () => {
  reportOnline();
  reportResponse(new Response(null, { status: 503 }));
  assert.equal(currentConnection(), "offline");
});

test("a chosen error status still means the server is reachable", () => {
  reportOffline();
  reportResponse(new Response(null, { status: 401 }));
  assert.equal(currentConnection(), "online");
});

test("a thrown request is offline", () => {
  reportOnline();
  reportRequestFailure();
  assert.equal(currentConnection(), "offline");
});

test("a successful response restores the online state", () => {
  reportOffline();
  reportResponse(new Response("{}", { status: 200 }));
  assert.equal(currentConnection(), "online");
});
