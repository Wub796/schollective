import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const url = new URL(request.url);
  const path = url.pathname;

  const isStudentRoute =
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path.startsWith("/request") ||
    path.startsWith("/messages") ||
    path.startsWith("/profile") ||
    path.startsWith("/threads");

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
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
