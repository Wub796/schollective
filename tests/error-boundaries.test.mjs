import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Structural guards for the error surfaces.
 *
 * These exist because of a real defect: `InteractiveOnboardingTour` was handed
 * lucide icon *functions* across the server/client boundary, so every signed-in
 * visit to /dashboard threw. Nothing caught it — the routes redirect() before
 * building JSX, so an anonymous sweep never reached the throw, and the tour
 * tests covered the gating rather than the props. The user's experience was a
 * bare "An error occurred in the Server Components render" with the entire app
 * shell gone, because there was no boundary between the throw and the root.
 *
 * A boundary cannot stop a bug, but it decides how much of the app a bug takes
 * with it. These assertions keep that decision in place.
 */

const APP = path.resolve(import.meta.dirname, "..", "src", "app");

async function dirsWith(entry) {
  const found = [];
  for (const dirent of await readdir(APP, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    if (dirent.name === "api") continue; // route handlers have their own errors
    const full = path.join(APP, dirent.name, entry);
    if (await stat(full).then(() => true, () => false)) found.push(dirent.name);
  }
  return found;
}

test("every route group with a layout also has an error boundary", async () => {
  const groups = await dirsWith("layout.tsx");
  assert.ok(groups.length >= 3, `expected several route groups, found ${groups.length}`);

  const missing = [];
  for (const group of groups) {
    const hasBoundary = await stat(path.join(APP, group, "error.tsx")).then(
      () => true,
      () => false,
    );
    if (!hasBoundary) missing.push(group);
  }

  // A boundary placed at the root instead of in the group still catches the
  // error, but it replaces the group's layout too — which is how a failing page
  // comes to take the navigation down with it.
  assert.deepEqual(
    missing,
    [],
    `these groups have a layout but no error.tsx, so a throw drops their shell: ${missing.join(", ")}`,
  );
});

test("the app root has a fallback boundary for segments with no group", async () => {
  await assert.doesNotReject(
    stat(path.join(APP, "error.tsx")),
    "src/app/error.tsx is missing: /messages, the auth pages and /deactivated rely on it",
  );
});

test("every error boundary is a client component and reports to Sentry", async () => {
  const boundaries = [];
  for (const group of await dirsWith("error.tsx")) {
    boundaries.push([`${group}/error.tsx`, path.join(APP, group, "error.tsx")]);
  }
  boundaries.push(["error.tsx", path.join(APP, "error.tsx")]);
  boundaries.push(["global-error.tsx", path.join(APP, "global-error.tsx")]);
  assert.ok(boundaries.length >= 4, `expected several boundaries, found ${boundaries.length}`);

  for (const [label, file] of boundaries) {
    const src = await readFile(file, "utf8");
    // error.tsx must be a client component: it takes a `reset` callback.
    assert.match(src, /^"use client";/, `${label} must start with "use client"`);
    assert.match(
      src,
      /Sentry|captureException|ErrorState/,
      `${label} reports nothing, so a crash here is invisible`,
    );
  }
});

test("the boundary that replaces the root layout renders its own document", async () => {
  const src = await readFile(path.join(APP, "global-error.tsx"), "utf8");
  // global-error.tsx replaces the root layout, so no <html>/<body> exists
  // unless it renders them itself.
  assert.match(src, /<html\b/, "global-error.tsx must render <html>");
  assert.match(src, /<body\b/, "global-error.tsx must render <body>");
});

test("the way out of an error page resolves by session rather than assuming", async () => {
  const errorState = path.resolve(import.meta.dirname, "..", "src", "components", "ui", "ErrorState.tsx");
  const src = await readFile(errorState, "utf8");

  // Both surfaces used to link to "/" unconditionally, which sends a signed-in
  // user to the marketing page with their session still live and no way back
  // into the product — the exact state an error page exists to fix. `/home`
  // asks the session and picks `/` or the dashboard.
  assert.match(src, /href="\/home"/, 'ErrorState must send "Go home" through the session-aware route');
  assert.doesNotMatch(src, /href="\/"/, "ErrorState links straight to the landing page again");

  const notFound = await readFile(path.join(APP, "not-found.tsx"), "utf8");
  assert.match(notFound, /href="\/home"/, "the 404 page must use the same session-aware home");

  // And the route has to actually answer the question: a session goes to the
  // dashboard, an anonymous request goes to the landing page.
  const home = await readFile(path.join(APP, "home", "route.ts"), "utf8");
  assert.match(home, /getCurrentUserAndProfile/, "/home must read the session before redirecting");
  assert.match(home, /user \? "\/dashboard" : "\/"/, "/home must pick the dashboard for a signed-in user");
});

test("the shared error surface never depends on a token that may be unloaded", async () => {
  const file = path.resolve(import.meta.dirname, "..", "src", "components", "ui", "ErrorState.tsx");
  const src = await readFile(file, "utf8");

  // global-error.tsx runs when the root layout failed, so globals.css may never
  // have loaded. A bare var(--x) would then resolve to nothing and the page
  // would render in the browser's default colours.
  const bare = [...src.matchAll(/var\((--[a-z-]+)\)/g)].map((m) => m[1]);
  assert.deepEqual(
    bare,
    [],
    `these tokens have no literal fallback and render empty when globals.css is absent: ${bare.join(", ")}`,
  );
});
