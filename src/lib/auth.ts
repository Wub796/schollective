import { betterAuth } from "better-auth";
import { neon, neonConfig } from "@neondatabase/serverless";

// Use stateless HTTP fetch queries for serverless edge / Cloudflare Workers
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchEndpoint = (host: string) => `https://${host}/sql`;

function getDatabaseConnectionString(): string {
  const raw =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:[REDACTED-ROTATED]@ep-nameless-dream-aefnmhh3.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
  // Strip '-pooler' and 'channel_binding' for Cloudflare Worker compatibility
  return raw
    .replace("-pooler.", ".")
    .replace("channel_binding=require&", "")
    .replace("&channel_binding=require", "")
    .replace("?channel_binding=require", "?");
}

const database = neon(getDatabaseConnectionString());

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
