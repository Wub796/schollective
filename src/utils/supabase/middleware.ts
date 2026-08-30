import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  maxAge: ONE_YEAR_IN_SECONDS,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      supabase: createServerClient(
        'https://placeholder-url.supabase.co',
        'placeholder-key',
        {
          cookieOptions: DEFAULT_COOKIE_OPTIONS,
          cookies: {
            getAll() { return [] },
            setAll() {},
          },
        }
      ),
      response
    }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieOptions: DEFAULT_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...DEFAULT_COOKIE_OPTIONS,
              ...options,
              maxAge: options?.maxAge ?? ONE_YEAR_IN_SECONDS,
            })
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return { supabase, response, user }
}
