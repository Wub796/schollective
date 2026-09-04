/**
 * Every server action establishes who is calling before it does anything.
 *
 * An export of a "use server" module is a public HTTP endpoint: its id sits in a
 * static JS chunk and anyone can invoke it, page guard or not (see
 * src/lib/authz.ts). This walks every such module and fails on any exported
 * function whose body never awaits one of the authz helpers.
 *
 * It exists because `clearAdminNonAdminData` was exported from an admin actions
 * file with no check at all and a user id it trusted. Every query ran under that
 * id, so invoking it with someone else's id deleted their threads, messages and
 * AI review jobs. A helper that must not be callable from the client belongs in
 * a plain server module instead (as src/lib/admin-preview.ts now is).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "..", "src");
const AUTHZ_CALL = /await\s+require(?:User|Role|Admin|StudentActor)\s*\(/;

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

const actionModules = sourceFiles(SRC).filter((file) =>
  /^\s*["']use server["'];?/.test(readFileSync(file, "utf8")),
);

test("server action modules were found", () => {
  assert.ok(actionModules.length >= 8, `only found ${actionModules.length} "use server" modules`);
});

test("every exported server action awaits an authz helper", () => {
  const unguarded = [];
  for (const file of actionModules) {
    const source = readFileSync(file, "utf8");
    const exports = [...source.matchAll(/^export\s+(?:async\s+)?function\s+(\w+)/gm)];
    exports.forEach((match, index) => {
      const bodyEnd = index + 1 < exports.length ? exports[index + 1].index : source.length;
      const body = source.slice(match.index, bodyEnd);
      if (!AUTHZ_CALL.test(body)) unguarded.push(`${relative(SRC, file)}: ${match[1]}`);
    });
  }
  assert.deepEqual(unguarded, [], `server actions with no authorization check:\n  ${unguarded.join("\n  ")}`);
});

test('"use server" modules export only functions', () => {
  // A non-function export from a server module is rejected at build time by
  // Next, but a `const` arrow export slips past the check above entirely.
  const problems = [];
  for (const file of actionModules) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/^export\s+(const|let|var|class)\s+(\w+)/gm)) {
      problems.push(`${relative(SRC, file)}: ${match[1]} ${match[2]}`);
    }
  }
  assert.deepEqual(problems, []);
});
