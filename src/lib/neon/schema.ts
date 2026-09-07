import { neon } from "@neondatabase/serverless";
import { describeMissingDbUrl, getServerlessDbUrl } from "./db";

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
  // Backs the shared rate limiter configured in src/lib/auth.ts.
  rateLimit: [
    { name: "id", ddl: `"id" text not null primary key` },
    { name: "key", ddl: `"key" text not null unique` },
    { name: "count", ddl: `"count" integer not null default 0` },
    { name: "lastRequest", ddl: `"lastRequest" bigint not null default 0` },
  ],
};

// Order matters: "session" and "account" reference "user".
const TABLE_ORDER = ["user", "session", "account", "verification", "rateLimit"] as const;

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

/**
 * Indexes for the app's own tables. Every query below filters or orders on
 * these columns, and without them each one is a sequential scan that gets
 * slower with every request, message and notification the beta produces.
 */
const APP_REQUIRED_COLUMNS: Record<string, ColumnSpec[]> = {
  profiles: [
    { name: "academic_stats", ddl: "academic_stats jsonb" },
    { name: "activities", ddl: "activities jsonb" },
    { name: "honors_awards", ddl: "honors_awards jsonb" },
    { name: "languages", ddl: "languages jsonb" },
    { name: "social_links", ddl: "social_links jsonb" },
  ],
  ai_profile_review_jobs: [
    { name: "id", ddl: `id text primary key` },
    { name: "user_id", ddl: `user_id text not null` },
    { name: "status", ddl: `status text not null default 'pending'` },
    { name: "profile_data", ddl: `profile_data jsonb not null` },
    { name: "result", ddl: `result jsonb` },
    { name: "error", ddl: `error text` },
    { name: "processing_token", ddl: `processing_token text` },
    { name: "created_at", ddl: `created_at timestamptz not null default now()` },
    { name: "started_at", ddl: `started_at timestamptz` },
    { name: "completed_at", ddl: `completed_at timestamptz` },
    { name: "updated_at", ddl: `updated_at timestamptz not null default now()` },
  ],
};

const APP_TABLES: Record<string, string> = {
  ai_profile_review_jobs: `
    CREATE TABLE IF NOT EXISTS ai_profile_review_jobs (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      profile_data jsonb NOT NULL,
      result jsonb,
      error text,
      processing_token text,
      created_at timestamptz NOT NULL DEFAULT now(),
      started_at timestamptz,
      completed_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `,
};

const APP_INDEXES: Record<string, string[]> = {
  profiles: [
    `CREATE INDEX IF NOT EXISTS "profiles_role_status_idx" ON profiles (role, status)`,
    `CREATE INDEX IF NOT EXISTS "profiles_email_idx" ON profiles (email)`,
  ],
  requests: [
    `CREATE INDEX IF NOT EXISTS "requests_student_id_idx" ON requests (student_id)`,
    `CREATE INDEX IF NOT EXISTS "requests_professor_id_idx" ON requests (professor_id)`,
    `CREATE INDEX IF NOT EXISTS "requests_professor_status_idx" ON requests (professor_id, status)`,
  ],
  messages: [
    `CREATE INDEX IF NOT EXISTS "messages_request_id_created_at_idx" ON messages (request_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON messages (sender_id)`,
  ],
  notifications: [
    `CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON notifications (user_id, created_at DESC)`,
  ],
  ai_profile_review_jobs: [
    `CREATE UNIQUE INDEX IF NOT EXISTS "ai_profile_review_jobs_active_user_uidx" ON ai_profile_review_jobs (user_id) WHERE status IN ('pending', 'processing')`,
    `CREATE INDEX IF NOT EXISTS "ai_profile_review_jobs_user_created_idx" ON ai_profile_review_jobs (user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS "ai_profile_review_jobs_status_updated_idx" ON ai_profile_review_jobs (status, updated_at)`,
  ],
};

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
    academic_stats jsonb,
    activities jsonb,
    honors_awards jsonb,
    languages jsonb,
    social_links jsonb,
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

interface SchemaSnapshot {
  /** table name -> column names */
  columns: Map<string, Set<string>>;
  /** every index name on the tables we manage */
  indexes: Set<string>;
}

/** One round trip that tells us every table, column and index we care about. */
async function readSchema(run: Runner): Promise<SchemaSnapshot> {
  const names = [...TABLE_ORDER, ...Object.keys(APP_TABLES), ...Object.keys(APP_INDEXES)];
  const rows = await run(
    `SELECT 'column' AS kind, table_name::text AS name, column_name::text AS detail
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name::text = ANY($1::text[])
     UNION ALL
     SELECT 'index' AS kind, tablename::text AS name, indexname::text AS detail
       FROM pg_indexes
      WHERE schemaname = current_schema()
        AND tablename::text = ANY($1::text[])`,
    [names],
  );

  const columns = new Map<string, Set<string>>();
  const indexes = new Set<string>();
  for (const row of rows as Array<{ kind: string; name: string; detail: string }>) {
    if (row.kind === "index") {
      indexes.add(row.detail);
      continue;
    }
    if (!columns.has(row.name)) columns.set(row.name, new Set());
    columns.get(row.name)!.add(row.detail);
  }
  return { columns, indexes };
}

/** Index name out of a `CREATE [UNIQUE] INDEX IF NOT EXISTS "name" ...` statement. */
function indexNameOf(statement: string): string | null {
  return statement.match(/INDEX IF NOT EXISTS "([^"]+)"/i)?.[1] ?? null;
}

function isUpToDate({ columns, indexes }: SchemaSnapshot): boolean {
  if (!columns.has("profiles")) return false;

  for (const table of TABLE_ORDER) {
    const present = columns.get(table);
    if (!present) return false;
    for (const column of REQUIRED_COLUMNS[table]) {
      if (!present.has(column.name)) return false;
    }
  }

  for (const statement of INDEX_STATEMENTS) {
    const name = indexNameOf(statement);
    if (name && !indexes.has(name)) return false;
  }

  for (const table of Object.keys(APP_TABLES)) {
    if (!columns.has(table)) return false;
  }

  for (const [table, requiredColumns] of Object.entries(APP_REQUIRED_COLUMNS)) {
    const present = columnsSnapshot(requiredColumns, columns.get(table));
    if (!present) return false;
  }

  // Only demand indexes on tables this database actually has.
  for (const [table, statements] of Object.entries(APP_INDEXES)) {
    if (!columns.has(table)) continue;
    for (const statement of statements) {
      const name = indexNameOf(statement);
      if (name && !indexes.has(name)) return false;
    }
  }

  return true;
}

function columnsSnapshot(columns: ColumnSpec[], present: Set<string> | undefined): boolean {
  if (!present) return false;
  return columns.every((column) => present.has(column.name));
}

async function bootstrap(): Promise<void> {
  const url = getServerlessDbUrl();
  if (!url) throw new Error(describeMissingDbUrl());

  const run = neon(url) as unknown as Runner;
  const snapshot = await readSchema(run);
  if (isUpToDate(snapshot)) return;

  const found = snapshot.columns;
  console.log("[auth] Repairing database schema in Neon…");

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
    found.set("profiles", new Set());
  }

  for (const table of new Set([...Object.keys(APP_TABLES), ...Object.keys(APP_REQUIRED_COLUMNS)])) {
    const columns = found.get(table);
    if (!columns) {
      const statement = APP_TABLES[table];
      if (statement) await exec(run, statement);
      found.set(table, new Set(APP_REQUIRED_COLUMNS[table]?.map((column) => column.name) || []));
      continue;
    }

    for (const column of APP_REQUIRED_COLUMNS[table] || []) {
      if (columns.has(column.name)) continue;
      // Existing job rows make adding a new NOT NULL column unsafe without a
      // migration-specific backfill, so widen the patch and let the job query
      // surface a clear error rather than failing schema bootstrap entirely.
      const ddl = column.ddl.replace(/\s+not null/i, "").replace(/\s+primary key/i, "");
      await exec(run, `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS ${ddl}`);
      columns.add(column.name);
    }
  }

  for (const [table, statements] of Object.entries(APP_INDEXES)) {
    if (!found.has(table)) continue;
    for (const statement of statements) {
      try {
        await exec(run, statement);
      } catch (error: any) {
        console.warn(`[auth] Could not index ${table}:`, error?.message ?? error);
      }
    }
  }

  console.log("[auth] Database schema is ready.");
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
