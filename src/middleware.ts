import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request)

  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(request.url)
  const path = url.pathname

  // Protected route patterns — use exact prefixes to avoid false matches
  const isStudentRoute    = path === '/dashboard' || path.startsWith('/dashboard/') || path.startsWith('/request') || path.startsWith('/messages') || path.startsWith('/profile')
  const isProfessorRoute  = path === '/prof/dashboard' || path === '/prof/profile' || path.startsWith('/prof/dashboard') || path.startsWith('/prof/profile') || path.startsWith('/prof/pending')
  const isAdminRoute      = path.startsWith('/admin')
  // /professors is a student-accessible browse route, NOT a professor-only route
  const isProfessorBrowse = path.startsWith('/professors')
  // /onboarding is accessible to any authenticated user (Google sign-up completion)
  const isOnboarding      = path === '/onboarding'

  // 1. Authentication Guard: Redirect to login if no session
  if ((isStudentRoute || isProfessorRoute || isAdminRoute) && !user) {
    return Response.redirect(new URL('/login', request.url))
  }
  // Onboarding requires authentication but is not role-gated
  if (isOnboarding && !user) {
    return Response.redirect(new URL('/login', request.url))
  }

  // We rely on Server Components (e.g. /dashboard/page.tsx, /admin/dashboard/page.tsx)
  // to enforce strict Role-Based Access Control (RBAC) using the `profiles` table.
  // This prevents infinite redirect loops caused by out-of-sync `user.user_metadata.role`.

  return response

}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
