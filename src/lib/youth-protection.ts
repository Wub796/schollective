/**
 * Youth protection for one-to-one mentorships.
 * ─────────────────────────────────────────────────────────────────
 * Most threads on this platform are one professor and one student, and a large
 * share of those students are in high school. That combination — an adult with
 * institutional authority, a minor, a private two-person channel, and no third
 * party reading it — is the exact shape every youth-organisation safeguarding
 * policy is written about. This module is where those rules live, so that the
 * policy, the enforcement and the copy shown to people cannot drift apart.
 *
 * WHAT IT DOES NOT DO
 * It is not a content filter. Slurs, threats and spam are `filterMessage` in
 * src/lib/validators.ts and already run on every message. This module adds only
 * the rules that exist *because* the student may be a minor:
 *
 *   1. Who counts as a minor here — the recorded date of birth first, the
 *      education level as a fallback (see `resolveMinorFlag`)
 *   2. Where a mentor conversation may happen (on-platform, always)
 *   3. What may never be said to a student in a minor thread
 *   4. Guardian consent, and what has to be true before a minor may use this
 *   5. The vocabulary and validation for a safety report
 *   6. The policy text the /safety page publishes, in one place
 *
 * WHO IS A MINOR: ASKED FIRST, INFERRED SECOND
 * The date of birth on the account decides. It is the only signal that is
 * right on a birthday without anyone doing anything, and it is what the guardian
 * consent hangs off. Where there is no date of birth, the education level every
 * student already gave stands in: anything under the high-school family
 * (`high-school`, `high-school-underclassman`, `high-school-junior`,
 * `high-school-senior`) is treated as a minor, which is the conservative
 * reading — a high-school slug is far more likely to be a 16-year-old than an
 * adult.
 *
 * The fallback is deliberately one-directional. It over-protects: a 19-year-old
 * who has not updated their education level is treated as a minor, and the worst
 * outcome is that an adult is asked to keep their conversation on the platform.
 * It never under-protects a minor who *did* tell us they are in high school.
 * What it cannot catch is a minor who listed "college" and never gave a date of
 * birth — so the date of birth is asked for during onboarding, and
 * `needsAgeStatement` names an account that still has none. That gap is the
 * reason both signals exist rather than either one alone.
 *
 * The date of birth itself is NOT stored on `profiles`. That table is read with
 * `SELECT *` in src/lib/neon/profiles.ts and the row is handed to client
 * components, so a column there is a column one careless query away from a
 * browser. It lives in the separate, admin-and-owner-only table created by
 * db/migrations/0014_youth_protection.sql, and what the rest of the app sees is
 * the derived boolean `profiles.is_minor`.
 *
 * Dependencies, precisely: the shared text sanitiser from src/lib/feedback.ts
 * (which is itself built on src/lib/security.ts) and nothing else. No database
 * client and no React, so the boundary can be consulted by a server action, a
 * server component, a client onboarding form and the tests alike.
 */

import { sanitiseFeedbackMessage as sanitiseReportMessage } from "./feedback";

// ─────────────────────────────────────────────────────────────────
// AGE THRESHOLDS AND THE REPORTING ADDRESS
// ─────────────────────────────────────────────────────────────────

/** Below this, the platform is not for them at all (COPPA, and the Terms). */
export const MINIMUM_AGE = 13;

/** At this age a student may use the platform without a guardian's consent. */
export const ADULT_AGE = 18;

/**
 * Where a safety report goes. The Terms and the Privacy Policy both name
 * addresses on this domain, so the shape is not new — but unlike "legal@" and
 * "privacy@" this one has to be read, because it is the documented route for a
 * concern about a minor. It needs a real, monitored mailbox before the /safety
 * page goes live.
 */
export const SAFETY_REPORT_EMAIL = "safety@schollective.com";

/**
 * The education-level slugs that identify a student as a minor.
 *
 * Matched by prefix rather than by listing the four slugs, so a new high-school
 * variant added to the signup or profile picker is covered the day it appears
 * instead of the day someone remembers to come back here.
 */
export const PRESUMED_MINOR_EDUCATION_PREFIX = "high-school";

/**
 * Whether this education level means "treat as a minor".
 *
 * A null or unrecognised level is false — not because an adult is a safe
 * assumption, but because "we do not know" must not silently become "we blocked
 * this professor's message". Unknown levels keep working, and the safety page
 * asks students to get their level right.
 */
export function isPresumedMinorEducationLevel(level: string | null | undefined): boolean {
  const slug = typeof level === "string" ? level.trim().toLowerCase() : "";
  return slug.startsWith(PRESUMED_MINOR_EDUCATION_PREFIX);
}

/**
 * Whether a minor is on this thread, from the education levels of every student
 * on it.
 *
 * Takes the whole set rather than one level because a group thread is still one
 * conversation: a professor writing to a group of four does not get to speak
 * freely because the *lead* student happens to be 20, if a 15-year-old joined
 * the same thread. One minor is enough.
 *
 * `levels` is intentionally the caller's to gather (the thread page already has
 * them; the send action queries them), so this stays a pure function.
 */
export function threadInvolvesMinor(levels: Iterable<string | null | undefined>): boolean {
  for (const level of levels) {
    if (isPresumedMinorEducationLevel(level)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────
// AGE: THE RECORDED DATE OF BIRTH
// ─────────────────────────────────────────────────────────────────

/**
 * The oldest date of birth that can plausibly belong to a living account
 * holder, as a year. A bound rather than a validation of the truth: it exists so
 * that a mistyped year (1926, 2126) is refused at the form instead of quietly
 * making somebody 100 or minus-100.
 */
export const EARLIEST_BIRTH_YEAR = 1900;

/**
 * Reads a date of birth from a form value, or returns null.
 *
 * Only `YYYY-MM-DD` is accepted — what `<input type="date">` submits, and the
 * only form that cannot be read two ways. A localised `03/04/2010` is either
 * March or April depending on the reader, and a date of birth decides whether
 * somebody is a minor, so an ambiguous string is refused rather than guessed.
 *
 * Returns null (not a range error) for unparseable input; the caller decides
 * whether that is "not provided" or "invalid" from whether the raw value was
 * empty, which is why `ageEligibility` takes the raw string.
 */
export function parseDateOfBirth(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  // Round-trip through Date to reject 2010-02-31, which the regex accepts and
  // Postgres would reject as an invalid date at insert time.
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().slice(0, 10) !== value) return null;
  if (parsed.getUTCFullYear() < EARLIEST_BIRTH_YEAR) return null;

  return value;
}

/**
 * Whole years old on `now`, or null when the date is missing or unreadable.
 *
 * Compared on UTC calendar dates, not by milliseconds: someone born on the 1st
 * is one year older on the 1st of the following year in every timezone, and a
 * millisecond difference would put their birthday on the wrong side of the
 * threshold for part of the day.
 */
export function ageInYears(dateOfBirth: string | null | undefined, now: Date = new Date()): number | null {
  const value = parseDateOfBirth(dateOfBirth ?? null);
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  let age = now.getUTCFullYear() - year;
  const beforeBirthday =
    now.getUTCMonth() + 1 < month || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
  if (beforeBirthday) age -= 1;

  return age < 0 ? null : age;
}

export type AgeBand = "under-minimum" | "minor" | "adult" | "unknown";

/** Which side of the two thresholds this date of birth falls on. */
export function ageBandFor(dateOfBirth: string | null | undefined, now: Date = new Date()): AgeBand {
  const age = ageInYears(dateOfBirth, now);
  if (age === null) return "unknown";
  if (age < MINIMUM_AGE) return "under-minimum";
  if (age < ADULT_AGE) return "minor";
  return "adult";
}

/**
 * Whether a minor's use of the platform needs a guardian behind it.
 *
 * `unknown` is false: an account that has not given a date of birth is not
 * stopped here, because the education-level fallback still protects the threads
 * and refusing to let an un-asked student in would lock out everyone who signed
 * up before this existed. The ask is then made in `needsAgeStatement`.
 */
export function guardianConsentRequiredFor(
  dateOfBirth: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return ageBandFor(dateOfBirth, now) === "minor";
}

/**
 * Whether this account must be asked for a date of birth before it goes further.
 *
 * True for a student with no date of birth on file. False for a professor: the
 * professorship is already gated on a verified institutional address reviewed by
 * an admin, so an adult is who is being created there, and asking faculty for a
 * birth date would collect personal data to answer a question already answered.
 */
export function needsAgeStatement(input: {
  role: string | null | undefined;
  dateOfBirth: string | null | undefined;
}): boolean {
  return input.role === "student" && parseDateOfBirth(input.dateOfBirth ?? null) === null;
}

/**
 * Whether to treat this account as a minor, from everything known about it.
 *
 * The date of birth wins when it exists — including when it says "adult", which
 * is the whole point of asking: an 19-year-old who never changed the education
 * level they picked in tenth grade stops being treated as a child. The education
 * level answers only when there is no date of birth to answer with.
 */
export function resolveMinorFlag(input: {
  dateOfBirth?: string | null;
  educationLevel?: string | null;
  now?: Date;
}): boolean {
  const band = ageBandFor(input.dateOfBirth ?? null, input.now ?? new Date());
  if (band !== "unknown") return band !== "adult";
  return isPresumedMinorEducationLevel(input.educationLevel);
}

// ─────────────────────────────────────────────────────────────────
// GUARDIAN CONSENT
// ─────────────────────────────────────────────────────────────────

/**
 * The version of the consent the guardian agrees to.
 *
 * Stored with every record so that changing this text can be told apart from a
 * record made under the old text: a bump here is what makes "everyone who
 * agreed to the previous wording has to be asked again" an answerable question
 * rather than a guess. Change it whenever the statement below changes meaning.
 */
export const GUARDIAN_CONSENT_VERSION = "2026-09";

/**
 * The sentence a guardian agrees to, worded to be true of what the platform
 * does rather than aspirational. It names the things this app actually does:
 * on-platform messaging, retained threads, admin review of a report.
 */
export const GUARDIAN_CONSENT_STATEMENT =
  "I am the parent or legal guardian of this student, I know they are creating a " +
  "Schollective account, and I agree to them using it. I understand that " +
  "mentorship messages stay on the platform and are kept so that a safety " +
  "concern can be reviewed, and that I can ask what is held about my child or " +
  "ask for it to be removed at any time.";

/** The longest a guardian's name may be. A name, not a sentence. */
export const GUARDIAN_NAME_MAX = 100;

/**
 * The address text a student types, kept to the same length as an account
 * address so the two validate alike. It is stored, not delivered to: nothing in
 * the product emails the guardian yet, and pretending otherwise would be worse
 * than the gap. See the note on `guardianConsentRequiredFor`.
 */
export const GUARDIAN_EMAIL_MAX = 254;

export interface GuardianConsent {
  guardianName: string;
  guardianEmail: string;
  /** The version of the statement agreed to. */
  version: string;
}

export type GuardianConsentValidation =
  | { ok: true; value: GuardianConsent }
  | { ok: false; error: string };

/**
 * Validates a guardian consent submitted alongside a minor's date of birth.
 *
 * Deliberately strict about the email and the tick box and deliberately loose
 * about the name: this is a record that somebody said yes, and a record with
 * only an unchecked box in it is not one. It cannot verify the person is really
 * a guardian — nothing on a website can — which is why the statement is kept
 * with the record and the student is told, in the policy, what it means.
 */
export function validateGuardianConsent(raw: unknown): GuardianConsentValidation {
  const body = (raw ?? {}) as Record<string, unknown>;

  const guardianName = typeof body.guardianName === "string" ? body.guardianName.trim() : "";
  if (guardianName.length < 2) {
    return { ok: false, error: "Enter the name of your parent or guardian." };
  }

  const guardianEmail = typeof body.guardianEmail === "string" ? body.guardianEmail.trim().toLowerCase() : "";
  // The same loose shape check the signup form applies, and no more: the point
  // is to catch a blank or a typo, not to insist on any particular provider.
  if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(guardianEmail) || guardianEmail.length > GUARDIAN_EMAIL_MAX) {
    return { ok: false, error: "Enter your parent or guardian's email address." };
  }

  if (body.attested !== true) {
    return { ok: false, error: "A parent or guardian has to agree before a student under 18 can use Schollective." };
  }

  return {
    ok: true,
    value: {
      guardianName: guardianName.slice(0, GUARDIAN_NAME_MAX),
      guardianEmail,
      version: GUARDIAN_CONSENT_VERSION,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// WHERE A MENTOR CONVERSATION MAY HAPPEN
// ─────────────────────────────────────────────────────────────────

export interface MinorThreadNotice {
  /** One sentence saying why this thread is different. */
  headline: string;
  /** What the reader is expected to do about it. */
  detail: string;
}

/**
 * The notice shown inside a thread that has a minor on it, written for whoever
 * is reading it. A mentor and a student need different sentences: one is being
 * told what they may not do, the other what they may refuse.
 */
export function minorThreadNotice(role: "professor" | "student"): MinorThreadNotice {
  if (role === "professor") {
    return {
      headline: "This student is in high school, so the youth protection rules apply.",
      detail:
        "Keep the conversation here. Do not ask for a phone number, a personal email or another app, and do not ask the student to keep anything from a parent or guardian. Every message on this thread is retained so a concern can be reviewed.",
    };
  }
  return {
    headline: "You are in high school, so this thread has extra protection.",
    detail:
      "Everything stays on Schollective — nobody here should ask you for your phone number, a personal email or another app. If a mentor does, or says anything that makes you uncomfortable, tell a parent, guardian or teacher, and report it.",
  };
}

// ─────────────────────────────────────────────────────────────────
// MESSAGE RULES FOR AN ADULT ↔ MINOR THREAD
// ─────────────────────────────────────────────────────────────────

/**
 * Content that is never acceptable on a minor thread, whoever writes it.
 *
 * These are solicitation and secrecy patterns, not topic words. Biology,
 * health, law and literature all discuss sex, bodies and danger legitimately,
 * and a rule that silenced a lecture on consent would be a rule students and
 * professors would route around. What is blocked here is the *move* — asking
 * for an image, asking for secrecy, asking whether the student is alone — which
 * has no academic reading.
 */
const PROHIBITED_PATTERNS: RegExp[] = [
  /\b(?:send|share|show)\s+me\s+(?:a\s+|some\s+)?(?:pic(?:ture)?s?|photos?|selfies?|nudes?)\b/i,
  // Secrecy, phrased so that an instruction passed *on* to a parent is not read
  // as keeping something from one. "Don't tell your parents about this" is the
  // prohibited move; "don't tell your parents to skip the readings" is a normal
  // thing for a mentor to write, and the two differ only in what follows.
  /\b(?:don'?t|do not|never)\s+tell\s+(?:your\s+)?(?:parents?|mom|mum|dad|guardians?|anyone|anybody)\s+(?:about\s+(?:this|that|it|our|what)|anything)\b/i,
  /\b(?:don'?t|do not|never)\s+tell\s+(?:your\s+)?(?:parents?|mom|mum|dad|guardians?|anyone|anybody)\s*[.!?,]/i,
  /\b(?:don'?t|do not|never)\s+mention\s+this\s+to\s+(?:your\s+)?(?:parents?|mom|mum|dad|guardians?)\b/i,
  /\bkeep\s+(?:this|it|us)\s+(?:a\s+)?(?:secret|between\s+(?:us|you\s+and\s+me))\b/i,
  /\b(?:our|the)\s+little\s+secret\b/i,
  /\b(?:delete|clear|erase)\s+(?:this|these|our)\s+(?:messages?|chats?|conversation|thread)\b/i,
  // "Home alone" specifically. "Are you alone in the lab?" is a mentor checking
  // on a student mid-experiment, and blocking it would cost more than the rule
  // catches.
  /\bare\s+you\s+home\s+alone\b/i,
  /\bmeet\s+(?:me|up)?\s*(?:alone|in\s+private|without\s+telling)\b/i,
];

/**
 * Ways out of the platform.
 *
 * Each entry carries the phrase the refusal is worded around, because "your
 * message could not be sent" teaches nobody anything while "a phone number" is
 * something the sender can remove.
 *
 * Two deliberate non-matches:
 *   - **Institutional email.** `@university.edu` is excluded. It is the address
 *     this platform verified the professor against, and sharing it is normal
 *     academic practice; a personal `@gmail.com` in a minor thread is not the
 *     same act.
 *   - **Video-conferencing links.** Zoom, Meet and Teams are how research groups
 *     actually meet a student, and are not a private back channel. Only
 *     person-to-person messaging apps and telephone numbers are caught.
 */
const OFF_PLATFORM_PATTERNS: Array<{ phrase: string; pattern: RegExp }> = [
  {
    phrase: "a phone number",
    pattern: /\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/,
  },
  {
    phrase: "a personal phone number",
    pattern: /\b(?:my|the)\s+(?:cell|mobile|phone)?\s*number\s+is\b/i,
  },
  {
    phrase: "another messaging app",
    pattern:
      /\b(?:add|follow|dm|message|hit|find|reach)\s+me\s+on\s+(?:snap(?:chat)?|insta(?:gram)?|discord|whatsapp|telegram|tiktok|kik|wechat|facebook|fb)\b/i,
  },
  {
    phrase: "a handle on another app",
    pattern:
      /\b(?:my|the)\s+(?:snap(?:chat)?|insta(?:gram)?|discord|whatsapp|telegram|tiktok|kik|wechat|fb|ig|handle)\s+(?:is|name|:)|\b(?:snap(?:chat)?|insta(?:gram)?|discord|whatsapp|telegram|tiktok|kik)\s*[:@]\s*\S+/i,
  },
  {
    phrase: "contact outside Schollective",
    pattern: /\b(?:text|dm|pm|snap|whatsapp|telegram)\s+me\b/i,
  },
  {
    phrase: "contact outside Schollective",
    // "platform", "app" and the product's own name only. A bare "off site"
    // would read as an escape hatch and match "I'll be off site at the field
    // station all week".
    pattern: /\b(?:off|outside)\s+(?:of\s+)?(?:the\s+)?(?:platform|app|schollective)\b/i,
  },
  {
    phrase: "a personal email address",
    // The lookahead is what exempts academic addresses: after the `@`, a domain
    // that ends in .edu or .ac.xx never reaches the personal-provider list.
    pattern:
      /\b[\w.+-]+@(?![\w-]*\.(?:edu|ac\.[a-z]{2}))[\w-]+\.(?:com|net|org|io|co|me|app|xyz)\b/i,
  },
];

export type SafetyAction = "pass" | "block";


export interface MessageSafetyReview {
  action: SafetyAction;
  /** The sentence shown to the sender when `action` is "block". */
  reason?: string;
  /** Which rules fired, for the log — never shown to the other participant. */
  signals: string[];
}

/**
 * Reviews one message against the rules that apply because a minor is on the
 * thread.
 *
 * There is no "warn and deliver anyway" tier. A safety rule whose message is
 * stored and read by the student is not a rule, and a warning toast on the
 * sender's screen is invisible to the person the rule exists to protect. So the
 * patterns above are drawn tightly enough to block outright, and anything
 * uncertain is left to `filterMessage`, to the notice in the thread, and to a
 * human reading a report.
 *
 * An adult-only thread passes untouched: two adults arranging to talk on
 * WhatsApp is not this platform's business, and pretending otherwise would send
 * every professor's real messages into a review queue nobody reads.
 *
 * @param text          The already-sanitised message body.
 * @param senderRole    Where the message is coming from. Both directions are
 *                      checked — a student is not expected to know these rules,
 *                      and a blocked message with a reason teaches them.
 * @param involvesMinor Whether a minor is on the thread (see
 *                      `threadInvolvesMinor`).
 */
export function reviewMentorMessage(input: {
  text: string;
  senderRole: "professor" | "student" | "admin";
  involvesMinor: boolean;
}): MessageSafetyReview {
  if (!input.involvesMinor) return { action: "pass", signals: [] };

  const text = input.text ?? "";

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        action: "block",
        reason:
          "This thread includes a high-school student, and this message breaks a youth protection rule. Contact outside the platform, requests for images and requests to keep something from a parent or guardian are all prohibited. See the Youth Protection Policy at schollective.com/safety.",
        signals: ["prohibited-contact"],
      };
    }
  }

  for (const { phrase, pattern } of OFF_PLATFORM_PATTERNS) {
    if (pattern.test(text)) {
      return {
        action: "block",
        reason:
          input.senderRole === "student"
            ? `For your safety, messages with a mentor stay on Schollective — remove ${phrase} and try again. If someone asked you to move off the platform, report it: safety@schollective.com.`
            : `This thread includes a high-school student, so it stays on Schollective — remove ${phrase} and try again. Mentoring a minor off-platform is prohibited; see schollective.com/safety.`,
        signals: [phrase],
      };
    }
  }

  return { action: "pass", signals: [] };
}

// ─────────────────────────────────────────────────────────────────
// THE PUBLISHED POLICY
// ─────────────────────────────────────────────────────────────────

/**
 * The Youth Protection Policy, as published at /safety.
 *
 * The page renders these strings and nothing else, so what a mentor agrees to
 * and what the server enforces are the same document. Written in the second
 * person and naming concrete acts rather than principles, because "maintain
 * appropriate boundaries" has never told anyone what to do on a Tuesday.
 *
 * `n` is the rule's number, kept out of the title because the page sets it as a
 * numbered list (`RowList` in src/components/ui/PublicPage.tsx) and a heading
 * that already begins "3." would print the number twice.
 */
export const YOUTH_SAFETY_SECTIONS: ReadonlyArray<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "Who this covers",
    body: `Most conversations here are one professor and one student. Every student gives a date of birth when they set their account up, and that is what decides whether these rules apply; it is stored where only the student and an administrator can read it, and it is never shown on a profile. Students under ${MINIMUM_AGE} may not use Schollective at all. Students aged ${MINIMUM_AGE} to ${ADULT_AGE - 1} may use it only with the consent of a parent or guardian, which is asked for during account setup and kept on file with the guardian's name, their email address, and the wording they agreed to. A student who gave no date of birth is treated as a minor if their education level says high school, so the fallback is always the cautious one.`,
  },
  {
    n: "02",
    title: "All contact happens here",
    body: "Every message between a mentor and a student stays on Schollective, where it is retained and reviewable. Mentors may not ask a student — or agree to a student's request — to move a conversation to a phone number, a personal email address, a messaging app or a private meeting. Institutional email addresses and institutional video-conferencing links are the exception: those are how research groups legitimately work. Asking a student to delete messages, or to keep anything from a parent or guardian, is a prohibited act on its own.",
  },
  {
    n: "03",
    title: "What is never acceptable",
    body: "In any thread with a student, no one may request, send or discuss sexual content; request photographs of the student; ask whether the student is alone; propose meeting privately or without telling anyone; or offer gifts, money, travel, paid work or anything else of value in exchange for a student's time outside the programme. Academic discussion of sex, health, violence or abuse — the biology of reproduction, a literature seminar, a law problem, a research question about consent — is normal and is not restricted.",
  },
  {
    n: "04",
    title: "One student, one mentor, and the group option",
    body: "One-to-one is the most requested format and the hardest to supervise, so a thread is visible to an administrator when a safety report is made about it. Students can also invite classmates they have added as friends onto the same request, which turns a private pair into a group with a record of who joined, left or was removed. A student who would rather not be alone with a mentor should use that, or ask a parent, guardian or teacher to sit in.",
  },
  {
    n: "05",
    title: "How a concern is handled",
    // This section used to have to tell people to report before deleting
    // anything, because a deleted account cascaded the conversation away with
    // it. A report made from a thread now takes a copy of that thread's
    // messages (safety_report_evidence, db/migrations/0014), so the words
    // survive the account they are about and this can say so.
    body: `Report a concern from the thread itself — every mentorship thread has a Report a concern button — or by emailing ${SAFETY_REPORT_EMAIL}. A report is a record that outlives the account it is about, and one made from a thread also copies that thread's messages into the report, so deleting an account afterwards does not remove the evidence. An administrator reads every report and can suspend or remove an account. If a young person is in immediate danger, contact local emergency services first — this platform cannot help in an emergency.`,
  },
  {
    n: "06",
    title: "If you are a mentor",
    body: "You are the one who will be held to this. Verify nothing outside an institutional address or a departmental page; keep office hours and meetings observable (a group call, a lab forum, a shared document, a cc'd colleague); do not add a student on social media; do not travel with a student or meet them alone off campus; and end a mentorship on the platform if it ever feels boundary-adjacent rather than continuing quietly. Professors who break these rules lose their verified status and their account, and the platform will answer a school's or a parent's request for a record.",
  },
  {
    n: "07",
    title: "If you are a student",
    body: `You are allowed to decline anything: a meeting, a topic, a request for your number, a message that feels wrong. You do not have to be polite about it. Tell a parent, guardian or teacher, and report it to ${SAFETY_REPORT_EMAIL} — you will not get in trouble for reporting, even if you are not sure.`,
  },
];

// ─────────────────────────────────────────────────────────────────
// SAFETY REPORTS
// ─────────────────────────────────────────────────────────────────

/**
 * What a safety report can be about.
 *
 * Deliberately concrete and small. The reporter is often a teenager deciding
 * whether to say anything at all, and a taxonomy they have to interpret is a
 * reason to close the tab. Every one of these is a thing that either already
 * has a rule in this module ("asked me to move to WhatsApp", "said not to tell
 * my parents") or is the reason the rule exists, so the list and the rules can
 * be read side by side.
 */
export const SAFETY_CONCERN_CATEGORIES = [
  /** Asked to move the conversation off the platform, or to delete it. */
  "off-platform",
  /** Messages or requests that felt inappropriate, but are hard to name. */
  "boundaries",
  /** Sexual content, or a request for photographs. */
  "sexual-content",
  /** Harassment, threats, slurs or abuse. */
  "threats",
  /** Someone is not who their profile says they are. */
  "impersonation",
  /** Concern that a student may be in danger from themselves. */
  "self-harm",
  /** Anything that does not fit the six above. */
  "other",
] as const;

export type SafetyConcernCategory = (typeof SAFETY_CONCERN_CATEGORIES)[number];

export const SAFETY_CONCERN_LABELS: Record<SafetyConcernCategory, string> = {
  "off-platform": "Asked to talk somewhere else",
  boundaries: "Messages that felt wrong",
  "sexual-content": "Sexual messages or requests for photos",
  threats: "Threats, harassment or abuse",
  impersonation: "Someone is not who they say they are",
  "self-harm": "I am worried someone may hurt themselves",
  other: "Something else",
};

/** One line per category, so the picker explains itself without a help page. */
export const SAFETY_CONCERN_HINTS: Record<SafetyConcernCategory, string> = {
  "off-platform": "A phone number, a personal email, another app, or a request to delete messages.",
  boundaries: "Anything that made you uncomfortable, even if you cannot say exactly why.",
  "sexual-content": "Includes being asked for a picture, or whether you are alone.",
  threats: "Includes slurs, being told to harm yourself, and pressure about money or work.",
  impersonation: "A profile that does not match the person, or a claim that does not check out.",
  "self-harm": "Tell a trusted adult as well. This form is not monitored around the clock.",
  other: "Describe it in your own words. It will be read.",
};

/**
 * Categories that are put at the top of the admin queue.
 *
 * Not a judgement about which report matters — every report is read — but about
 * which ones should not wait behind a suggestion about the profile form.
 * `self-harm` is here because the first thing the reader needs to know is that a
 * human being may be in danger right now.
 */
export const URGENT_CONCERN_CATEGORIES: readonly SafetyConcernCategory[] = [
  "self-harm",
  "sexual-content",
  "threats",
];

/**
 * Where a report stands.
 *
 * `reviewing` is distinct from `new` because a queue that cannot show "someone
 * is on this" produces two people reading the same report and a third assuming
 * the other two did.
 */
export const SAFETY_REPORT_STATUSES = ["new", "reviewing", "closed"] as const;
export type SafetyReportStatus = (typeof SAFETY_REPORT_STATUSES)[number];

export const SAFETY_REPORT_STATUS_LABELS: Record<SafetyReportStatus, string> = {
  new: "Not yet read",
  reviewing: "Being handled",
  closed: "Closed",
};

/**
 * How short a report may be. Low on purpose: "he asked me for my number" is
 * twelve characters and is a complete report, and a minimum that made somebody
 * pad it would produce worse evidence, not better.
 */
export const SAFETY_REPORT_MESSAGE_MIN = 10;
export const SAFETY_REPORT_MESSAGE_MAX = 4000;
/** The most lines one report may hold, so a pasted transcript cannot run away. */
export const SAFETY_REPORT_MAX_LINES = 60;

/** How many thread messages a report copies. See `summaryOfSnapshot`. */
export const SAFETY_REPORT_SNAPSHOT_LIMIT = 200;

export function isSafetyConcernCategory(value: unknown): value is SafetyConcernCategory {
  return typeof value === "string" && (SAFETY_CONCERN_CATEGORIES as readonly string[]).includes(value);
}

export function isSafetyReportStatus(value: unknown): value is SafetyReportStatus {
  return typeof value === "string" && (SAFETY_REPORT_STATUSES as readonly string[]).includes(value);
}

export function isUrgentConcern(value: unknown): boolean {
  return isSafetyConcernCategory(value) && URGENT_CONCERN_CATEGORIES.includes(value);
}

export function safetyConcernLabel(value: unknown): string {
  return isSafetyConcernCategory(value)
    ? SAFETY_CONCERN_LABELS[value]
    : SAFETY_CONCERN_LABELS.other;
}

export function safetyReportStatusLabel(value: unknown): string {
  return isSafetyReportStatus(value)
    ? SAFETY_REPORT_STATUS_LABELS[value]
    : SAFETY_REPORT_STATUS_LABELS.new;
}

export interface SafetyReportInput {
  category: SafetyConcernCategory;
  message: string;
  /** The thread this report was made from, when it was made from one. */
  requestId: string | null;
  /** The account being reported, when the reporter named one. */
  reportedProfileId: string | null;
}

export type SafetyReportValidation =
  | { ok: true; value: SafetyReportInput }
  | { ok: false; error: string };

/**
 * Validates one submitted safety report.
 *
 * Pure, like `validateFeedbackReport`, so the route and the tests agree about
 * what a valid report is without a database in the loop. `reportedProfileId` is
 * taken as given rather than checked: whether the caller may name that account
 * is an authorisation question, and authorisation belongs where the row is
 * written with the caller's own identity (see the route).
 */
export function validateSafetyReport(raw: unknown): SafetyReportValidation {
  const body = (raw ?? {}) as Record<string, unknown>;

  if (!isSafetyConcernCategory(body.category)) {
    return { ok: false, error: "Choose what the concern is about." };
  }

  const message = sanitiseReportMessage(body.message);
  // Counted in code points, matching char_length() in the migration's CHECK.
  if ([...message].length < SAFETY_REPORT_MESSAGE_MIN) {
    return {
      ok: false,
      error: `Please describe what happened in at least ${SAFETY_REPORT_MESSAGE_MIN} characters — you can keep it short.`,
    };
  }

  const id = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

  return {
    ok: true,
    value: {
      category: body.category,
      message,
      requestId: id(body.requestId),
      reportedProfileId: id(body.reportedProfileId),
    },
  };
}

/**
 * What a report tells its author it captured.
 *
 * Stored on the report rather than recomputed, because the thread it describes
 * may not exist by the time anybody reads it — and because the first question
 * an admin asks about a copied transcript is whether it is all of it.
 */
export function summaryOfSnapshot(messageCount: number, truncated: boolean): string {
  if (messageCount === 0) return "No messages were on the thread when this was reported.";
  const noun = messageCount === 1 ? "message" : "messages";
  return truncated
    ? `${messageCount} most recent ${noun} copied; the thread had more.`
    : `${messageCount} ${noun} copied from the thread.`;
}
