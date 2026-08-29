import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

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
  const isAuthPage = path === "/login" || path === "/signup";

  // 0. Redirect logged-in users away from /login & /signup
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 1. Guard protected routes if no session cookie
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
