import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const url = new URL(request.url)
  const path = url.pathname

  // Protected route patterns
  const isStudentRoute = path.startsWith('/dashboard') || path.startsWith('/request') || path.startsWith('/messages')
  const isProfessorRoute = path.startsWith('/prof')
  const isAdminRoute = path.startsWith('/admin')

  // 1. Authentication Guard: Redirect to login if no session
  if ((isStudentRoute || isProfessorRoute || isAdminRoute) && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Role-Based Guard (RBAC)
  if (session) {
    const role = session.user.user_metadata?.role

    // Student attempting to access Professor or Admin routes
    if (role === 'student' && (isProfessorRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Professor attempting to access Student or Admin routes
    if (role === 'professor' && (isStudentRoute || isAdminRoute)) {
      return NextResponse.redirect(new URL('/prof/dashboard', request.url))
    }
    
    // Safety check for Admin routes if role is not admin
    if (isAdminRoute && role !== 'admin') {
      const redirectPath = role === 'professor' ? '/prof/dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(redirectPath, request.url))
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
