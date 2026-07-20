import { createBrowserClient } from '@supabase/ssr'

export const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const defaultCookieOptions = {
    maxAge: ONE_YEAR_IN_SECONDS,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return createBrowserClient(
      'https://placeholder-url.supabase.co',
      'placeholder-key',
      {
        cookieOptions: defaultCookieOptions,
      }
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: defaultCookieOptions,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
