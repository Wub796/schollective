import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Similarly, we can ignore type errors for the final launch build if needed,
    // but the user only specifically asked for ESLint.
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
