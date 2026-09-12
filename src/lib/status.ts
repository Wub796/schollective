/**
 * The platform's status and role vocabularies, defined once.
 *
 * These values used to live as bare string literals across ~25 call sites, and
 * the drift that caused was not theoretical: the student thread list bucketed
 * every request that was not `closed` as "ongoing", so `declined`, `viewed` and
 * admin-`deleted` threads all appeared as live conversations the user could not
 * actually post to. A union type plus the visibility sets below make that class
 * of mistake a type error instead of a silent product bug.
 *
 * When adding a status, add it here first; every exhaustive consumer will then
 * fail to compile until it has been considered.
 */

// ─────────────────────────────────────────────────────────────────
// REQUESTS (mentorship threads)
// ─────────────────────────────────────────────────────────────────

export const REQUEST_STATUSES = [
  /** Submitted by the student, not yet seen by the professor. */
  "pending",
  /** Opened by the professor but not yet accepted or declined. */
  "viewed",
  /** Accepted — the only state in which messages may be exchanged. */
  "active",
  /** Declined by the professor. Terminal. */
  "declined",
  /** Closed by either participant. Terminal. */
  "closed",
  /** Soft-deleted by an admin. Terminal, and hidden from participants. */
  "deleted",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && (REQUEST_STATUSES as readonly string[]).includes(value);
}

/**
 * The only state that accepts new messages. Both the send action and the
 * composer UI gate on this.
 */
export const MESSAGEABLE_STATUS: RequestStatus = "active";

/**
 * States a professor may still act on from their queue.
 */
export const AWAITING_PROFESSOR: readonly RequestStatus[] = ["pending", "viewed"];

/**
 * States a professor may legally transition a request *into*, and the states it
 * must be in for that to be allowed. A request that has already been declined,
 * closed or deleted is terminal — without this, a professor could flip a closed
 * thread back to active and re-fire the acceptance notification.
 */
export const PROFESSOR_DECIDABLE_FROM: readonly RequestStatus[] = ["pending", "viewed"];

/**
 * Terminal states: nothing may transition out of these.
 */
export const TERMINAL_STATUSES: readonly RequestStatus[] = ["declined", "closed", "deleted"];

/**
 * Threads a participant should see at all. `deleted` is excluded so an admin
 * soft-delete actually removes the thread from both participants' views, and
 * `declined` is excluded from the live list (it is surfaced under "past"
 * instead) so a rejection does not masquerade as an open conversation.
 */
export const PARTICIPANT_VISIBLE: readonly RequestStatus[] = [
  "pending",
  "viewed",
  "active",
  "declined",
  "closed",
];

/** Of the visible ones, those that represent a live conversation. */
export const PARTICIPANT_ONGOING: readonly RequestStatus[] = ["pending", "viewed", "active"];

/** Of the visible ones, those that are over. */
export const PARTICIPANT_PAST: readonly RequestStatus[] = ["declined", "closed"];

/**
 * The professor's student roster: people they actually mentor or have mentored.
 * `declined` is excluded — a rejection is not a mentorship — and so is
 * `deleted`.
 */
export const PROFESSOR_ROSTER: readonly RequestStatus[] = ["active", "closed"];

/**
 * Threads that should contribute to an unread badge. A thread the user can no
 * longer reply to must not produce a badge they can never clear.
 */
export const UNREAD_COUNTABLE: readonly RequestStatus[] = ["active"];

// ─────────────────────────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────────────────────────

export const USER_ROLES = ["student", "professor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export const PROFILE_STATUSES = [
  /** Normal student account. */
  "active",
  /** Professor awaiting manual credential review. */
  "pending",
  /** Professor whose credentials were verified — required to appear publicly. */
  "approved",
  /** Professor application rejected. */
  "rejected",
  /** Account retains its session but loses product access. */
  "suspended",
] as const;

export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

export function isProfileStatus(value: unknown): value is ProfileStatus {
  return typeof value === "string" && (PROFILE_STATUSES as readonly string[]).includes(value);
}

/**
 * The status a professor must hold to be listed publicly, receive requests, or
 * reach their dashboard. Anything else routes them to /prof/pending.
 */
export const PROFESSOR_LIVE_STATUS: ProfileStatus = "approved";

/**
 * The default status for a newly assigned role. A professor always re-enters
 * review; nobody is ever silently promoted into a live faculty listing.
 */
export function defaultStatusForRole(role: UserRole): ProfileStatus {
  return role === "professor" ? "pending" : "active";
}

/**
 * Turns a readonly status list into the array form the Neon driver binds as a
 * single `= ANY($1)` parameter, so call sites never interpolate SQL.
 */
export function asSqlArray(statuses: readonly string[]): string[] {
  return [...statuses];
}
