import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

let cachedModule = null;

async function loadUtils() {
  if (cachedModule) return cachedModule;

  const tempFile = path.join(os.tmpdir(), `utils_${Date.now()}.mjs`);
  await build({
    entryPoints: ["src/lib/utils.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: tempFile,
    logLevel: "silent",
  });

  cachedModule = await import(pathToFileURL(tempFile).href);
  try {
    fs.unlinkSync(tempFile);
  } catch {}
  return cachedModule;
}

test("parseJsonbArray handles native arrays and filters non-strings", async () => {
  const { parseJsonbArray } = await loadUtils();

  assert.deepEqual(parseJsonbArray(["Robotics", "AI"]), ["Robotics", "AI"]);
  assert.deepEqual(parseJsonbArray(["Robotics", 123, null, "AI"]), ["Robotics", "AI"]);
  assert.deepEqual(parseJsonbArray([]), []);
});

test("parseJsonbArray parses valid JSON string arrays", async () => {
  const { parseJsonbArray } = await loadUtils();

  assert.deepEqual(parseJsonbArray('["Machine Learning", "NLP"]'), ["Machine Learning", "NLP"]);
  assert.deepEqual(parseJsonbArray('["Bioinformatics", 456, "Genomics"]'), ["Bioinformatics", "Genomics"]);
  assert.deepEqual(parseJsonbArray('[]'), []);
});

test("parseJsonbArray handles single string and JSON-quoted strings safely", async () => {
  const { parseJsonbArray } = await loadUtils();

  // Quoted JSON string
  assert.deepEqual(parseJsonbArray('"Quantum Computing"'), ["Quantum Computing"]);
  // Plain string (JSON.parse throws SyntaxError, falls back to [value])
  assert.deepEqual(parseJsonbArray("Distributed Systems"), ["Distributed Systems"]);
});

test("parseJsonbArray handles non-string, null, undefined, and non-array JSON without throwing", async () => {
  const { parseJsonbArray } = await loadUtils();

  assert.deepEqual(parseJsonbArray(null), []);
  assert.deepEqual(parseJsonbArray(undefined), []);
  assert.deepEqual(parseJsonbArray(123), []);
  assert.deepEqual(parseJsonbArray({}), []);
  assert.deepEqual(parseJsonbArray(""), []);
  assert.deepEqual(parseJsonbArray("   "), []);
  // Non-array JSON values
  assert.deepEqual(parseJsonbArray('{"field": "Computer Science"}'), []);
  assert.deepEqual(parseJsonbArray('123'), []);
  assert.deepEqual(parseJsonbArray('true'), []);
  assert.deepEqual(parseJsonbArray('null'), []);
  // Malformed JSON arrays or objects return empty array safely
  assert.deepEqual(parseJsonbArray('[broken json'), []);
  assert.deepEqual(parseJsonbArray('["unclosed string'), []);
  assert.deepEqual(parseJsonbArray('{invalid'), []);
});
