import { betterAuth } from "better-auth";
import { neon } from "@neondatabase/serverless";
import {
  CompiledQuery,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import { getServerlessDbUrl } from "@/lib/neon/db";

const PG_DIALECT = {
  createAdapter: () => new PostgresAdapter(),
  createQueryCompiler: () => new PostgresQueryCompiler(),
  createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),
  createDriver: () => {
    // Stateless HTTP driver: every query goes through the Neon `neon()`
    // fetch endpoint. Avoids the WebSocket connections that break across
    // Cloudflare Worker isolate reuse (intermittent 1101 errors).
    const client = { query: neon(getServerlessDbUrl(), { fullResults: true }) };
    let connection: any;
    return {
      init: async () => {},
      acquireConnection: async () => {
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

export const auth = betterAuth({
  database: { dialect: PG_DIALECT, type: "postgres" },
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
