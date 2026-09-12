/**
 * Keeps `ProfileRecord` honest about the `profiles` table.
 *
 * The TypeScript interface in src/lib/neon/profiles.ts is hand-maintained against
 * the DDL in src/lib/neon/schema.ts. Nothing connected the two, so they could
 * drift silently in the direction that hurts most: a nullable column typed
 * non-null typechecks perfectly and then throws at runtime the first time the
 * column is actually null — for a profile field that is optional in the UI, that
 * is most rows.
 *
 * This reads both files as text and compares them. It is not a substitute for
 * generating the types from the schema, which is the real fix; it is the guard
 * that makes the drift visible in the meantime, and it costs nothing to run.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = join(here, "..", "src", "lib", "neon", "schema.ts");
const PROFILES_FILE = join(here, "..", "src", "lib", "neon", "profiles.ts");

/** Pulls the column definitions out of a `CREATE TABLE <name> (...)` literal. */
function parseDdlColumns(source, tableName) {
  const start = source.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName} (`);
  assert.notEqual(start, -1, `could not find the CREATE TABLE for ${tableName}`);

  const open = source.indexOf("(", start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  assert.notEqual(end, -1, "unbalanced parentheses in the DDL");

  const body = source.slice(open + 1, end);

  // Split on top-level commas only, so `numeric(10, 2)` stays intact.
  const parts = [];
  let buf = "";
  let d = 0;
  for (const ch of body) {
    if (ch === "(") d++;
    if (ch === ")") d--;
    if (ch === "," && d === 0) { parts.push(buf); buf = ""; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);

  const columns = new Map();
  for (const raw of parts) {
    const line = raw.trim();
    if (!line) continue;
    // Skip table-level constraints.
    if (/^(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT)\b/i.test(line)) continue;

    const m = line.match(/^"?([a-z_][a-z0-9_]*)"?\s+(.+)$/is);
    if (!m) continue;
    const [, name, rest] = m;
    columns.set(name, {
      definition: rest.replace(/\s+/g, " ").trim(),
      notNull: /\bNOT NULL\b/i.test(rest),
      hasDefault: /\bDEFAULT\b/i.test(rest),
      isPrimaryKey: /\bPRIMARY KEY\b/i.test(rest),
    });
  }
  return columns;
}

/** Pulls the field declarations out of an exported interface. */
function parseInterfaceFields(source, interfaceName) {
  const start = source.indexOf(`export interface ${interfaceName} {`);
  assert.notEqual(start, -1, `could not find interface ${interfaceName}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const body = source.slice(open + 1, end);

  const fields = new Map();
  // Strip comments so a `?` or `|` inside prose is not mistaken for syntax.
  const cleaned = body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  let buf = "";
  let d = 0;
  const statements = [];
  for (const ch of cleaned) {
    if ("{([".includes(ch)) d++;
    if ("})]".includes(ch)) d--;
    if (ch === ";" && d === 0) { statements.push(buf); buf = ""; continue; }
    buf += ch;
  }
  if (buf.trim()) statements.push(buf);

  for (const raw of statements) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([a-z_][a-z0-9_]*)(\?)?\s*:\s*([\s\S]+)$/i);
    if (!m) continue;
    const [, name, optional, type] = m;
    fields.set(name, {
      optional: Boolean(optional),
      type: type.replace(/\s+/g, " ").trim(),
      nullable: /\bnull\b/.test(type),
    });
  }
  return fields;
}

const schemaSource = readFileSync(SCHEMA_FILE, "utf8");
const profilesSource = readFileSync(PROFILES_FILE, "utf8");

const ddl = parseDdlColumns(schemaSource, "profiles");
const iface = parseInterfaceFields(profilesSource, "ProfileRecord");

test("both sides parsed", () => {
  assert.ok(ddl.size > 20, `only parsed ${ddl.size} DDL columns`);
  assert.ok(iface.size > 20, `only parsed ${iface.size} interface fields`);
  assert.ok(ddl.has("id") && ddl.has("email") && ddl.has("role"));
  assert.ok(iface.has("id") && iface.has("email") && iface.has("role"));
});

test("every profiles column exists on ProfileRecord", () => {
  const missing = [...ddl.keys()].filter((col) => !iface.has(col));
  assert.deepEqual(
    missing,
    [],
    `these columns exist in the profiles DDL but not on ProfileRecord, so reads silently drop them:\n  ${missing.join("\n  ")}`,
  );
});

test("ProfileRecord declares no field the table does not have", () => {
  const phantom = [...iface.keys()].filter((field) => !ddl.has(field));
  assert.deepEqual(
    phantom,
    [],
    `these fields are on ProfileRecord but are not columns, so writing them would be a silent no-op (or an error):\n  ${phantom.join("\n  ")}`,
  );
});

test("every nullable column is optional or nullable in TypeScript", () => {
  // The failure mode this exists for: `institution: string` on a column that can
  // be null typechecks fine and then crashes on `.toLowerCase()` for any profile
  // that left the field blank.
  const problems = [];
  for (const [name, col] of ddl) {
    if (col.notNull || col.isPrimaryKey) continue;
    const field = iface.get(name);
    if (!field) continue; // reported by the test above
    if (!field.optional && !field.nullable) {
      problems.push(`${name}: column is nullable, but typed as \`${field.type}\``);
    }
  }
  assert.deepEqual(problems, [], `nullable columns typed as non-null:\n  ${problems.join("\n  ")}`);
});

test("NOT NULL columns without a default are required in TypeScript", () => {
  // The mirror image: typing a guaranteed column as optional forces every call
  // site into a pointless `?? ""` and hides real missing-data bugs.
  const problems = [];
  for (const [name, col] of ddl) {
    if (!col.notNull && !col.isPrimaryKey) continue;
    if (col.hasDefault) continue; // the DB fills it in, so a writer may omit it
    const field = iface.get(name);
    if (!field) continue;
    if (field.optional || field.nullable) {
      problems.push(`${name}: column is NOT NULL with no default, but typed as \`${field.optional ? "optional " : ""}${field.type}\``);
    }
  }
  assert.deepEqual(problems, [], `guaranteed columns typed as optional:\n  ${problems.join("\n  ")}`);
});

test("jsonb columns are not typed as plain strings", () => {
  // The Neon HTTP driver may hand back jsonb already parsed or still as text
  // depending on the query, which is why parseJsonbArray exists. A `string` type
  // here would paper over that and break the first time it arrives parsed.
  const problems = [];
  for (const [name, col] of ddl) {
    if (!/\bjsonb\b/i.test(col.definition)) continue;
    const field = iface.get(name);
    if (!field) continue;
    if (/^string(\s*\|\s*null)?$/.test(field.type)) {
      problems.push(`${name}: jsonb column typed as \`${field.type}\``);
    }
  }
  assert.deepEqual(problems, [], `jsonb columns typed as string:\n  ${problems.join("\n  ")}`);
});
