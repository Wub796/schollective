import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUserAndProfile } from '@/lib/neon/profiles';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const requestedNext = request.nextUrl.searchParams.get('next') ?? '/dashboard';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/dashboard';

  try {
    const { user, profile } = await getCurrentUserAndProfile(request.headers);

    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=oauth_session_missing`);
    }

    if (!profile || !profile.first_name || !profile.role || !profile.profile_complete) {
      const onboardingUrl = new URL('/onboarding', origin);
      if (next && next !== '/dashboard') {
        onboardingUrl.searchParams.set('next', next);
      }
      return NextResponse.redirect(onboardingUrl.toString());
    }

    if (profile.role === 'professor') {
      return NextResponse.redirect(profile.status === 'approved' ? `${origin}/prof/dashboard` : `${origin}/prof/pending`);
    }

    if (profile.role === 'admin') {
      return NextResponse.redirect(`${origin}/admin/dashboard`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error('[auth/callback] Error:', err);
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
  }
}
