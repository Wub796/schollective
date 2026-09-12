import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // The CSP sets `upgrade-insecure-requests`, which fixes mixed content but does
  // nothing about the first plaintext request. HSTS is what removes that, and it
  // was missing. Two years, subdomains included, preload-eligible.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Cross-origin isolation basics: these cost nothing here and close off
  // window-reference and resource-inclusion attacks from other origins.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
      // `https:` on its own already permits every https image host, so the
      // googleusercontent entry that used to follow it was redundant. Narrowed to
      // the hosts actually used: our own origin, data/blob URIs for previews and
      // generated avatars, and Google's avatar CDN for OAuth profile pictures.
      "img-src 'self' data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com",
      "font-src 'self' https://fonts.gstatic.com",
      // 'unsafe-inline' stays for styles: the codebase renders ~1,680 inline
      // style objects, which is a legitimate use of the attribute and not a
      // script-execution vector.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // 'unsafe-eval' removed — nothing here needs eval/new Function, and leaving
      // it on hands any injected string a direct route to execution.
      //
      // 'unsafe-inline' in script-src is still present and is the weakest part of
      // this policy: Next's App Router emits inline bootstrap and flight-data
      // scripts, so removing it requires per-request nonces threaded through the
      // document, which needs every page to be dynamically rendered. Tracked as
      // the next step rather than silently accepted — see README.
      "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://cdn.amplitude.com https://accounts.google.com https://apis.google.com",
      "worker-src 'self' blob:",
      "connect-src 'self' https://*.neon.tech wss://*.neon.tech https://*.amplitude.com https://api2.amplitude.com https://sr-client-cfg.amplitude.com https://generativelanguage.googleapis.com https://accounts.google.com https://static.cloudflareinsights.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io",
      "object-src 'none'",
      "frame-src 'self' https://accounts.google.com",
      "manifest-src 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // eslint and typescript errors are deliberately not failed during builds:
  // typecheck, lint and tests gate every push in .github/workflows/ci.yml
  // instead. Keep CI green — these flags only move the gate, they do not
  // remove it. (They also keep the OpenNext Cloudflare build from timing out
  // re-running them on a 33k-line codebase.)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Sentry stays external: measured at 3.28 MiB gzipped vs 3.37 MiB bundled,
  // and it is the layout Sentry documents.
  serverExternalPackages: ["@sentry/nextjs"],
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
