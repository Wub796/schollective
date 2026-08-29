/**
 * Neon Auth Configuration
 * Integrated with managed Better Auth and JWT verification via JWKS.
 */
export const NEON_AUTH_CONFIG = {
  baseUrl: process.env.NEON_AUTH_BASE_URL || "",
  jwksUrl: process.env.NEON_AUTH_JWKS_URL || "",
};
