/**
 * The vocabulary and validation for a beta feedback report.
 *
 * One module, read by three places that must agree: the API route that stores a
 * report, the settings form that collects it, and the admin queue that reads it.
 * A category the form can produce and the database CHECK would reject is a
 * runtime-only failure (`23514`), which is exactly the kind of drift keeping the
 * list in one typed place prevents — `tests/feedback.test.mjs` also reads the
 * CHECK constraint back out of the migration and compares it to these arrays.
 *
 * A note on the words: the categories are deliberately few and non-technical.
 * "Bug / suggestion / something else" is a question anyone can answer without
 * deciding whether their problem is a defect or a design opinion — the admin
 * reading the queue can reclassify it, the reporter cannot un-send it.
 */

import { sanitiseText } from "@/lib/security";

/** What kind of report this is. Stored verbatim; the CHECK in 0013 mirrors it. */
export const FEEDBACK_CATEGORIES = ["bug", "idea", "other"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug or error",
  idea: "Suggestion",
  other: "Something else",
};

/** One line of copy per category, so the picker explains itself. */
export const FEEDBACK_CATEGORY_HINTS: Record<FeedbackCategory, string> = {
  bug: "Something broke, looked wrong or did not do what it said.",
  idea: "A feature, a change, or anything that would make this more useful.",
  other: "Anything that does not fit the two above.",
};

/**
 * Where a report stands. `new` is the only state the reporter ever sees as
 * "unhandled"; `reviewed` means a person read it, and `closed` means there is
 * nothing left to do (fixed, answered, or deliberately declined).
 */
export const FEEDBACK_STATUSES = ["new", "reviewed", "closed"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "Received",
  reviewed: "Reviewed",
  closed: "Closed",
};

/** Short enough to be a button, long enough to say what it is. */
export const FEEDBACK_MESSAGE_MIN = 10;
export const FEEDBACK_MESSAGE_MAX = 2000;
export const FEEDBACK_SUBJECT_MAX = 120;
/** A path, not a URL: `/professors/abc123?tab=about` fits with room to spare. */
export const FEEDBACK_PAGE_MAX = 300;
/** The most lines one report may hold, so a pasted log cannot run away. */
export const FEEDBACK_MAX_LINES = 40;

export function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return typeof value === "string" && (FEEDBACK_CATEGORIES as readonly string[]).includes(value);
}

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === "string" && (FEEDBACK_STATUSES as readonly string[]).includes(value);
}

export function feedbackCategoryLabel(value: unknown): string {
  return isFeedbackCategory(value) ? FEEDBACK_CATEGORY_LABELS[value] : FEEDBACK_CATEGORY_LABELS.other;
}

export function feedbackStatusLabel(value: unknown): string {
  return isFeedbackStatus(value) ? FEEDBACK_STATUS_LABELS[value] : FEEDBACK_STATUS_LABELS.new;
}

/**
 * Keeps the newlines `sanitiseText` would flatten.
 *
 * The shared sanitiser strips control characters, which includes `\n`, so a
 * report typed as paragraphs arrives as one long line. Splitting first and
 * sanitising each line keeps it as the reporter laid it out while every line
 * still goes through the same tag and control-character stripping.
 */
export function sanitiseFeedbackMessage(input: unknown): string {
  if (typeof input !== "string") return "";

  const lines = input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .slice(0, FEEDBACK_MAX_LINES)
    .map((line) => sanitiseText(line, FEEDBACK_MESSAGE_MAX));

  // Collapse runs of blank lines, so a paste with triple spacing does not turn
  // into a wall of whitespace in the admin queue.
  const collapsed: string[] = [];
  for (const line of lines) {
    if (!line && collapsed[collapsed.length - 1] === "") continue;
    collapsed.push(line);
  }

  const joined = dropLoneSurrogates(collapsed.join("\n").trim());
  return truncateCodePoints(joined, FEEDBACK_MESSAGE_MAX);
}

/**
 * Removes half of a surrogate pair.
 *
 * `sanitiseText` caps a line by slicing UTF-16 units, which can cut an emoji in
 * half and leave a lone surrogate. A lone surrogate is not a character in any
 * encoding: `TextEncoder` turns it into U+FFFD, and Postgres either does the
 * same or refuses the value outright ("unsupported Unicode escape sequence").
 * Either way the message the admin reads is not the message that was sent, and
 * the failure is invisible from the form. Dropping the orphan costs half an
 * emoji and keeps what is stored equal to what was written.
 *
 * Hand-rolled rather than a regex: the obvious pattern needs a lookbehind, and
 * this module is imported by the settings form as well as by the server.
 */
function dropLoneSurrogates(value: string): string {
  let clean = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        clean += value[i] + value[i + 1]; // a real pair
        i++;
      }
      continue; // a high surrogate with nothing after it
    }

    if (code >= 0xdc00 && code <= 0xdfff) continue; // an orphaned low surrogate
    clean += value[i];
  }
  return clean;
}

/**
 * Truncates by code point rather than by UTF-16 unit.
 *
 * `String.prototype.slice` counts units, so it can cut a pair in half for the
 * same reason as above, and the cap would then mean "2000" in one place and
 * "1000" in another. Code points are what `char_length()` in the CHECK counts,
 * so the two agree about what 2000 characters are.
 */
function truncateCodePoints(value: string, max: number): string {
  return [...value].slice(0, max).join("");
}

/**
 * The in-app page a report was sent from.
 *
 * Only a site-relative path is accepted: an absolute URL would put another
 * origin into the admin queue (and, worse, invite someone to trust it), and a
 * protocol-relative `//evil.test` looks like a path until it is rendered.
 * Anything else is stored as an empty string, which the queue shows as "not
 * recorded" rather than as a guess.
 */
export function sanitiseFeedbackPage(input: unknown): string {
  const cleaned = sanitiseText(input, FEEDBACK_PAGE_MAX);
  if (!cleaned.startsWith("/") || cleaned.startsWith("//")) return "";
  return /^\/[^\s]*$/.test(cleaned) ? cleaned : "";
}

export interface FeedbackReportInput {
  category: FeedbackCategory;
  subject: string;
  message: string;
  page: string;
}

export type FeedbackValidation =
  | { ok: true; value: FeedbackReportInput }
  | { ok: false; error: string };

/**
 * Validates and cleanses one submitted report.
 *
 * Pure on purpose: the route calls it, the tests call it, and neither needs a
 * database to find out what happens to a two-character message or a category
 * nobody defined.
 */
export function validateFeedbackReport(raw: unknown): FeedbackValidation {
  const body = (raw ?? {}) as Record<string, unknown>;

  if (!isFeedbackCategory(body.category)) {
    return { ok: false, error: "Choose whether this is a bug, a suggestion or something else." };
  }

  const message = sanitiseFeedbackMessage(body.message);
  // Counted in code points, matching char_length() in the migration's CHECK: a
  // message of ten emoji is ten characters there, but twenty `length` here, and
  // the difference would surface as a 500 from the database instead of the
  // validation message below.
  if ([...message].length < FEEDBACK_MESSAGE_MIN) {
    return {
      ok: false,
      error: `Please describe it in at least ${FEEDBACK_MESSAGE_MIN} characters.`,
    };
  }

  return {
    ok: true,
    value: {
      category: body.category,
      subject: sanitiseText(body.subject, FEEDBACK_SUBJECT_MAX),
      message,
      page: sanitiseFeedbackPage(body.page),
    },
  };
}
