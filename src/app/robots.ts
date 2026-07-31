import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://schollective.com').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/messages/',
          '/threads/',
          '/profile/',
          '/prof/',
          '/onboarding',
          '/auth/',
          '/login',
          '/signup',
          '/reset-password',
          '/verify-email',
          '/suspended',
          '/request/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
