import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  maxAge: ONE_YEAR_IN_SECONDS,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return createServerClient(
      'https://placeholder-url.supabase.co',
      'placeholder-key',
      {
        cookieOptions: DEFAULT_COOKIE_OPTIONS,
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieOptions: DEFAULT_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...DEFAULT_COOKIE_OPTIONS,
                ...options,
                maxAge: options?.maxAge ?? ONE_YEAR_IN_SECONDS,
              })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware is refreshing user sessions.
          }
        },
      },
    }
  )
}
