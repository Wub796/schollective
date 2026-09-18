/**
 * Internal links that point at nothing.
 *
 * A link to a route that does not exist is the quietest failure this app can
 * have. The page returns 404, the middleware logs nothing, every test passes, and
 * a route sweep of the built server looks perfect — it only shows up when a human
 * clicks the thing. Next also PREFETCHES links in the viewport, so a dead target
 * costs a wasted render on every page that carries it.
 *
 * This walks the real route tree, reads every internal link and redirect in
 * `src/`, and insists each one resolves. Dynamic targets (`/professors/${id}`)
 * are skipped because their value is a runtime id, and that is the honest limit
 * of a static check — it catches the mistyped literal, not the wrong id.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const APP_DIR = join(ROOT, "src", "app");

/**
 * Every path the router will serve, applying the App Router conventions this
 * project uses: `(group)` segments are organisational and contribute nothing to
 * the URL, and `[param]` / `[...param]` become placeholders.
 *
 * `page.tsx` makes a page and `route.ts` makes an endpoint; metadata files
 * (`sitemap.ts`, `robots.ts`, `manifest.ts`) each publish one URL of their own.
 */
function routePaths(dir = APP_DIR, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const segment = /^\(.+\)$/.test(entry) ? "" : `/${entry}`;
      out.push(...routePaths(full, prefix + segment));
    } else if (entry === "page.tsx" || entry === "route.ts") {
      out.push(prefix === "" ? "/" : prefix);
    } else if (/^(sitemap|robots|manifest)\.ts$/.test(entry)) {
      out.push(`${prefix}/${entry.replace(/\.ts$/, "")}${entry === "manifest.ts" ? ".webmanifest" : entry === "sitemap.ts" ? ".xml" : ".txt"}`);
    }
  }
  return out;
}

/** Turns a route pattern into a regex that matches a concrete path. */
function routePattern(route) {
  const escaped = route
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\[\.\.\.[^\]]+\]/g, ".*")
    .replace(/\[[^\]]+\]/g, "[^/]+");
  return new RegExp(`^${escaped}/?$`);
}

const ROUTES = routePaths();
const MATCHERS = ROUTES.map(routePattern);

/** Anything served straight out of /public is a valid target too. */
function publicFiles(dir = join(ROOT, "public"), prefix = "") {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return publicFiles(full, `${prefix}/${entry}`);
    return [`${prefix}/${entry}`];
  });
}
const PUBLIC = new Set(publicFiles());

/** All source files that could contain a link. */
function sourceFiles(dir = join(ROOT, "src")) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : [];
  });
}

/**
 * Internal targets, per line so a failure can name the file and line.
 *
 * Each pattern captures the WHOLE literal. Capturing only up to the `$` of an
 * interpolation would read `/students/${person.id}` as the bare prefix
 * `/students/` and report a link that is in fact fine, so an interpolated
 * template is skipped instead: nothing static can be said about its value.
 */
const PATTERNS = [
  /\bhref="([^"]*)"/,
  /\bhref=\{"([^"]*)"\}/,
  /\bhref=\{`([^`]*)`\}/,
  /\bredirect\(\s*"([^"]*)"/,
  /\bredirect\(\s*`([^`]*)`/,
  /\brouter\.(?:push|replace)\(\s*"([^"]*)"/,
  /\brouter\.(?:push|replace)\(\s*`([^`]*)`/,
];

/** A target worth checking: internal, not interpolated, not a bare fragment. */
function linkTarget(raw) {
  if (!raw.startsWith("/") || raw.includes("${")) return null;
  return raw.split(/[?#]/)[0];
}

/** Targets that are real but are not routes served by this app. */
const ALLOWED = new Set(["/favicon.ico"]);

function isInternalRoute(target) {
  const path = target.replace(/\/$/, "") || "/";
  if (ALLOWED.has(path)) return true;
  if (PUBLIC.has(path)) return true;
  return MATCHERS.some((matcher) => matcher.test(path));
}

const offenders = [];

for (const file of sourceFiles()) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    // A comment is not a link.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    for (const pattern of PATTERNS) {
      const match = line.match(pattern);
      if (!match) continue;
      const target = linkTarget(match[1]);
      if (target === null) continue;
      if (!isInternalRoute(target)) {
        offenders.push(`${relative(ROOT, file)}:${index + 1}  ${target}`);
      }
    }
  });
}

test("the route tree was discovered", () => {
  assert.ok(ROUTES.length > 20, `only found ${ROUTES.length} routes — the walker is broken`);
  assert.ok(MATCHERS.some((m) => m.test("/dashboard")), "/dashboard must be a known route");
});

test("every internal link points at a route that exists", () => {
  assert.deepEqual(
    offenders,
    [],
    `these links have no matching route:\n  ${offenders.join("\n  ")}`,
  );
});
