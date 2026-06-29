import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request)

  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(request.url)
  const path = url.pathname

  // Protected route patterns — use exact prefixes to avoid false matches
  const isStudentRoute = path === '/dashboard' || path.startsWith('/dashboard/') || path.startsWith('/request') || path.startsWith('/messages') || path.startsWith('/profile')
  const isProfessorRoute = path === '/prof/dashboard' || path === '/prof/profile' || path.startsWith('/prof/dashboard') || path.startsWith('/prof/profile') || path.startsWith('/prof/pending')
  const isAdminRoute = path.startsWith('/admin')
  // /professors is a student-accessible browse route, NOT a professor-only route
  const isProfessorBrowse = path.startsWith('/professors')
  // /onboarding is accessible to any authenticated user (Google sign-up completion)
  const isOnboarding = path === '/onboarding'

  // 1. Authentication Guard: Redirect to login if no session
  if ((isStudentRoute || isProfessorRoute || isAdminRoute) && !user) {
    return Response.redirect(new URL('/login', request.url))
  }
  // Onboarding requires authentication but is not role-gated
  if (isOnboarding && !user) {
    return Response.redirect(new URL('/login', request.url))
  }

  // 2. Email Verification Guard: Redirect to /verify-email if email is not confirmed
  if (user && !user.email_confirmed_at && path !== '/verify-email' && !path.startsWith('/auth/')) {
    if (isStudentRoute || isProfessorRoute || isAdminRoute || isOnboarding) {
      return Response.redirect(new URL('/verify-email', request.url))
    }
  }

  // 3. Onboarding & Suspension Guard: Redirect incomplete profiles to /onboarding, suspended to /suspended
  if (user && user.email_confirmed_at && !isOnboarding && !path.startsWith('/auth/') && path !== '/verify-email' && path !== '/suspended') {
    if (isStudentRoute || isProfessorRoute || isAdminRoute || isProfessorBrowse) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, suspended')
        .eq('id', user.id)
        .single()

      if (profile?.suspended) {
        return Response.redirect(new URL('/suspended', request.url))
      }

      if (!profile || !profile.role || !profile.first_name) {
        return Response.redirect(new URL('/onboarding', request.url))
      }
    }
  }

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
