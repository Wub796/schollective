/**
 * Which routes require a session.
 *
 * Deliberately a standalone module with NO imports — not even `next/server` — so
 * it can be unit-tested against the real route tree (tests/middleware-routes.test.mjs).
 * The classification used to be a chain of `||` conditions inside the middleware,
 * where nothing compared it to `src/app`: adding a protected page and forgetting
 * to extend the condition produced a route that served its shell to anyone, with
 * no test and no type error to catch it.
 *
 * This is the cheap first gate only. Every page and every server action re-checks
 * authorization server-side (src/lib/authz.ts); a cookie's presence is not proof
 * of anything, since the middleware does not verify the session, only that a
 * cookie is there.
 */

/** Paths that must match completely. */
export const PROTECTED_EXACT = [
  "/dashboard",
  "/onboarding",
  "/professors",
  "/prof",
] as const;

/** Paths whose whole subtree is protected. */
export const PROTECTED_PREFIXES = [
  "/dashboard/",
  "/request",
  "/messages",
  "/profile",
  "/threads",
  "/prof/",
  "/admin",
] as const;

/**
 * Public paths that one of the prefixes above would otherwise capture.
 *
 * `/professors/<id>` is a public, shareable, SEO-indexed faculty page; only the
 * `/professors` index sits behind the session wall. The two differ by a single
 * trailing segment, which is exactly the distinction a prefix test gets wrong —
 * the original code needed an explicit `!path.startsWith("/professors")` guard
 * for the same reason.
 */
export const PUBLIC_EXCEPTION_PREFIXES = ["/professors/"] as const;

/** True when `path` may only be served to a request carrying a session cookie. */
export function requiresSession(path: string): boolean {
  if (PUBLIC_EXCEPTION_PREFIXES.some((p) => path.startsWith(p))) return false;
  if ((PROTECTED_EXACT as readonly string[]).includes(path)) return true;
  return PROTECTED_PREFIXES.some((p) => path.startsWith(p));
}
