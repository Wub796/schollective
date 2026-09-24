import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { safeInternalPath } from "@/lib/safe-redirect";
import { requiresSession } from "@/lib/route-access";

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Serve one canonical host.
  //
  // Cookies are host-only, but Google is always sent back to BETTER_AUTH_URL.
  // Someone who starts signing in on www gets their OAuth state cookie stored
  // there and the callback delivered to the apex, which cannot read it — the
  // handshake then fails with `state_mismatch`. The same split would strand a
  // session cookie, so a visitor signed in on one host looks signed out on the
  // other. Redirecting up front keeps every request on a single origin.
  const host = request.headers.get("host") ?? url.host;
  if (host.startsWith("www.")) {
    const canonical = new URL(request.url);
    canonical.host = host.slice(4);
    return NextResponse.redirect(canonical, 308);
  }

  // An OAuth failure that reaches the landing page belongs on the page that can
  // explain it.
  //
  // Better Auth's error endpoint defaults its `errorURL` to `/`, and `/` is a
  // prerendered marketing page that reads no query parameters — so a visitor
  // whose Google round trip fails is handed a page that looks entirely normal,
  // with the reason sitting in the address bar. Forwarding here rather than
  // reading `searchParams` on `/` keeps `/` prerendered: adding that would make
  // the busiest page in the app dynamic.
  if (path === "/" && url.searchParams.has("error")) {
    const login = new URL("/login", request.url);
    // Only ever a path and one query value, so this cannot become a redirect.
    login.searchParams.set("error", url.searchParams.get("error") ?? "");
    return NextResponse.redirect(login, 307);
  }

  const sessionCookie = getSessionCookie(request);

  if (requiresSession(path) && !sessionCookie) {
    // Send them back where they were trying to go after signing in. Only a
    // path-and-query is ever echoed back (see safeInternalPath) — accepting a full
    // URL here would make this an open redirect.
    const login = new URL("/login", request.url);
    const returnTo = safeInternalPath(`${path}${url.search || ""}`);
    if (returnTo) login.searchParams.set("next", returnTo);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

/**
 * NOTE on `/api/auth`: it is deliberately NOT excluded from the matcher any more.
 *
 * The exclusion was justified on the grounds that a visitor always reaches a page
 * first, is canonicalised there, and so every later `/api/auth` call their
 * browser makes is already same-origin. That holds for a navigation and fails for
 * every other way a request arrives — and `www.schollective.com` answers
 * `/api/auth/sign-in/social` with a 200 and a `Set-Cookie`, because the matcher
 * kept this redirect away from it.
 *
 * Better Auth then sets `__Secure-better-auth.state` as a HOST-ONLY cookie on
 * www, while `redirect_uri` is built from BETTER_AUTH_URL and always names the
 * apex. Google returns to the apex, which cannot see a cookie set on www, the
 * state row still exists in the database, and the visitor is bounced to
 * `/?error=state_mismatch` — an error that names neither the host nor the cookie.
 * The same split strands the session cookie for anyone who signs in on www.
 *
 * Running the middleware here costs nothing: `requiresSession` matches no `/api`
 * path, so an auth request only ever picks up the canonical host.
 *
 * `schollective.schollective.workers.dev` has the same failure and is left alone
 * on purpose — it is a preview host, and pointing it at the apex would send a
 * preview deploy's auth calls to production.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
