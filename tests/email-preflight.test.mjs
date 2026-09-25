import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

/**
 * The email preflight, which exists because a half-configured deployment looks
 * exactly like a working one: the app stores the report, the queue renders, and
 * nobody is ever told. These tests pin the two failures that matter most — that
 * it refuses to call an incomplete configuration good, and that it never prints
 * the key it is checking — and they run the script rather than reading it, so a
 * check that stops working fails here.
 *
 * Everything runs with `--no-env` and `--offline`: no file from the developer's
 * tree is read, and no request leaves the machine, so the result does not depend
 * on who is running the suite or on Resend being up.
 */

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = "tools/verify-email.mjs";

const EMAIL_VARS = [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SAFETY_EMAIL_TO",
  "FEEDBACK_EMAIL_TO",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
];

async function preflight(env = {}, args = ["--no-env", "--offline"]) {
  const inherited = { ...process.env };
  for (const name of EMAIL_VARS) delete inherited[name];

  try {
    const { stdout, stderr } = await run(
      process.execPath,
      ["--import", "./tests/helpers/register.mjs", SCRIPT, ...args],
      { cwd: ROOT, env: { ...inherited, ...env } },
    );
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error) {
    return { code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

const COMPLETE = {
  RESEND_API_KEY: "re_test_key_for_the_preflight",
  EMAIL_FROM: "Schollective <notifications@schollective.com>",
  SAFETY_EMAIL_TO: "safety@schollective.com",
};

test("an unconfigured deployment fails the check instead of reporting success", async () => {
  const { code, output } = await preflight();

  assert.equal(code, 1, "a missing key, sender and address must not exit 0");
  assert.match(output, /RESEND_API_KEY is not set/);
  assert.match(output, /EMAIL_FROM is not set/);
  assert.match(output, /SAFETY_EMAIL_TO is not set/);
});

test("a recipient list is rejected, because a list is one invalid address to Resend", async () => {
  const { code, output } = await preflight({
    ...COMPLETE,
    SAFETY_EMAIL_TO: "safety@schollective.com, another@schollective.com",
  });

  assert.equal(code, 1);
  assert.match(output, /exactly one address/);
});

test("a complete configuration passes, and says plainly that nothing was sent", async () => {
  const { code, output } = await preflight(COMPLETE);

  assert.equal(code, 0, output);
  assert.match(output, /The email path is configured/);
  assert.match(output, /Nothing was sent/);
  assert.doesNotMatch(output, /re_test_key_for_the_preflight/);
});

test("the check exercises the application's own template and its own transport", () => {
  const source = readFileSync(join(ROOT, SCRIPT), "utf8");

  // A copy of the template or a second transport would pass while the code that
  // actually runs drifts away from it.
  assert.match(source, /import \{[^}]*sendEmail[^}]*safetyReportEmail[^}]*\} from "@\/lib\/email"/s);

  // The one rule for a script that handles a live key: it never prints it. The
  // key goes through `describeSecret`, which reveals a length and a prefix.
  assert.match(source, /value\.slice\(0, 3\)/);
  assert.doesNotMatch(source, /console\.[a-z]+\([^\n]*\bapiKey\b/, "the API key is never passed to console");
});

test("the npm script wires the check up with the TypeScript loader it needs", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

  assert.match(pkg.scripts["verify:email"], /tests\/helpers\/register\.mjs/);
  assert.match(pkg.scripts["verify:email"], /tools\/verify-email\.mjs/);

  // `scripts/` is in .gitignore, and a check that is not committed runs for
  // exactly one person. Pinned because that is how this file started life.
  assert.doesNotMatch(pkg.scripts["verify:email"], /(^|[^.\w/])scripts\//);
});
