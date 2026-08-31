import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

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

  // Never intercept Better Auth API routes
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  const isStudentRoute =
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path.startsWith("/request") ||
    path.startsWith("/messages") ||
    path.startsWith("/profile") ||
    path.startsWith("/threads") ||
    path === "/professors";

  const isProfessorRoute =
    (path.startsWith("/prof/") || path === "/prof") && !path.startsWith("/professors");
  const isAdminRoute = path.startsWith("/admin");
  const isOnboarding = path === "/onboarding";

  // Guard protected routes if no session cookie
  if ((isStudentRoute || isProfessorRoute || isAdminRoute || isOnboarding) && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
