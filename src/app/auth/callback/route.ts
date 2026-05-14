import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * OAuth / magic-link callback handler.
 *
 * Supabase redirects here after Google (or any provider) authentication.
 * We exchange the one-time `code` for a persistent session, write the
 * auth cookies, then redirect the user to:
 *   - /onboarding       → new Google user with no profile yet
 *   - /dashboard        → returning student
 *   - /prof/dashboard   → approved professor
 *   - /prof/pending     → professor awaiting approval
 *   - /admin/dashboard  → admin
 *
 * Route: GET /auth/callback?code=<pkce_code>&next=<optional_path>
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_missing_code`)
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`)
  }

  // Check profile completeness
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, first_name')
    .eq('id', data.session.user.id)
    .single()

  let destination: string

  if (!profile || !profile.first_name) {
    // New Google user — send to onboarding to complete their profile.
    // The role they selected is stored in localStorage by the signup page
    // and will be read by the onboarding page after this redirect.
    destination = '/onboarding'
  } else if (profile.role === 'professor') {
    destination = profile.status === 'approved' ? '/prof/dashboard' : '/prof/pending'
  } else if (profile.role === 'admin') {
    destination = '/admin/dashboard'
  } else {
    destination = next === '/dashboard' ? '/dashboard' : next
  }

  const redirectUrl = destination.startsWith('http')
    ? destination
    : `${origin}${destination}`

  return NextResponse.redirect(redirectUrl)
}
