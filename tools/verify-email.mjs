#!/usr/bin/env node
/**
 * The preflight for the email path, run before a deploy.
 *
 * Every failure in this area is silent, and that is the whole reason this file
 * exists. `sendEmail` returns `false` and logs to the Worker console when
 * `RESEND_API_KEY` or `EMAIL_FROM` is missing; Resend rejects a send with a 403
 * when the sender's domain is not verified; and the safety route treats all of
 * that as a heads-up that did not happen, because the report itself is already
 * stored by then. A deployment can therefore look healthy, pass CI, render a
 * green admin queue, and never once email anybody about a child.
 *
 * So this checks the four things that decide whether a message actually arrives:
 * a key, a sender on a verified domain, a recipient that is one valid address,
 * and — with `--send` — the API's own answer when we hand it the real template.
 * It imports the application's own `sendEmail` and `safetyReportEmail` rather
 * than re-testing a copy, so a change to the template or the transport is
 * covered by the check rather than missed by it.
 *
 * Lives in `tools/` rather than `scripts/`, which .gitignore reserves for local
 * utility scripts — a check that only exists on one machine checks nothing.
 *
 * Usage (the npm script adds the TypeScript loader this needs):
 *   npm run verify:email                                  # checks only, no mail
 *   npm run verify:email -- --send                         # one real test email
 *   npm run verify:email -- --send --to=me@example.com      # send it to yourself
 *   npm run verify:email -- --offline                       # skip the network
 *
 * Flags: `--send`, `--to=<address>`, `--offline`, `--no-env`,
 * `--env-file=<path>` (repeatable). Exit code is 1 if anything is wrong, so this
 * can gate a deploy.
 */

import { existsSync, readFileSync } from "node:fs";
import { sendEmail, safetyReportEmail } from "@/lib/email";

const RESEND_API = "https://api.resend.com";

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const offline = hasFlag("offline");
const send = hasFlag("send");
const sendTo = option("to");

/**
 * Environment: the real process environment wins over any file, so
 * `RESEND_API_KEY=... npm run verify:email` checks a value without editing
 * anything. Only the keys we do not already have are filled in.
 */
const envFiles = hasFlag("no-env")
  ? []
  : args.filter((arg) => arg.startsWith("--env-file=")).map((arg) => arg.slice("--env-file=".length));

const filesToLoad = hasFlag("no-env") ? [] : envFiles.length > 0 ? envFiles : [".env.local", ".env.production"];

function loadEnvFile(path) {
  if (!existsSync(path)) return false;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, name, raw] = match;
    if (process.env[name]) continue;
    const value = raw.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
    if (value) process.env[name] = value;
  }
  return true;
}

const loaded = [];
for (const file of filesToLoad) {
  if (loadEnvFile(file)) loaded.push(file);
}

const problems = [];
const warnings = [];
const ok = [];

/** A key is never printed. This exists so the output can be pasted into an issue. */
function describeSecret(value) {
  if (!value) return "not set";
  return `set (${value.slice(0, 3)}…, ${value.length} chars)`;
}

const ADDRESS = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

/** `Name <addr@domain>` or a bare address. */
function parseSender(value) {
  const angled = /<([^>]+)>\s*$/.exec(value);
  return (angled ? angled[1] : value).trim();
}

function domainOf(address) {
  return address.slice(address.lastIndexOf("@") + 1).toLowerCase();
}

// ── Presence and shape, no network ──────────────────────────────────────────
const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;
const safetyTo = process.env.SAFETY_EMAIL_TO;
const feedbackTo = process.env.FEEDBACK_EMAIL_TO;

let senderAddress = null;

if (!apiKey) {
  problems.push(
    "RESEND_API_KEY is not set, so every email (reset, verification, feedback, safety) is logged to the console instead of sent.",
  );
} else if (!apiKey.startsWith("re_")) {
  warnings.push(`RESEND_API_KEY does not start with "re_" — is that a Resend key? (${describeSecret(apiKey)})`);
} else {
  ok.push(`RESEND_API_KEY: ${describeSecret(apiKey)}`);
}

if (!emailFrom) {
  problems.push(
    "EMAIL_FROM is not set. It is required in addition to the key, and must be an address on a domain verified in Resend.",
  );
} else {
  senderAddress = parseSender(emailFrom);
  if (!ADDRESS.test(senderAddress)) {
    problems.push(`EMAIL_FROM does not contain a usable address: ${JSON.stringify(emailFrom)}`);
    senderAddress = null;
  } else {
    ok.push(`EMAIL_FROM: ${senderAddress} (domain ${domainOf(senderAddress)})`);
  }
}

if (!safetyTo) {
  problems.push(
    "SAFETY_EMAIL_TO is not set, so a safety report lands in /admin/safety and nowhere else. That is the silence this feature exists to prevent.",
  );
} else if (/[,;]/.test(safetyTo) || /\s/.test(safetyTo.trim())) {
  problems.push(
    `SAFETY_EMAIL_TO must be exactly one address: the value is handed to Resend as a single recipient, so a list becomes one invalid address and the send is rejected. Use an alias or group that expands to the people who read it. Got ${JSON.stringify(safetyTo)}.`,
  );
} else if (!ADDRESS.test(safetyTo.trim())) {
  problems.push(`SAFETY_EMAIL_TO is not a valid address: ${JSON.stringify(safetyTo)}`);
} else {
  ok.push(`SAFETY_EMAIL_TO: ${safetyTo.trim()}`);
}

if (feedbackTo && safetyTo && feedbackTo.trim().toLowerCase() === safetyTo.trim().toLowerCase()) {
  warnings.push(
    "FEEDBACK_EMAIL_TO and SAFETY_EMAIL_TO are the same address. They are separate on purpose: a report about a child should not queue behind beta noise.",
  );
}

if (!process.env.BETTER_AUTH_URL && !process.env.NEXT_PUBLIC_APP_URL) {
  warnings.push(
    "Neither BETTER_AUTH_URL nor NEXT_PUBLIC_APP_URL is set, so the report email's link to /admin/safety will be a bare path.",
  );
}

const target = sendTo || safetyTo?.trim() || null;

if (send && !target) {
  problems.push("--send needs a recipient: set SAFETY_EMAIL_TO, or pass --to=<address>.");
}

// ── Network: what Resend says about this key and this sender ────────────────
async function callResend(path, init = {}) {
  const response = await fetch(`${RESEND_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

let senderVerified = false;

if (offline) {
  warnings.push("--offline was passed, so the Resend API was not called and the domain was not checked.");
} else if (!apiKey || !senderAddress) {
  warnings.push("Skipping the Resend API check until a key and a sender are both in place.");
} else {
  try {
    const { status, body } = await callResend("/domains");

    if (status === 401 || status === 403) {
      problems.push(`Resend rejected the key (HTTP ${status}). It is wrong, revoked, or from another account.`);
    } else if (status >= 400) {
      problems.push(`Resend answered HTTP ${status} for /domains: ${JSON.stringify(body)}`);
    } else {
      const domains = Array.isArray(body?.data) ? body.data : [];
      const senderDomain = domainOf(senderAddress);
      const match = domains.find((entry) => String(entry?.name).toLowerCase() === senderDomain);

      if (senderDomain === "resend.dev") {
        warnings.push(
          "EMAIL_FROM is on resend.dev, Resend's test domain. It only delivers to the address that owns the Resend account, so mail will not reach whatever SAFETY_EMAIL_TO points at.",
        );
        senderVerified = true;
      } else if (!match) {
        problems.push(
          `EMAIL_FROM uses ${senderDomain}, which this Resend account does not have. Sends from it are rejected with 403.`,
        );
      } else if (match.status !== "verified") {
        problems.push(`The domain ${senderDomain} is "${match.status}" in Resend, not verified. Sends will be rejected.`);
      } else {
        senderVerified = true;
        ok.push(`Domain ${senderDomain} is verified in Resend.`);
      }

      if (domains.length === 0 && senderDomain !== "resend.dev") {
        warnings.push("This Resend account lists no domains at all.");
      }
    }
  } catch (error) {
    warnings.push(`Could not reach the Resend API: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ── The real send, through the application's own transport and template ─────
if (send && target && apiKey && senderAddress && (offline ? false : senderVerified || hasFlag("force"))) {
  const origin = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  const template = safetyReportEmail({
    categoryLabel: "Off-platform contact",
    reporterLabel: "preflight check (verify:email)",
    message:
      "This is a test of the safety notification path, sent deliberately by tools/verify-email.mjs. Nothing is wrong.",
    involvesMinor: false,
    evidenceCopied: 0,
    adminUrl: origin ? `${origin.replace(/\/$/, "")}/admin/safety` : "/admin/safety",
  });

  const delivered = await sendEmail({
    to: target,
    // Labelled, because this lands in a mailbox somebody might be on call for.
    subject: `[Preflight, not a report] ${template.subject}`,
    html: template.html,
    text: `PREFLIGHT TEST — this is not a real safety report.\n\n${template.text}`,
  });

  if (delivered) {
    ok.push(`Sent one test email to ${target}.`);
  } else {
    problems.push(
      `Resend refused the test send to ${target}. The error above (worker console / [email] prefix) says why — usually an unverified sender or a recipient outside the test domain's allowance.`,
    );
  }
} else if (send && target && !offline && !senderVerified) {
  warnings.push("Skipped the test send because the sender domain is not verified yet. Re-run after verifying it.");
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log("");
console.log(`Email configuration check${offline ? " (offline)" : ""}`);
console.log(loaded.length ? `Env files read: ${loaded.join(", ")}` : "Env files read: none");

for (const line of ok) console.log(`  \u2713 ${line}`);
for (const line of warnings) console.log(`  ! ${line}`);
for (const line of problems) console.log(`  \u2717 ${line}`);

console.log("");

if (problems.length > 0) {
  console.log(`${problems.length} problem${problems.length === 1 ? "" : "s"} to fix before this deployment can email anyone.`);
  console.log("Values belong in .env.local locally (it is gitignored) and in the Worker's secrets in production:");
  console.log("  wrangler secret put RESEND_API_KEY");
  console.log("  wrangler secret put EMAIL_FROM");
  console.log("  wrangler secret put SAFETY_EMAIL_TO");
  process.exit(1);
}

console.log("The email path is configured for this environment.");
if (!send) {
  console.log("Nothing was sent. Add --send to prove it end to end (or --send --to=you@example.com for a trial run).");
} else if (process.env.SAFETY_EMAIL_TO) {
  console.log(`Check the inbox for ${process.env.SAFETY_EMAIL_TO}: if the test arrived, a real report will too.`);
}
console.log("Remember the Worker needs the same three secrets — a local .env.local proves nothing about production.");
