import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * OAuth / magic-link callback handler.
 *
 * Supabase redirects here after Google (or any provider) authentication.
 * We exchange the one-time `code` for a persistent session, write the
 * auth cookies, then redirect the user to their role-appropriate dashboard.
 *
 * Route: GET /auth/callback?code=<pkce_code>&next=<optional_path>
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Optional: honour a `next` param so callers can deep-link after login
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    // No code — something went wrong upstream; redirect to login with error
    return NextResponse.redirect(
      `${origin}/login?error=oauth_missing_code`
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message)
    return NextResponse.redirect(
      `${origin}/login?error=oauth_exchange_failed`
    )
  }

  // Determine the correct destination based on the user's role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', data.session.user.id)
    .single()

  let destination = next

  if (profile) {
    if (profile.role === 'professor') {
      destination = profile.status === 'approved' ? '/prof/dashboard' : '/prof/pending'
    } else if (profile.role === 'admin') {
      destination = '/admin/dashboard'
    } else {
      destination = '/dashboard'
    }
  }

  // Use a redirect that preserves the Set-Cookie headers written by createClient()
  const redirectUrl = destination.startsWith('http')
    ? destination
    : `${origin}${destination}`

  return NextResponse.redirect(redirectUrl)
}
