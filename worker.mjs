/**
 * The Worker entry. Wraps the OpenNext-generated handler to add the one thing
 * Next.js cannot express: a Cron Trigger.
 *
 * `opennextjs-cloudflare build` writes `.open-next/worker.js` with a `fetch`
 * export only, so the scheduled handler has to live in a wrapper that wrangler
 * bundles instead, and `wrangler.jsonc` points `main` here.
 *
 * WHY THIS FILE IS `.mjs`
 * It imports a build artifact. A fresh clone has no `.open-next/worker.js` until
 * the build has run, and `tsc` runs before the build in CI, so a TypeScript file
 * importing it would fail the typecheck on every clean checkout. `.mjs` is
 * outside tsconfig's include, so the import is bundled by wrangler and never
 * typechecked.
 */

import openNextWorker from "./.open-next/worker.js";
import { purgeExpiredDeactivatedAccounts } from "./src/lib/account-purge";

// The generated entry's named exports are the Durable Object classes the
// caching and queue bindings need. They have to survive this wrapper.
export * from "./.open-next/worker.js";

const worker = {
  ...openNextWorker,

  /**
   * Removes the accounts whose 30 day grace window closed.
   *
   * The disable email and the countdown on `/deactivated` have both promised
   * this since 0010, and nothing performed it: the deadline was computed and
   * displayed, and no code ever acted on it. Bounded and idempotent, so a
   * retried cron event removes nothing twice.
   */
  async scheduled(event) {
    try {
      const run = await purgeExpiredDeactivatedAccounts();

      console.log(
        `[purge] ${event.cron}: examined ${run.examined}, removed ${run.removed}, ` +
          `refused ${run.refused.length}`,
      );

      // A refusal is a database that would not delete a row the promise says is
      // gone. Reported loudly because every other signal here is a success.
      if (run.refused.length > 0) {
        console.error(
          "[purge] the database refused to remove accounts whose window had closed:",
          JSON.stringify(run.refused),
        );
      }
    } catch (err) {
      // Thrown so the cron event is recorded as failed and Cloudflare retries,
      // rather than a silent run that looked healthy and removed nothing.
      console.error("[purge] sweep failed:", err instanceof Error ? err.message : err);
      throw err;
    }
  },
};

export default worker;
