import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request database identity for row-level security.
 *
 * Every query the app runs is executed by one shared Postgres role, so the
 * database itself cannot otherwise tell two users' queries apart. Protected
 * entry points (routes, server actions, pages) wrap their queries in `runAs`
 * with the signed-in user's id, and the RLS policies in
 * db/migrations/0004_rls_activate.sql scope rows by the `app.user_id` setting
 * the sql wrapper then attaches to every query (see src/lib/neon/db.ts).
 *
 * AsyncLocalStorage.run() is used deliberately: workerd (Cloudflare Workers)
 * does not implement enterWith(), so ambient "set once per request" context
 * is unavailable there — the identity must be applied explicitly at each
 * entry point. Queries executed with no context see only the rows the
 * policies declare public.
 */
const storage = new AsyncLocalStorage<{ userId?: string }>();

/**
 * The return is deliberately `Promise<any>`: wrapping an action's body in
 * runAs changes how TypeScript infers its multi-shape return union (the
 * per-statement `error?: undefined` normalisation does not survive generic
 * inference), which would ripple `res.error`-style narrowing errors through
 * every client component. The wrapped code keeps its own internal checks;
 * only the call-site result type widens here.
 */
export function runAs<T>(userId: string | null | undefined, fn: () => T | Promise<T>): Promise<any> {
  if (!userId) return Promise.resolve(fn());
  return storage.run({ userId }, async () => fn());
}

/** The current request's user id, or null when the caller is unauthenticated. */
export function getDbUserContext(): string | null {
  return storage.getStore()?.userId ?? null;
}
