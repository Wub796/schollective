/**
 * How a notification dresses itself, and how the island addresses the person
 * reading it.
 *
 * A web port of the Dynamic Island surface in `expo-dynamic-notifications`, so
 * the vocabulary follows that library's: every notification carries an eyebrow,
 * a glyph, an accent and a lifetime. All of it is decided *here* rather than in
 * the component, for two reasons:
 *
 *   - One table is the single source of truth, so the chip, the card it grows
 *     into and the list behind it cannot disagree about what a
 *     "request_declined" looks like, or how long it holds the screen.
 *   - `NOTIFICATION_STYLES` is typed as `Record<NotificationType, …>`, and
 *     `NotificationType` is the union the write path inserts. Adding a type in
 *     `src/lib/notifications.ts` therefore fails `tsc` until it has a face here
 *     — the vocabulary cannot drift the way the profile DDL once did.
 *
 * Client-safe: the type import is erased at build time, so no database module
 * reaches the browser bundle.
 */

import type { NotificationType } from "./notifications";
import { safeInternalPath } from "./safe-redirect";

/** Who is reading. Only the three roles the app has; anything else reads as a student. */
export type NotificationRole = "student" | "professor" | "admin";

/** The mark a notification is drawn with. The component maps these onto icons. */
export type NotificationGlyph =
  | "check"
  | "cross"
  | "inbox"
  | "chat"
  | "shield"
  | "user-plus"
  | "user-check"
  | "users"
  | "user-minus"
  | "user-x";

export interface NotificationStyle {
  /** The small line above the title: what kind of thing this is. */
  eyebrow: string;
  /** Tint for the pill, the droplet and the icon chip. Always a palette token. */
  accent: string;
  /** The same hue, dark enough to carry text or an icon on a light card. */
  ink: string;
  glyph: NotificationGlyph;
  /** The verb on the action chip. */
  cta: string;
  /**
   * Whether this asks something of the reader. A request to answer waits until
   * they answer it; news about something already done announces itself and
   * leaves.
   */
  sticky: boolean;
  /** How long the card holds the screen before it leaves, or null when sticky. */
  holdMs: number | null;
  /**
   * The second line used when the stored message only repeats the title, which
   * is every type written without a body — `createNotification` stores
   * `body || title` in that column. `{name}` is replaced with the reader's own
   * given name (see `address`). Empty when there is nothing to add.
   */
  aside: string;
}

/** Six seconds: long enough to read two lines, short enough not to be in the way. */
const ANNOUNCE_MS = 6000;

/**
 * The palette carries exactly one warm hue, and it is already spoken for: the
 * unread badge. "Needs action" is that same idea, so it is that same colour
 * rather than a second orange invented here.
 */
const ATTENTION = "var(--color-attention)";
const ATTENTION_INK = "var(--color-attention-ink)";
const ACCENT = "var(--color-accent)";
const ACCENT_ALT = "var(--color-accent-alt)";
const NEUTRAL_INK = "var(--color-ink-mute)";

/*
 * Why `accent` and `ink` are separate fields, in one line each:
 *
 *   accent  gets filled at 12–14% behind a glyph, a disc or a chip. Any of the
 *           five hues is legible in that role.
 *   ink     carries the words. #f97316 is 3.6:1 on white and #6366f1 is 4.47:1 —
 *           both under the 4.5:1 small text needs, which is why the two lighter
 *           hues hand their text over to their darker twin (#c2410c → 5.2:1, and
 *           the deeper indigo → 7.3:1). Measured, not guessed.
 */

export const NOTIFICATION_STYLES: Record<NotificationType, NotificationStyle> = {
  request_accepted: {
    eyebrow: "Request accepted",
    accent: ACCENT,
    ink: ACCENT,
    glyph: "check",
    cta: "Open thread",
    sticky: false,
    holdMs: ANNOUNCE_MS,
    aside: "{name}, your thread is open — say hello.",
  },
  request_declined: {
    eyebrow: "Request declined",
    accent: NEUTRAL_INK,
    ink: NEUTRAL_INK,
    glyph: "cross",
    cta: "See other faculty",
    // A decline is news, not an alarm: it says its piece and goes, in grey.
    sticky: false,
    holdMs: 8000,
    aside: "Nothing further is needed from you.",
  },
  new_request: {
    eyebrow: "New mentorship request",
    accent: ATTENTION,
    ink: ATTENTION_INK,
    glyph: "inbox",
    cta: "Review request",
    // Waiting on the reader's decision, so it does not time out.
    sticky: true,
    holdMs: null,
    aside: "{name}, review it before it cools off.",
  },
  message: {
    eyebrow: "New message",
    accent: ACCENT_ALT,
    ink: ACCENT,
    glyph: "chat",
    cta: "Open conversation",
    sticky: false,
    holdMs: ANNOUNCE_MS,
    aside: "",
  },
  admin_warning: {
    eyebrow: "From the Schollective team",
    accent: ATTENTION,
    ink: ATTENTION_INK,
    glyph: "shield",
    cta: "Read the notice",
    // A moderation notice must not be missable, and must not auto-dismiss.
    sticky: true,
    holdMs: null,
    aside: "{name}, this notice was sent to your account.",
  },
  friend_request: {
    eyebrow: "Friend request",
    accent: ACCENT,
    ink: ACCENT,
    glyph: "user-plus",
    cta: "See request",
    sticky: true,
    holdMs: null,
    aside: "{name}, open Friends to accept or decline.",
  },
  friend_accepted: {
    eyebrow: "Friend accepted",
    accent: ACCENT,
    ink: ACCENT,
    glyph: "user-check",
    cta: "View profile",
    sticky: false,
    holdMs: ANNOUNCE_MS,
    aside: "You can start a thread together now.",
  },
  group_invite: {
    eyebrow: "Group invitation",
    accent: ACCENT_ALT,
    ink: ACCENT,
    glyph: "users",
    cta: "View invite",
    sticky: true,
    holdMs: null,
    aside: "{name}, join to read the thread with the group.",
  },
  group_member_joined: {
    eyebrow: "Group activity",
    accent: ACCENT_ALT,
    ink: ACCENT,
    glyph: "user-plus",
    cta: "Open thread",
    sticky: false,
    holdMs: ANNOUNCE_MS,
    aside: "The group is one bigger.",
  },
  group_member_left: {
    eyebrow: "Group activity",
    accent: NEUTRAL_INK,
    ink: NEUTRAL_INK,
    glyph: "user-minus",
    cta: "Open thread",
    sticky: false,
    holdMs: ANNOUNCE_MS,
    aside: "They are no longer on this thread.",
  },
  group_member_removed: {
    eyebrow: "Group activity",
    accent: NEUTRAL_INK,
    ink: NEUTRAL_INK,
    glyph: "user-x",
    cta: "Open thread",
    sticky: false,
    holdMs: ANNOUNCE_MS,
    aside: "{name}, your access to this thread has changed.",
  },
};

/**
 * The same notification reads differently to different readers. Kept beside the
 * table so a role-specific wording is one line, and only where the roles really
 * do differ — a professor's "new request" is work waiting for them, while an
 * admin's is a filing they can inspect.
 */
const BY_ROLE: Partial<Record<NotificationType, Partial<Record<NotificationRole, Partial<NotificationStyle>>>>> = {
  new_request: {
    professor: { eyebrow: "Student request", cta: "Review request" },
    admin: { eyebrow: "Request filed", cta: "View request" },
  },
  message: {
    professor: { cta: "Open conversation" },
    admin: { cta: "Read message" },
  },
};

/**
 * Shown for a type this build does not know — a row written by a newer deploy,
 * or a value that arrived from somewhere it should not have. It has to be
 * *something*: a notification the reader cannot see is worse than a plain one.
 */
const FALLBACK_STYLE: NotificationStyle = {
  eyebrow: "Notification",
  accent: ACCENT_ALT,
  ink: ACCENT,
  glyph: "inbox",
  cta: "Open",
  sticky: false,
  holdMs: ANNOUNCE_MS,
  aside: "",
};

/**
 * A read from a lookup table that cannot walk the prototype chain: these tables
 * are indexed by strings that arrive from the database or a request body, and
 * `table["constructor"]` answers with a function where a style is expected.
 */
function entry<T>(table: Record<string, T>, key: unknown): T | undefined {
  if (typeof key !== "string") return undefined;
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

/** A role as the app stores it, with anything unrecognised read as a student. */
export function notificationRole(value: unknown): NotificationRole {
  return value === "professor" || value === "admin" ? value : "student";
}

/** Where a role's notifications live when the row carries no link of its own. */
export function roleHome(role: unknown): string {
  switch (notificationRole(role)) {
    case "professor":
      return "/prof/dashboard";
    case "admin":
      return "/admin/dashboard";
    default:
      return "/dashboard";
  }
}

/** The finished style for a type as read by a role. */
export function notificationStyle(type: unknown, role: unknown = "student"): NotificationStyle {
  const base = entry(NOTIFICATION_STYLES, type) ?? FALLBACK_STYLE;
  const override = entry(BY_ROLE, type)?.[notificationRole(role)];
  return override ? { ...base, ...override } : base;
}

/**
 * A destination a caller supplied, or the one the type would have chosen.
 *
 * Only a site-relative path is honoured: a notification can be triggered from
 * any component in the tree, and `Link` follows an absolute URL happily — the
 * island must not become the one place in the app that navigates off-site.
 */
export function safeIslandHref(value: unknown, fallback: string): string {
  return safeInternalPath(value) ?? fallback;
}

/** What the island needs to know about a stored notification row. */
export interface NotificationLike {
  id?: string | null;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  /** A complete app path, or null. Never a bare id — see the API route. */
  link?: string | null;
  is_read?: boolean | null;
}

/**
 * Where a notification takes the reader.
 *
 * A `new_request` is deliberately the one exception to the row's own link: it
 * points at the thread, but the accept/decline actions live in the professor's
 * queue, and the stored link is the thread the request would open *if* it were
 * accepted. Sending a professor to an empty thread to make their decision is a
 * bug this product has already fixed once, in the notification list that came
 * before this one; the rule lives here now so both surfaces share it.
 */
export function notificationHref(notification: NotificationLike, role: unknown): string {
  const home = roleHome(role);
  if (notification.type === "new_request" && notificationRole(role) === "professor") {
    return "/prof/pending";
  }
  // `admin_warning` carries no link on purpose: it is about the account, not
  // about a thread, so it opens the reader's own home rather than a conversation.
  if (notification.type === "admin_warning") return home;
  return safeInternalPath(notification.link) ?? home;
}

/**
 * How long ago something happened, in the words the app already uses.
 *
 * A notification list is read for recency, not for timestamps: "4m ago" answers
 * the question the reader has, and a date only takes over once the difference is
 * too coarse to be useful. The client renders it, so nothing here has to survive
 * server/client hydration agreeing on a clock.
 */
export function timeAgo(iso: unknown, now: number = Date.now()): string {
  const at = typeof iso === "string" ? Date.parse(iso) : NaN;
  if (!Number.isFinite(at)) return "";

  // A clock that ran backwards (a row written a second into the future) reads as
  // "just now" rather than as a negative age.
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Whitespace collapsed, cut at a word boundary, so one line stays one line. */
export function oneLine(value: unknown, limit: number): string {
  const flat = String(value ?? "").replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * The two lines a notification actually has to say, with the duplicate removed.
 *
 * `createNotification` stores `body || title` in the message column, so the
 * eight types written without a body deliver the same sentence twice. The card
 * has room for one line of each, and printing it twice reads as a bug — because
 * it is one.
 */
export function notificationLines(notification: NotificationLike): { title: string; message: string } {
  const rawTitle = String(notification.title ?? "").replace(/\s+/g, " ").trim();
  const rawBody = String(notification.body ?? "").replace(/\s+/g, " ").trim();
  return {
    title: oneLine(rawTitle, 90) || "New notification",
    message: rawBody && rawBody !== rawTitle ? oneLine(rawBody, 140) : "",
  };
}

/**
 * Fills an `aside` with the reader's own name.
 *
 * With no name on file the sentence loses the greeting with it and is made to
 * start cleanly, rather than reading "Student, open Friends…" — or, worse,
 * ", open Friends…".
 */
function address(text: string, name: string | null): string {
  const given = (name ?? "").trim();
  if (given) return text.replace(/\{name\}/g, given);
  const withoutName = text.replace(/\{name\}(?:,\s*)?/g, "");
  return withoutName.charAt(0).toUpperCase() + withoutName.slice(1);
}

/** The reader: the island belongs to them, so it wears their face. */
export interface IslandViewer {
  /** The name they go by, e.g. "Ada". Used to address them, never to identify the actor. */
  name: string | null;
  /** Two letters, or "?", drawn when there is no photo. */
  initials: string | null;
  avatarUrl: string | null;
  role: NotificationRole;
}

export const ANONYMOUS_VIEWER: IslandViewer = {
  name: null,
  initials: null,
  avatarUrl: null,
  role: "student",
};

/** Everything the island needs to draw one notification. Nothing else. */
export interface IslandContent {
  id: string;
  eyebrow: string;
  title: string;
  message: string;
  accent: string;
  ink: string;
  glyph: NotificationGlyph;
  cta: string;
  href: string;
  durationMs: number | null;
  avatarUrl: string | null;
  initials: string;
}

/**
 * A stored notification as the island shows it to one reader: the type's face,
 * the reader's own identity, and the wording resolved for their role.
 *
 * The stored row carries no actor, so the island cannot show the face of the
 * person who acted. It shows the reader's instead, which is honest and, in the
 * end, the more personal of the two: the pill is *yours*, and the glyph says
 * what happened.
 */
export function personaliseNotification(
  notification: NotificationLike,
  viewer: IslandViewer = ANONYMOUS_VIEWER,
): IslandContent {
  const style = notificationStyle(notification.type, viewer.role);
  const { title, message } = notificationLines(notification);

  return {
    id: String(notification.id ?? `${notification.type ?? "notification"}:${title}`),
    eyebrow: style.eyebrow,
    title,
    message: message || address(style.aside, viewer.name),
    accent: style.accent,
    ink: style.ink,
    glyph: style.glyph,
    cta: style.cta,
    href: notificationHref(notification, viewer.role),
    durationMs: style.sticky ? null : style.holdMs,
    avatarUrl: viewer.avatarUrl,
    initials: viewer.initials || "?",
  };
}
