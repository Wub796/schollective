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

  // NOTE on /api/auth: this middleware never runs for those paths at all — the
  // matcher below excludes them. There used to be an explicit
  // `if (path.startsWith("/api/auth")) return next()` here, which could not
  // execute and implied a protection this function does not provide: the
  // canonical-host redirect above cannot reach the auth endpoints either. It
  // does not need to. A visitor arriving on www hits a *page* first, gets
  // redirected to the apex, and every subsequent /api/auth call their browser
  // makes is already same-origin. The Google callback is delivered to
  // BETTER_AUTH_URL, which is the apex.

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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
