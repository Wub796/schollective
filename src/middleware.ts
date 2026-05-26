import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = await updateSession(request)

  const { data: { user } } = await supabase.auth.getUser()

  const url = new URL(request.url)
  const path = url.pathname

  // Protected route patterns — use exact prefixes to avoid false matches
  const isStudentRoute  = path === '/dashboard' || path.startsWith('/dashboard/') || path.startsWith('/request') || path.startsWith('/messages')
  const isProfessorRoute = path === '/prof/dashboard' || path === '/prof/profile' || path.startsWith('/prof/dashboard') || path.startsWith('/prof/profile') || path.startsWith('/prof/pending')
  const isAdminRoute    = path.startsWith('/admin')
  // /professors is a student-accessible browse route, NOT a professor-only route
  const isProfessorBrowse = path.startsWith('/professors')

  // 1. Authentication Guard: Redirect to login if no session
  if ((isStudentRoute || isProfessorRoute || isAdminRoute) && !user) {
    return Response.redirect(new URL('/login', request.url))
  }

  // 2. Role-Based Guard (RBAC) — only redirect when needed, never create loops
  if (user) {
    const role = user.user_metadata?.role

    // Student attempting to access Professor-only or Admin routes
    if (role === 'student' && (isProfessorRoute || isAdminRoute)) {
      return Response.redirect(new URL('/dashboard', request.url))
    }

    // Professor attempting to access Student or Admin routes
    // (but /prof/dashboard itself is fine — don't redirect there again)
    if (role === 'professor' && (isStudentRoute || isAdminRoute)) {
      return Response.redirect(new URL('/prof/dashboard', request.url))
    }

    // Safety check for Admin routes if role is not admin
    if (isAdminRoute && role !== 'admin') {
      const redirectPath = role === 'professor' ? '/prof/dashboard' : '/dashboard'
      return Response.redirect(new URL(redirectPath, request.url))
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
