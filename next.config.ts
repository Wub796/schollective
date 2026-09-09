import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https: https://*.googleusercontent.com",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://cdn.amplitude.com https://accounts.google.com https://apis.google.com",
      "worker-src 'self' blob:",
      "connect-src 'self' https://*.neon.tech wss://*.neon.tech https://*.amplitude.com https://api2.amplitude.com https://sr-client-cfg.amplitude.com https://generativelanguage.googleapis.com https://accounts.google.com https://static.cloudflareinsights.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

// Pin the deployment id to the commit SHA. A Cloudflare Workers deploy rotates
// server action ids, so a tab opened before a deploy keeps stale client bundles
// and its next server action throws UnrecognizedActionError. A stable id is sent
// as the x-deployment-id header, so Next.js can detect the client/server skew.
const deploymentId =
  process.env.WORKERS_CI_COMMIT_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.NEXT_DEPLOYMENT_ID ||
  undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  deploymentId,
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
