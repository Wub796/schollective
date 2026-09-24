/**
 * Which origins the auth API will accept.
 *
 * Every request that mutates auth state has its `Origin` header checked against
 * this list, and the answer when it is not on it is a flat `403 INVALID_ORIGIN`
 * which the login form can only report as a generic failure. It reads as "login
 * is broken", never as "that host is not trusted" — so this list has now caused
 * two separate false alarms, in opposite directions:
 *
 *   1. It named three dev ports, so a dev server on any other port rejected
 *      every sign-in while the credentials and the database were both fine.
 *   2. It was then changed to trust loopback only when NODE_ENV was not
 *      "production". But `next start` sets NODE_ENV=production, while the client
 *      posts to `window.location.origin`. A production build served locally
 *      therefore answered every sign-in with 403.
 *
 * The decision now keys off the request's own Host header. Borrowing the
 * loopback allowance would require an attacker to make the victim's browser
 * send a request whose Host is the victim's own machine, which means already
 * running code there. On the deployed Worker the Host is the real domain, so
 * the loopback entries are never added at all.
 *
 * Deliberately a module with no imports, so the test suite can import the real
 * thing (tests/auth-trusted-origins.test.mjs) rather than re-implementing the
 * rule or scraping the source. Constructing the auth instance to get at this
 * would need a database and a full environment.
 */

/** Deployment origins this project has to keep signing in on. */
const DEPLOYED_ORIGINS: readonly string[] = [
  "https://schollective.com",
  "https://www.schollective.com",
  "https://schollective.schollective.workers.dev",
];

/**
 * Loopback origins, as wildcards.
 *
 * The `*` is load-bearing, not decoration. Better Auth matches a pattern that
 * contains no wildcard by exact full-origin equality, so a bare
 * `http://localhost` would NOT match `http://localhost:3001`. Without the
 * wildcard a dev server on an arbitrary port still cannot sign in.
 */
const LOOPBACK_ORIGINS: readonly string[] = [
  "http://localhost:*",
  "http://127.0.0.1:*",
  "http://[::1]:*",
];

/**
 * True when a Host header names the local machine.
 *
 * Handles the bracketed IPv6 form, which a naive split on ":" reduces to "[",
 * and any port. `0.0.0.0` is deliberately absent: it is a bind address, not
 * something a browser ever navigates to.
 */
export function isLoopbackHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const lower = host.toLowerCase();
  if (lower.startsWith("[")) return lower.startsWith("[::1]");
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(lower);
}

/** Origins are compared as `scheme://host:port`, which never ends in a slash. */
function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * The trusted-origin list for one request.
 *
 * @param hostHeader the request's own Host — what decides whether loopback is
 *   trusted for this request.
 * @param env the two deployment URLs either of which may define the app's
 *   public origin. Passed in rather than read from `process.env` so the
 *   behaviour can be tested without mutating the environment.
 */
export function resolveTrustedOrigins(
  hostHeader: string | null | undefined,
  env: { betterAuthUrl?: string | null; publicAppUrl?: string | null } = {},
): string[] {
  const origins: string[] = [...DEPLOYED_ORIGINS];

  // Whatever this particular deployment actually answers on. Both are trimmed:
  // an Origin header never carries a trailing slash, and the comparison is
  // exact, so one would be enough to reject a correctly-configured host.
  if (env.betterAuthUrl) origins.push(trimTrailingSlashes(env.betterAuthUrl));
  if (env.publicAppUrl) origins.push(trimTrailingSlashes(env.publicAppUrl));

  if (isLoopbackHost(hostHeader)) origins.push(...LOOPBACK_ORIGINS);

  return origins.filter(Boolean);
}
