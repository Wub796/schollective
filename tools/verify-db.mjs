#!/usr/bin/env node
/**
 * The preflight for the database, run before a deploy and after a migration.
 *
 * Migrations here are applied by hand (there is no migration step in the deploy
 * pipeline), and a schema change that is only *declared* in a file looks exactly
 * like one that is applied: the app starts, the pages render, CI passes. The
 * cost of the difference is silent and specific. `profiles_delete` is the
 * example that produced this file — db/migrations/0010 replaces an admin-only
 * policy with `id = app_user_id() OR app_is_admin()`, and a database still
 * carrying the admin-only version deletes nothing when an account deletes
 * itself. Under FORCE ROW LEVEL SECURITY that is not an error: the DELETE
 * matches zero rows, reports success, and the endpoint answers `{success:true}`
 * while the profile (and the date of birth behind it) stays exactly where it
 * was. Nothing in the suite can see it, because nothing in the suite talks to
 * the database.
 *
 * So this reads the live catalogs and compares them with what the repository
 * says must be true: row-level security on and forced on the app's tables,
 * the policies that gate the sensitive ones, the trigger that guards role and
 * status changes, the indexes the runtime bootstrap creates, and the privileges
 * the app role needs. It is read-only — every statement is a SELECT against
 * pg_* / information_schema — and it never prints the connection string.
 *
 * `--offline` runs the other half of the same list against the repository
 * instead of a server: each invariant has to be declared by some file in
 * db/migrations (or by the bootstrap in src/lib/neon/schema.ts), so deleting the
 * migration that establishes one fails here rather than in production. That is
 * the mode CI can run.
 *
 * Lives in `tools/` rather than `scripts/`, which .gitignore reserves for local
 * utility scripts — a check that only exists on one machine checks nothing.
 *
 * Usage:
 *   npm run verify:db                                # checks the live database
 *   npm run verify:db -- --offline                   # repo only, no connection
 *   npm run verify:db -- --env-file=.env.production
 *   npm run verify:db -- --json                      # machine-readable
 *
 * Flags: `--offline`, `--no-env`, `--env-file=<path>` (repeatable), `--json`.
 * Exit code is 1 if anything is wrong, so this can gate a deploy.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const offline = hasFlag("offline");
const asJson = hasFlag("json");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Environment: the real process environment wins over any file, so
 * `DATABASE_URL=... npm run verify:db` checks a URL without editing anything.
 * Only the keys we do not already have are filled in.
 */
const envFiles = hasFlag("no-env")
  ? []
  : args.filter((arg) => arg.startsWith("--env-file=")).map((arg) => arg.slice("--env-file=".length));

const filesToLoad = hasFlag("no-env") || offline ? [] : envFiles.length > 0 ? envFiles : [".env.local", ".env.production"];

function loadEnvFile(path) {
  if (!existsSync(path)) return false;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, name, raw] = match;
    if (process.env[name]) continue;
    const value = raw.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
    if (value) process.env[name] = value;
  }
  return true;
}

const loaded = [];
for (const file of filesToLoad) {
  if (loadEnvFile(file)) loaded.push(file);
}

/**
 * The tables the app owns and whose rows belong to one account. Every one of
 * them must be FORCEd, because the app role owns them: without FORCE the owner
 * bypasses its own policies and one user's query can read another's rows.
 * `profiles_orphan_backup` is a maintenance artifact and `rate_limit_events`
 * deliberately carries no RLS (db/migrations/0005: rows are a bucket name and
 * an actor id, and the durable limiter reads them outside any user context).
 */
const FORCED_TABLES = [
  "ai_profile_review_jobs",
  "feedback_reports",
  "friendships",
  "messages",
  "notifications",
  "profiles",
  "request_members",
  "requests",
  "safety_report_evidence",
  "safety_reports",
  "thread_reads",
  "user_blocks",
  "youth_protection",
];

/** RLS is on, and deliberately not FORCEd: the auth stack must span users. */
const UNFORCED_TABLES = ["account", "rateLimit", "session", "user", "verification"];

/**
 * Policies whose *content* is load-bearing, as opposed to merely existing.
 * A policy that was replaced by an older migration still shows up in
 * pg_policies; only what it says distinguishes the two.
 */
const POLICY_CONTENT = [
  {
    id: "profiles_delete_names_the_owner",
    table: "profiles",
    policy: "profiles_delete",
    cmd: "DELETE",
    matches: /app_user_id\(\)/,
    declares: /DROP POLICY IF EXISTS profiles_delete[\s\S]{0,400}?FOR DELETE USING \(id = app_user_id\(\) OR app_is_admin\(\)\)/,
    why:
      "db/migrations/0010 replaces the admin-only version. Under FORCE ROW LEVEL SECURITY an admin-only profiles_delete makes self-service deletion match zero rows — the endpoint answers success and deletes nothing.",
  },
  {
    id: "youth_protection_owner_and_admin",
    table: "youth_protection",
    policy: "youth_protection_select_own",
    cmd: "SELECT",
    matches: /app_user_id\(\)[\s\S]*?app_is_admin\(\)/,
    declares: /CREATE POLICY youth_protection_select_own[\s\S]{0,300}?profile_id = app_user_id\(\)[\s\S]{0,80}?app_is_admin\(\)/,
    why:
      "This is the table of children's dates of birth. A missing or wider policy here is a breach, not an inconvenience (db/README.md, 0014).",
  },
  {
    id: "safety_reports_owner_and_admin",
    table: "safety_reports",
    policy: "safety_reports_select_own",
    cmd: "SELECT",
    matches: /app_user_id\(\)[\s\S]*?app_is_admin\(\)/,
    declares: /CREATE POLICY safety_reports_select_own[\s\S]{0,300}?reporter_id = app_user_id\(\)/,
    why: "A report names a person and quotes a thread. Its author and admins read it; nobody else does.",
  },
  {
    id: "safety_evidence_owner_and_admin",
    table: "safety_report_evidence",
    policy: "safety_report_evidence_select",
    cmd: "SELECT",
    matches: /app_is_admin\(\)/,
    declares: /CREATE POLICY safety_report_evidence_select[\s\S]{0,400}?app_is_admin\(\)/,
    why:
      "The copied messages are the one record that survives account deletion, so they must not be readable outside the queue.",
  },
  {
    id: "feedback_reports_author_and_admin",
    table: "feedback_reports",
    policy: "feedback_reports_select_own",
    cmd: "SELECT",
    matches: /app_user_id\(\)[\s\S]*?app_is_admin\(\)/,
    declares: /CREATE POLICY feedback_reports_select_own[\s\S]{0,300}?user_id = app_user_id\(\)/,
    why: "A report is free text about someone's experience and may name another student (db/README.md, 0013).",
  },
];

/** Functions and triggers whose behaviour a migration changed after it existed. */
const CODE_CONTENT = [
  {
    id: "guard_knows_the_disable_pair",
    probe: { kind: "function", name: "guard_profile_role_change" },
    matches: /status_before_deactivation/,
    declares: /CREATE OR REPLACE FUNCTION public\.guard_profile_role_change[\s\S]*?status_before_deactivation[\s\S]*?\$\$/,
    why:
      "db/migrations/0010's body is the current definition. Without it a professor who disables an approved account cannot restore it: deactivated -> approved is refused as self-approval.",
  },
  {
    id: "guard_trigger_covers_the_new_column",
    probe: { kind: "trigger", table: "profiles", name: "profiles_guard_role_change" },
    matches: /status_before_deactivation/,
    declares: /BEFORE UPDATE OF role, status, status_before_deactivation/,
    why: "A trigger that only fired on `status` would let status_before_deactivation be written on its own — the hole 0010 closes.",
  },
  {
    id: "profiles_select_stays_scoped",
    probe: { kind: "function", name: "app_user_id" },
    matches: /app\.user_id/,
    declares: /CREATE OR REPLACE FUNCTION public\.app_user_id\(\)[\s\S]{0,200}?current_setting\('app\.user_id'/,
    why: "Every policy that scopes a row to its owner reads this setting. If it stops reading app.user_id, every owner check silently becomes null.",
  },
];

/** Index names the runtime bootstrap promises (src/lib/neon/schema.ts, APP_INDEXES). */
function bootstrapIndexNames() {
  const source = readFileSync(join(ROOT, "src", "lib", "neon", "schema.ts"), "utf8");
  const names = [...source.matchAll(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS "([^"]+)"/g)].map((match) => match[1]);
  return [...new Set(names)];
}

/** Tables the bootstrap promises to create (APP_TABLES), for the offline mode. */
function bootstrapTableNames() {
  const source = readFileSync(join(ROOT, "src", "lib", "neon", "schema.ts"), "utf8");
  return [...new Set([...source.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((match) => match[1]))];
}

function migrationFiles() {
  const dir = join(ROOT, "db", "migrations");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }));
}

const problems = [];
const warnings = [];
const ok = [];

/**
 * A driver error can quote the URL it failed to reach, and that URL contains
 * the database password. Everything printed goes through this first.
 */
function redact(text) {
  return String(text).replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[connection string]");
}

// ── Offline: is every invariant still declared by a file in the repository? ──
if (offline) {
  const migrations = migrationFiles();

  const declaredBy = (pattern) => migrations.find((file) => pattern.test(file.text));

  for (const check of [...POLICY_CONTENT, ...CODE_CONTENT]) {
    const file = declaredBy(check.declares);
    if (file) ok.push(`${check.id}: declared by db/migrations/${file.name}`);
    else problems.push(`${check.id}: no migration declares it any more — ${check.why}`);
  }

  // The bootstrap is the only thing that creates an index the app depends on
  // for a fresh database, so its list has to still name the ones in 0014/0015.
  const indexNames = bootstrapIndexNames();
  if (indexNames.length === 0) {
    problems.push("src/lib/neon/schema.ts declares no indexes at all: APP_INDEXES has been emptied or renamed.");
  } else {
    ok.push(`APP_INDEXES declares ${indexNames.length} indexes (${indexNames.slice(0, 3).join(", ")}, …)`);
  }
  for (const promised of ["safety_reports_status_created_idx", "safety_report_evidence_report_idx", "safety_reports_reporter_idx"]) {
    if (indexNames.includes(promised)) ok.push(`APP_INDEXES declares ${promised}`);
    else problems.push(`APP_INDEXES no longer declares ${promised}, so a fresh database would not have it.`);
  }

  const tables = bootstrapTableNames();
  for (const table of ["youth_protection", "safety_reports", "safety_report_evidence", "feedback_reports"]) {
    if (tables.includes(table)) ok.push(`APP_TABLES declares ${table}`);
    else problems.push(`APP_TABLES no longer declares ${table}.`);
  }

  for (const file of migrations) {
    // Files before 0008 predate the rule, which exists because 0007's messages
    // reached production mis-encoded (db/README.md).
    if (Number(file.name.slice(0, 4)) < 8) continue;

    const nonAscii = [...file.text].filter((char) => char.charCodeAt(0) > 126 && char !== "\n" && char !== "\t");
    if (nonAscii.length > 0) {
      problems.push(
        `db/migrations/${file.name} contains ${nonAscii.length} non-ASCII character(s). Migrations from 0008 on are ASCII-only so a mis-encoded client cannot corrupt a message (db/README.md).`,
      );
    }
  }
}

// ── Online: does the live database match? ───────────────────────────────────
if (!offline) {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!url) {
    problems.push(
      "Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set, so there is nothing to check. " +
        "Run with --offline to check the repository instead.",
    );
  } else {
    let neon;
    let sql;
    try {
      ({ neon } = await import("@neondatabase/serverless"));
      sql = neon(url);
    } catch (error) {
      problems.push(`Could not load the Neon driver: ${redact(error instanceof Error ? error.message : error)}`);
    }

    if (sql) {
      try {
        const tables = await sql`
          SELECT c.relname AS name,
                 c.relrowsecurity AS rls,
                 c.relforcerowsecurity AS forced,
                 pg_get_userbyid(c.relowner) AS owner
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r'
           ORDER BY c.relname`;

        const roles = await sql`
          SELECT current_user AS role,
                 (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypassrls`;

        const byName = new Map(tables.map((row) => [String(row.name), row]));

        ok.push(
          `Connected as ${roles[0]?.role}${roles[0]?.bypassrls ? " (a BYPASSRLS role: policies are inert for it, so this checks the catalog, not the app's view)" : ""}`,
        );

        // 1. Every app table is present, RLS on, forced on.
        for (const name of FORCED_TABLES) {
          const row = byName.get(name);
          if (!row) {
            problems.push(`Table ${name} is missing. Apply the migration that creates it (db/migrations).`);
            continue;
          }
          if (!row.rls || !row.forced) {
            problems.push(
              `${name}: row-level security is ${row.rls ? "enabled" : "OFF"} and ${row.forced ? "forced" : "NOT FORCED"}. ` +
                `The app role owns it, so without FORCE every policy on it is inert for the app.`,
            );
            continue;
          }
          if (String(row.owner) !== "schollective_app") {
            warnings.push(`${name} is owned by ${row.owner}, not schollective_app — check the policies still apply to the app role.`);
          }
        }

        for (const name of UNFORCED_TABLES) {
          const row = byName.get(name);
          if (!row) {
            warnings.push(`Table ${name} is missing (expected from db/migrations/0001, 0005 or the bootstrap).`);
            continue;
          }
          if (!row.rls) problems.push(`${name}: row-level security is off. db/README.md documents which tables are an exception.`);
          if (row.forced) {
            warnings.push(
              `${name} is FORCEd now. The auth stack reads and writes it across users, so that would break signing in (db/README.md).`,
            );
          }
        }

        // 2. Nothing outside the documented exception list has been left
        //    unprotected — the failure mode 0013's README section names.
        const documented = new Set([...FORCED_TABLES, ...UNFORCED_TABLES, "profiles_orphan_backup", "rate_limit_events"]);
        for (const row of tables) {
          const name = String(row.name);
          if (documented.has(name)) continue;
          warnings.push(
            `${name} is not in this file's table list. If it holds user rows, it needs policies and FORCE; if it is deliberate, add it here.`,
          );
        }

        // 3. The policies whose content matters.
        const policies = await sql`
          SELECT tablename AS table, policyname AS policy, cmd, qual, with_check
            FROM pg_policies
           WHERE schemaname = 'public'`;

        const policyOf = (table, policy, cmd) =>
          policies.find((row) => row.table === table && row.policy === policy && row.cmd === cmd);

        for (const check of POLICY_CONTENT) {
          const row = policyOf(check.table, check.policy, check.cmd);
          if (!row) {
            problems.push(`${check.table}.${check.policy} (${check.cmd}) does not exist. ${check.why}`);
            continue;
          }
          const definition = row.qual ?? "";
          if (!check.matches.test(definition)) {
            problems.push(
              `${check.table}.${check.policy} does not say what the repository says it must: the live definition is ${JSON.stringify(definition.slice(0, 120))}. ${check.why}`,
            );
            continue;
          }
          ok.push(`${check.table}.${check.policy} is scoped.`);
        }

        // 4. Functions and triggers whose bodies were replaced by a migration.
        for (const check of CODE_CONTENT) {
          const [row] =
            check.probe.kind === "function"
              ? await sql`SELECT pg_get_functiondef(${check.probe.name}::regproc) AS definition`
              : await sql`
                  SELECT pg_get_triggerdef(t.oid) AS definition
                    FROM pg_trigger t
                   WHERE t.tgname = ${check.probe.name}
                     AND t.tgrelid = ${check.probe.table}::regclass`;

          if (!row?.definition) {
            problems.push(`${check.probe.name} is missing. ${check.why}`);
            continue;
          }
          if (!check.matches.test(String(row.definition))) {
            problems.push(`${check.probe.name} is an older definition than the repository's. ${check.why}`);
            continue;
          }
          ok.push(`${check.probe.name} is the current definition.`);
        }

        // 5. Indexes the bootstrap creates — a fresh database gets them from
        //    there, so a database that has been migrated by hand must too.
        const indexes = await sql`
          SELECT tablename AS table, indexname AS index FROM pg_indexes WHERE schemaname = 'public'`;
        const indexSet = new Set(indexes.map((row) => String(row.index)));

        for (const name of bootstrapIndexNames()) {
          if (indexSet.has(name)) ok.push(`index ${name} exists`);
          else problems.push(`index ${name} is declared by the bootstrap but missing live — run the migration that adds it.`);
        }

        // 6. Privileges. A table created by an owner that ran 0004/0006 before
        //    it existed does not inherit those grants.
        const privileges = ["SELECT", "INSERT", "UPDATE", "DELETE"];
        const missingGrants = new Set();
        for (const name of [...FORCED_TABLES, ...UNFORCED_TABLES]) {
          if (!byName.has(name)) continue;
          // quote_ident, because `rateLimit` is mixed case: an unquoted name
          // would be folded to lowercase and reported as a missing table.
          const rows = await sql`
            SELECT p.priv, has_table_privilege('schollective_app', quote_ident(${name}), p.priv) AS granted
              FROM unnest(${privileges}::text[]) AS p(priv)`;
          for (const row of rows) {
            if (!row.granted) missingGrants.add(`${name}: ${row.priv}`);
          }
        }
        if (missingGrants.size === 0) ok.push("schollective_app has SELECT/INSERT/UPDATE/DELETE on every app table");
        else for (const grant of missingGrants) problems.push(`schollective_app is missing ${grant}.`);
      } catch (error) {
        problems.push(
          `Could not read the schema: ${redact(error instanceof Error ? error.message : error)}. ` +
            `The connection string itself is never printed here — check it in .env.local.`,
        );
      }
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
if (asJson) {
  console.log(JSON.stringify({ offline, envFiles: loaded, ok, warnings, problems }, null, 2));
} else {
  console.log("");
  console.log(`Database check${offline ? " (offline: repository only)" : ""}`);
  console.log(loaded.length ? `Env files read: ${loaded.join(", ")}` : "Env files read: none");

  for (const line of ok) console.log(`  ✓ ${line}`);
  for (const line of warnings) console.log(`  ! ${line}`);
  for (const line of problems) console.log(`  ✗ ${line}`);

  console.log("");
}

if (problems.length > 0) {
  if (!asJson) {
    console.log(`${problems.length} problem${problems.length === 1 ? "" : "s"} between the repository and the database.`);
    if (!offline) {
      console.log("Migrations are applied by hand, in order, and several must be run by a BYPASSRLS role (neondb_owner):");
      console.log("  psql \"$DATABASE_URL\" -f db/migrations/<file>.sql");
      console.log("Re-running the earlier files does not re-apply a later one, and some of them replace objects the earlier files create.");
    }
  }
  process.exit(1);
}

if (!asJson) {
  console.log(
    offline
      ? "The repository still declares every database invariant this file checks."
      : "The database matches the repository.",
  );
}
