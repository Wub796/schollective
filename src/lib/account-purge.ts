/**
 * The sweep behind the 30 day promise made when an account is disabled.
 *
 * The deletion itself lives in `public.purge_expired_deactivated_accounts`
 * (db/migrations/0016), not here. Every table is owned by the least-privilege
 * app role and `profiles` carries FORCE ROW LEVEL SECURITY, so a delete issued
 * from this layer with no `app.user_id` matches zero rows and reports success.
 * The function runs as a BYPASSRLS owner instead, which is also why no request
 * surface can reach the deletion.
 *
 * This module owns only the two numbers: how long the window is, and how much
 * one run may remove.
 */

import { sql } from "./neon/db";
import { DEACTIVATION_GRACE_DAYS } from "./account-deletion";

export interface PurgedAccount {
  account_id: string;
  was_deleted: boolean;
  detail: string | null;
}

export interface PurgeRun {
  /** Accounts whose window had closed and this run attempted to remove. */
  examined: number;
  removed: number;
  /** Accounts the database declined to remove, with its reason. Never ignored. */
  refused: PurgedAccount[];
}

/**
 * How many accounts one run may remove. A bound rather than a target: the
 * function takes the oldest deadlines first, so a capped run still makes
 * progress and the next one continues where it stopped.
 */
export const PURGE_BATCH_LIMIT = 25;

/**
 * Removes the accounts whose grace window closed. Idempotent: an account this
 * already deleted is no longer a candidate, so running twice removes nothing
 * the second time.
 */
export async function purgeExpiredDeactivatedAccounts(
  limit: number = PURGE_BATCH_LIMIT,
): Promise<PurgeRun> {
  const rows = (await sql`
    SELECT account_id, was_deleted, detail
    FROM public.purge_expired_deactivated_accounts(${DEACTIVATION_GRACE_DAYS}, ${limit});
  `) as PurgedAccount[];

  const refused = rows.filter((row) => !row.was_deleted);
  return { examined: rows.length, removed: rows.length - refused.length, refused };
}
