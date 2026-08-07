import { betterAuth } from "better-auth";
import { Pool, neonConfig } from "@neondatabase/serverless";

// Use stateless HTTP fetch queries (no persistent connections) for Cloudflare Workers
neonConfig.poolQueryViaFetch = true;

const database = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  max: 1,
});

export const auth = betterAuth({
  database,
  baseURL: process.env.BETTER_AUTH_URL || "https://schollective.com",
  trustedOrigins: [
    "https://schollective.com",
    "https://www.schollective.com",
    "https://schollective.schollective.workers.dev",
    "http://localhost:3000",
    "http://localhost:8787",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")] : []),
  ],
  secret: process.env.BETTER_AUTH_SECRET || "[REDACTED-ROTATED]=",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "639902173862-25bm50enc0o26qsj52j8ovtmebpoms4p.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "[REDACTED-ROTATED]",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: true,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: true,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
