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
            get(name: string) { return undefined },
            set(name: string, value: string, options: CookieOptions) {},
            remove(name: string, options: CookieOptions) {},
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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const mergedOptions = {
            ...DEFAULT_COOKIE_OPTIONS,
            ...options,
            maxAge: options?.maxAge ?? ONE_YEAR_IN_SECONDS,
          }
          request.cookies.set({
            name,
            value,
            ...mergedOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...mergedOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          const mergedOptions = {
            ...DEFAULT_COOKIE_OPTIONS,
            ...options,
            maxAge: 0,
          }
          request.cookies.set({
            name,
            value: '',
            ...mergedOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...mergedOptions,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return { supabase, response, user }
}
