import { AsyncLocalStorage } from "node:async_hooks";
import { betterAuth } from "better-auth";
import { neon } from "@neondatabase/serverless";
import {
  CompiledQuery,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { describeMissingDbUrl, getServerlessDbUrl } from "@/lib/neon/db";
import { ensureAuthSchema } from "@/lib/neon/schema";
import { passwordResetEmail, sendEmail, verificationEmail } from "@/lib/email";

const PG_DIALECT = {
  createAdapter: () => new PostgresAdapter(),
  createQueryCompiler: () => new PostgresQueryCompiler(),
  createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),
  createDriver: () => {
    // Stateless HTTP driver: every query goes through the Neon `neon()`
    // fetch endpoint. Avoids the WebSocket connections that break across
    // Cloudflare Worker isolate reuse (intermittent 1101 errors).
    // neon() is deferred to first acquireConnection because process.env
    // (Worker bindings) is not populated at module-load time in OpenNext.
    let client: any;
    let connection: any;
    return {
      init: async () => {},
      acquireConnection: async () => {
        // Creates/repairs the Better Auth tables the first time this isolate
        // talks to Neon. Without it a never-migrated database makes every auth
        // call throw, which reaches the browser as a bodyless 500.
        await ensureAuthSchema();
        const url = getServerlessDbUrl();
        if (!url) throw new Error(describeMissingDbUrl());
        if (!client) client = { query: neon(url, { fullResults: true }) };
        if (!connection) connection = new NeonConnection(client);
        return connection;
      },
      beginTransaction: async () => { throw new Error("Transactions are not supported with Neon HTTP connections"); },
      commitTransaction: async () => { throw new Error("Transactions are not supported with Neon HTTP connections"); },
      rollbackTransaction: async () => { throw new Error("Transactions are not supported with Neon HTTP connections"); },
      releaseConnection: async () => {},
      destroy: async () => {},
    };
  },
};

class NeonConnection {
  private client: any;
  constructor(client: any) { this.client = client; }
  async executeQuery(compiledQuery: CompiledQuery) {
    const result = await this.client.query(compiledQuery.sql, [...compiledQuery.parameters]);
    if (result.command === "INSERT" || result.command === "UPDATE" || result.command === "DELETE") {
      const n = BigInt(result.rowCount);
      return { numUpdatedOrDeletedRows: n, numAffectedRows: n, rows: result.rows ?? [] };
    }
    return { rows: result.rows ?? [] };
  }
  async *streamQuery() { throw new Error("Streaming is not supported with Neon HTTP connections"); }
}

/**
 * Per-request slot the API route uses to recover the cause of a failed auth
 * call. Better Auth handles its own errors and answers unexpected ones with an
 * empty HTTP 500, which reaches the browser as an error with no message at all.
 */
export const authErrorStore = new AsyncLocalStorage<{ error?: unknown }>();

/**
 * Google sign-in is registered only when both credentials are present.
 * Registering it with blanks would fail mid-handshake instead of letting the
 * client report the provider as unconfigured.
 */
const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  database: { dialect: PG_DIALECT, type: "postgres" },
  baseURL: process.env.BETTER_AUTH_URL || "https://schollective.com",
  session: {
    expiresIn: 60 * 60 * 24 * 365,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    },
  },
  trustedOrigins: [
    "https://schollective.com",
    "https://www.schollective.com",
    "https://schollective.schollective.workers.dev",
    "http://localhost:3000",
    "http://localhost:8787",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")] : []),
  ],
  socialProviders: googleProvider,
  /**
   * Database-backed so the counters are shared across Worker isolates. The
   * in-memory default counts per isolate, which on Cloudflare means barely any
   * limit at all — and these are the endpoints worth protecting from guessing
   * and signup floods.
   */
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 3600, max: 10 },
      "/request-password-reset": { window: 3600, max: 5 },
      "/reset-password": { window: 3600, max: 10 },
    },
  },
  onAPIError: {
    onError: (error) => {
      const slot = authErrorStore.getStore();
      if (slot) slot.error = error;
      console.error("[auth] API error:", error);
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...passwordResetEmail(url) });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...verificationEmail(url) });
    },
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
