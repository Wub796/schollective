import { neon } from "@neondatabase/serverless";
import { getServerlessDbUrl } from "./db";

/**
 * Idempotent schema bootstrap for the Better Auth tables.
 *
 * The Cloudflare deploy pipeline (`opennextjs-cloudflare build && wrangler deploy`)
 * has no migration step, so a database that has never been migrated — or that was
 * migrated against an older Better Auth release — makes every `/api/auth/*` call
 * throw and surface as a bodyless HTTP 500 ("Failed to sign in."). This module
 * repairs the schema on demand using DDL that is safe to run concurrently and
 * repeatedly.
 *
 * Set AUTH_SCHEMA_AUTO_MIGRATE=false to opt out and manage the schema manually
 * with `db/migrations/0001_better_auth.sql`.
 */

type ColumnSpec = { name: string; ddl: string };

const REQUIRED_COLUMNS: Record<string, ColumnSpec[]> = {
  user: [
    { name: "id", ddl: `"id" text not null primary key` },
    { name: "name", ddl: `"name" text not null` },
    { name: "email", ddl: `"email" text not null unique` },
    { name: "emailVerified", ddl: `"emailVerified" boolean not null default false` },
    { name: "image", ddl: `"image" text` },
    { name: "createdAt", ddl: `"createdAt" timestamptz not null default CURRENT_TIMESTAMP` },
    { name: "updatedAt", ddl: `"updatedAt" timestamptz not null default CURRENT_TIMESTAMP` },
    { name: "role", ddl: `"role" text` },
    { name: "status", ddl: `"status" text` },
  ],
  session: [
    { name: "id", ddl: `"id" text not null primary key` },
    { name: "expiresAt", ddl: `"expiresAt" timestamptz not null` },
    { name: "token", ddl: `"token" text not null unique` },
    { name: "createdAt", ddl: `"createdAt" timestamptz not null default CURRENT_TIMESTAMP` },
    { name: "updatedAt", ddl: `"updatedAt" timestamptz not null default CURRENT_TIMESTAMP` },
    { name: "ipAddress", ddl: `"ipAddress" text` },
    { name: "userAgent", ddl: `"userAgent" text` },
    { name: "userId", ddl: `"userId" text not null references "user" ("id") on delete cascade` },
  ],
  account: [
    { name: "id", ddl: `"id" text not null primary key` },
    // Added in Better Auth 1.7; rows written before it are backfilled below.
    { name: "issuer", ddl: `"issuer" text` },
    { name: "accountId", ddl: `"accountId" text not null` },
    { name: "providerId", ddl: `"providerId" text not null` },
    { name: "userId", ddl: `"userId" text not null references "user" ("id") on delete cascade` },
    { name: "accessToken", ddl: `"accessToken" text` },
    { name: "refreshToken", ddl: `"refreshToken" text` },
    { name: "idToken", ddl: `"idToken" text` },
    { name: "accessTokenExpiresAt", ddl: `"accessTokenExpiresAt" timestamptz` },
    { name: "refreshTokenExpiresAt", ddl: `"refreshTokenExpiresAt" timestamptz` },
    { name: "scope", ddl: `"scope" text` },
    { name: "password", ddl: `"password" text` },
    { name: "createdAt", ddl: `"createdAt" timestamptz not null default CURRENT_TIMESTAMP` },
    { name: "updatedAt", ddl: `"updatedAt" timestamptz not null default CURRENT_TIMESTAMP` },
  ],
  verification: [
    { name: "id", ddl: `"id" text not null primary key` },
    { name: "identifier", ddl: `"identifier" text not null` },
    { name: "value", ddl: `"value" text not null` },
    { name: "expiresAt", ddl: `"expiresAt" timestamptz not null` },
    { name: "createdAt", ddl: `"createdAt" timestamptz not null default CURRENT_TIMESTAMP` },
    { name: "updatedAt", ddl: `"updatedAt" timestamptz not null default CURRENT_TIMESTAMP` },
  ],
};

// Order matters: "session" and "account" reference "user".
const TABLE_ORDER = ["user", "session", "account", "verification"] as const;

const INDEX_STATEMENTS = [
  `CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_accountId_uidx" ON "account" ("issuer", "accountId")`,
];

/**
 * Better Auth 1.7 namespaces the account issuer rather than reusing the provider
 * id: credential logins are stored as `local:credential` and OAuth logins as
 * `local:oauth:<providerId>` (see `createLocalAccountIssuer` /
 * `createOAuthAccountIssuer` in @better-auth/core). Rows written before 1.7 have
 * no issuer at all, and filling them with the bare provider id would stop every
 * existing password from matching, so backfill the namespaced form.
 */
const BACKFILL_ISSUER = `
  UPDATE "account"
     SET "issuer" = CASE
       WHEN "providerId" = 'credential' THEN 'local:credential'
       ELSE 'local:oauth:' || "providerId"
     END
   WHERE "issuer" IS NULL
`;

// Emitted only when the app's own profile table is absent (a brand new database).
// An existing profiles table is never altered here.
const PROFILES_TABLE = `
  CREATE TABLE IF NOT EXISTS profiles (
    id text PRIMARY KEY,
    email text UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'student',
    status text NOT NULL DEFAULT 'active',
    first_name text,
    preferred_name text,
    last_name text,
    avatar_url text,
    institution text,
    education_level text,
    department text,
    academic_title text,
    major text,
    graduation_year text,
    bio text,
    academic_interests jsonb,
    extracurriculars jsonb,
    expertise_fields jsonb,
    coursework jsonb,
    skills_and_tools jsonb,
    publications jsonb,
    accepting_student_types jsonb,
    lab_website text,
    portfolio_url text,
    office_hours text,
    seeking_mentorship_type text,
    is_accepting_requests boolean DEFAULT true,
    profile_complete boolean DEFAULT false,
    ai_score integer,
    ai_level text,
    ai_flags jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  )
`;

/** Postgres codes for "this object already exists" — expected when isolates race. */
const ALREADY_EXISTS = new Set(["42P07", "42710", "42701"]);

type Runner = (query: string, params?: unknown[]) => Promise<any>;

async function exec(run: Runner, statement: string): Promise<void> {
  try {
    await run(statement);
  } catch (error: any) {
    if (error?.code && ALREADY_EXISTS.has(error.code)) return;
    throw error;
  }
}

/** One round trip that tells us every table/column we care about. */
async function readSchema(run: Runner): Promise<Map<string, Set<string>>> {
  const names = [...TABLE_ORDER, "profiles"];
  const rows = await run(
    `SELECT table_name::text AS table_name, column_name::text AS column_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name::text = ANY($1::text[])`,
    [names],
  );
  const found = new Map<string, Set<string>>();
  for (const row of rows as Array<{ table_name: string; column_name: string }>) {
    if (!found.has(row.table_name)) found.set(row.table_name, new Set());
    found.get(row.table_name)!.add(row.column_name);
  }
  return found;
}

function isUpToDate(found: Map<string, Set<string>>): boolean {
  if (!found.has("profiles")) return false;
  for (const table of TABLE_ORDER) {
    const columns = found.get(table);
    if (!columns) return false;
    for (const column of REQUIRED_COLUMNS[table]) {
      if (!columns.has(column.name)) return false;
    }
  }
  return true;
}

async function bootstrap(): Promise<void> {
  const url = getServerlessDbUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Set DATABASE_URL (or DATABASE_URL_UNPOOLED) " +
        "so authentication can reach Neon.",
    );
  }

  const run = neon(url) as unknown as Runner;
  const found = await readSchema(run);
  if (isUpToDate(found)) return;

  console.log("[auth] Repairing authentication schema in Neon…");

  for (const table of TABLE_ORDER) {
    const columns = found.get(table);
    if (!columns) {
      const body = REQUIRED_COLUMNS[table].map((c) => c.ddl).join(", ");
      await exec(run, `CREATE TABLE IF NOT EXISTS "${table}" (${body})`);
      continue;
    }
    for (const column of REQUIRED_COLUMNS[table]) {
      if (columns.has(column.name)) continue;
      // ADD COLUMN cannot carry NOT NULL without a default on a populated table,
      // so widen the definition when patching an existing table.
      const ddl = column.ddl.replace(/\s+not null/i, "").replace(/\s+primary key/i, "");
      await exec(run, `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS ${ddl}`);
    }
  }

  await exec(run, BACKFILL_ISSUER);

  for (const statement of INDEX_STATEMENTS) {
    // Indexes are an optimisation and a uniqueness guard; a database that
    // already holds conflicting rows should still be able to sign users in.
    try {
      await exec(run, statement);
    } catch (error: any) {
      console.warn("[auth] Could not create index:", error?.message ?? error);
    }
  }

  if (!found.has("profiles")) {
    await exec(run, PROFILES_TABLE);
  }

  console.log("[auth] Authentication schema is ready.");
}

let inFlight: Promise<void> | null = null;

/**
 * Ensures the Better Auth tables exist before a query runs. Resolves immediately
 * after the first successful check within an isolate; a failure clears the cache
 * so the next request retries rather than caching a broken state.
 */
export function ensureAuthSchema(): Promise<void> {
  if (process.env.AUTH_SCHEMA_AUTO_MIGRATE === "false") return Promise.resolve();
  if (!inFlight) {
    inFlight = bootstrap().catch((error) => {
      inFlight = null;
      throw error;
    });
  }
  return inFlight;
}
