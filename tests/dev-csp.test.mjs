/**
 * The development CSP, and the login failure it caused.
 *
 * `next dev` links modules through `eval` (webpack's devtool and React Refresh
 * both do), so a `script-src` without `'unsafe-eval'` blocks every client chunk.
 * The page still server-renders, which is why it looked like anything but a CSP
 * problem: the HTML, the CSS and the copy all arrived, hydration never ran, the
 * nav — which returns null until it mounts — was simply absent, and every submit
 * button gated on `useHydrated()` stayed disabled. Nobody could log in, in any
 * role, and no server-side error said so.
 *
 * The grant is dev-only. Production bundles do not eval, so the deployed policy
 * must not carry it.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CONFIG_PATH = new URL("../next.config.ts", import.meta.url);

async function cspForCurrentMode() {
  const { default: config } = await import(CONFIG_PATH.href);
  const rules = await config.headers();
  const headers = rules.flatMap((rule) => rule.headers).filter(Boolean);
  const csp = headers.find((header) => header.key === "Content-Security-Policy");
  assert.ok(csp, "next.config.ts must still emit a Content-Security-Policy");
  return csp.value.split(";").map((directive) => directive.trim());
}

function scriptSrcOf(directives) {
  const directive = directives.find((entry) => entry.startsWith("script-src "));
  assert.ok(directive, "the policy must state script-src");
  return directive;
}

test("the eval grant matches the mode the config was loaded in", async () => {
  const scriptSrc = scriptSrcOf(await cspForCurrentMode());

  if (process.env.NODE_ENV === "development") {
    assert.match(scriptSrc, /'unsafe-eval'/, "next dev cannot hydrate without it");
    return;
  }

  assert.doesNotMatch(scriptSrc, /'unsafe-eval'/, "the deployed policy must not grant eval");
});

test("the eval grant is tied to NODE_ENV, not left on for production", () => {
  const source = readFileSync(CONFIG_PATH, "utf8");

  assert.match(
    source,
    /const isDev = process\.env\.NODE_ENV === "development"/,
    "the dev check has to be read from the runtime environment",
  );
  assert.match(
    source,
    /'unsafe-inline'\$\{isDev \? " 'unsafe-eval'" : ""\}/,
    "script-src must add 'unsafe-eval' only when isDev is true",
  );
});
