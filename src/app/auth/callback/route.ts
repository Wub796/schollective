import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUserAndProfile } from '@/lib/neon/profiles';
import { safeInternalPath } from '@/lib/safe-redirect';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  // The shared validator, not a local `startsWith('/')` check: that one let
  // `/\evil.example` through, which browsers normalise to `//evil.example` —
  // an open redirect straight out of the sign-in flow.
  const next = safeInternalPath(request.nextUrl.searchParams.get('next')) ?? '/dashboard';

  try {
    const { user, profile } = await getCurrentUserAndProfile(request.headers);

    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=oauth_session_missing`);
    }

    if (!profile || !profile.role) {
      const onboardingUrl = new URL('/onboarding', origin);
      if (next && next !== '/dashboard') {
        onboardingUrl.searchParams.set('next', next);
      }
      return NextResponse.redirect(onboardingUrl.toString());
    }

    if (profile.role === 'admin') {
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    }

    if (!profile.profile_complete) {
      const onboardingUrl = new URL('/onboarding', origin);
      if (next && next !== '/dashboard') {
        onboardingUrl.searchParams.set('next', next);
      }
      return NextResponse.redirect(onboardingUrl.toString());
    }

    if (profile.role === 'professor') {
      return NextResponse.redirect(profile.status === 'approved' ? `${origin}/prof/dashboard` : `${origin}/prof/pending`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error('[auth/callback] Error:', err);
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
  }
}
