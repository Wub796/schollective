/**
 * Self-service account deletion: the grace window, the confirmations, and the
 * state both are built on.
 *
 * Deliberately dependency-free — it imports nothing but the status vocabulary —
 * so tests can exercise the real values (tests/account-deletion.test.mjs) and
 * the API routes, the restore page and the Settings panel all read the SAME
 * rules instead of restating them. The two things this module exists to keep
 * true:
 *
 *   1. Disabling an account is reversible for a bounded, published period, and
 *      the deadline is derived from one constant rather than recomputed in
 *      three places with three different answers.
 *   2. Permanently deleting an account cannot happen by accident. Deletion
 *      cascades: requests, messages and notifications are declared ON DELETE
 *      CASCADE against `profiles`, so a delete takes the other participant's
 *      copy of the conversation with it. That is a deliberate, explained
 *      outcome, and the phrase below is the friction that stands in front of it.
 */
import { isProfileStatus, type ProfileStatus } from "./status";

/**
 * How long a disabled account can be brought back before the data goes.
 *
 * This is a promise made to the user in the email and on the restore page, so
 * it lives in one place. Changing it changes every message that quotes it.
 */
export const DEACTIVATION_GRACE_DAYS = 30;

/** The status a profile holds while it is disabled by its owner. */
export const DEACTIVATED_STATUS = "deactivated" satisfies ProfileStatus;

/** Where a disabled account lands, and what the restore email links to. */
export const RESTORE_PATH = "/deactivated";

/**
 * Confirmation phrases. Matching is exact (after trimming whitespace), on
 * purpose: the value of a typed confirmation is the moment of hesitation it
 * creates, and a case-insensitive "ok" would remove it.
 */
export const DISABLE_CONFIRMATION_PHRASE = "DISABLE";
export const DELETE_CONFIRMATION_PHRASE = "DELETE";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The subset of a profile row these rules need, so nothing imports the DB layer. */
export interface DeactivatableProfile {
  status?: string | null;
  deactivated_at?: string | Date | null;
  status_before_deactivation?: string | null;
}

/** True when this account has been disabled by its owner. */
export function isDeactivated(profile: Pick<DeactivatableProfile, "status"> | null | undefined): boolean {
  return profile?.status === DEACTIVATED_STATUS;
}

/** True when `input` matches `expected`, ignoring only surrounding whitespace. */
export function confirmationMatches(input: unknown, expected: string): boolean {
  return typeof input === "string" && input.trim() === expected;
}

/**
 * When a disabled account's data is due to be removed, or null when the account
 * is not disabled (or was disabled before the timestamp was recorded).
 *
 * Derived from `deactivated_at` rather than stored: a stored deadline is a
 * second source of truth that a failed write can leave disagreeing with the
 * first, and the only thing it would buy is the ability to change the grace
 * period without it applying to accounts already disabled.
 */
export function purgeAfter(deactivatedAt: string | Date | null | undefined): Date | null {
  if (!deactivatedAt) return null;
  const start = deactivatedAt instanceof Date ? deactivatedAt : new Date(deactivatedAt);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + DEACTIVATION_GRACE_DAYS * MS_PER_DAY);
}

/**
 * Whole days left before the data is removed, floored at 0, or null when there
 * is no deadline to report. Rounds up, so "1 day left" is never shown as 0 while
 * anything remains of the window.
 */
export function daysUntilPurge(
  profile: DeactivatableProfile | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!isDeactivated(profile)) return null;
  const deadline = purgeAfter(profile?.deactivated_at);
  if (!deadline) return null;
  return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY));
}

/** True when the grace window has closed and a sweep should remove the account. */
export function isPastGraceWindow(
  profile: DeactivatableProfile | null | undefined,
  now: Date = new Date(),
): boolean {
  const days = daysUntilPurge(profile, now);
  return days !== null && days === 0;
}

/**
 * The status a disabled account returns to when it is restored.
 *
 * Normally the status it held when it was disabled — a professor who was
 * `approved` comes back approved, rather than being dropped into the review
 * queue for a decision they already passed. `status_before_deactivation` is
 * written by the database, never by the client, and the trigger in
 * db/migrations/0010 refuses to let anyone claim a status they never held, so
 * this cannot be used to self-approve.
 *
 * Anything unexpected — no recorded status, an unknown value, or the disabled
 * status itself — falls back to `active`, which is the ordinary student state
 * and never a privilege.
 */
export function profileStatusOnRestore(
  profile: DeactivatableProfile | null | undefined,
): ProfileStatus {
  const previous = profile?.status_before_deactivation;
  if (isProfileStatus(previous) && previous !== DEACTIVATED_STATUS) return previous;
  return "active";
}
