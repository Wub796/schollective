import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * OAuth / magic-link callback handler.
 *
 * Supabase redirects here after Google (or any provider) authentication.
 * We exchange the one-time `code` for a persistent session, write the
 * auth cookies, then redirect the user to:
 *   - /onboarding       → new Google user with no profile yet
 *   - /dashboard        → returning student
 *   - /prof/dashboard   → professor (auto-approved)
 *   - /admin/dashboard  → admin
 *
 * Route: GET /auth/callback?code=<pkce_code>&next=<optional_path>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const origin = request.nextUrl.origin
  const code = searchParams.get('code')
  // If "next" is in the callback URL, use it; otherwise default to dashboard.
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    // If no code, check if there's an error from the provider
    const errorCode = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    console.error('[auth/callback] No code found:', { errorCode, errorDescription })
    return NextResponse.redirect(`${origin}/login?error=${errorCode || 'oauth_missing_code'}`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth/callback] Missing Supabase env variables')
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`)
  }

  // We collect cookies to set or remove during the OAuth exchange and profile check,
  // then apply them to the final redirect response. This is because GET Route Handlers
  // in Next.js 15 cannot write to the read-only cookies() header directly.
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []
  const cookiesToRemove: { name: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookiesToSet.push({ name, value, options })
        },
        remove(name: string, options: CookieOptions) {
          cookiesToRemove.push({ name, options })
        },
      },
    }
  )

  // Exchange the auth code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`)
  }

  // Check profile completeness to decide where to send them
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status, first_name')
    .eq('id', data.session.user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('[auth/callback] Profile query error:', profileError.message)
  }

  let destination: string

  if (!profile || !profile.first_name || !profile.role) {
    // New Google user or incomplete profile — send to onboarding.
    // We append the original "next" as a query param so onboarding can eventually
    // send them to their intended destination.
    const onboardingUrl = new URL('/onboarding', origin)
    if (next && next !== '/dashboard') {
      onboardingUrl.searchParams.set('next', next)
    }
    destination = onboardingUrl.toString()
  } else if (profile.role === 'professor') {
    destination = `${origin}/prof/dashboard`
  } else if (profile.role === 'admin') {
    destination = `${origin}/admin/dashboard`
  } else {
    // Standard student or default
    destination = next.startsWith('http') ? next : `${origin}${next}`
  }

  const response = NextResponse.redirect(destination)

  // Set the collected cookies on the redirect response
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set({ name, value, ...options })
  }
  for (const { name, options } of cookiesToRemove) {
    response.cookies.set({ name, value: '', ...options })
  }

  return response
}

