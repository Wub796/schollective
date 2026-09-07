import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

async function loadClient() {
  const tempFile = path.join(os.tmpdir(), `client_${Date.now()}_${Math.random().toString(36).substring(7)}.mjs`);
  await build({
    entryPoints: ["src/lib/ai/client.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: tempFile,
    logLevel: "silent",
    plugins: [
      {
        name: "test-stubs",
        setup(b) {
          b.onResolve({ filter: /^@google\/genai$/ }, (args) => ({
            path: args.path,
            namespace: "stub",
          }));
          b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            loader: "js",
            contents: `
              export class GoogleGenAI {
                constructor(opts) {
                  this.apiKey = opts?.apiKey;
                }
              }
            `,
          }));
        },
      },
    ],
  });

  const mod = await import(pathToFileURL(tempFile).href);
  try {
    fs.unlinkSync(tempFile);
  } catch {}
  return mod;
}

test("getAllGeminiApiKeys parses numbered keys GEMINI_API_KEY_2, GEMINI_API_KEY_3 and comma-separated lists", async () => {
  const oldPrimary = process.env.GEMINI_API_KEY;
  const oldKey2 = process.env.GEMINI_API_KEY_2;
  const oldKey3 = process.env.GEMINI_API_KEY_3;
  const oldBackup = process.env.GEMINI_API_KEY_BACKUP;

  try {
    process.env.GEMINI_API_KEY = "key1, key1-alt";
    process.env.GEMINI_API_KEY_2 = "key2";
    process.env.GEMINI_API_KEY_3 = "key3";
    process.env.GEMINI_API_KEY_BACKUP = "key4";

    const { getAllGeminiApiKeys } = await loadClient();
    const keys = getAllGeminiApiKeys();

    assert.deepEqual(keys.slice(0, 5), ["key1", "key1-alt", "key2", "key3", "key4"]);
  } finally {
    if (oldPrimary === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldPrimary;
    if (oldKey2 === undefined) delete process.env.GEMINI_API_KEY_2; else process.env.GEMINI_API_KEY_2 = oldKey2;
    if (oldKey3 === undefined) delete process.env.GEMINI_API_KEY_3; else process.env.GEMINI_API_KEY_3 = oldKey3;
    if (oldBackup === undefined) delete process.env.GEMINI_API_KEY_BACKUP; else process.env.GEMINI_API_KEY_BACKUP = oldBackup;
  }
});

test("isGeminiQuotaError identifies 429 and RESOURCE_EXHAUSTED errors", async () => {
  const { isGeminiQuotaError } = await loadClient();

  assert.equal(isGeminiQuotaError({ status: 429 }), true);
  assert.equal(isGeminiQuotaError({ code: 429 }), true);
  assert.equal(isGeminiQuotaError({ error: { status: "RESOURCE_EXHAUSTED" } }), true);
  assert.equal(isGeminiQuotaError(new Error("Quota exceeded for quota metric")), true);
  assert.equal(isGeminiQuotaError(new Error("Rate limit exceeded")), true);

  assert.equal(isGeminiQuotaError(new Error("Network timeout")), false);
  assert.equal(isGeminiQuotaError({ status: 400 }), false);
  assert.equal(isGeminiQuotaError(null), false);
});

test("executeWithGeminiFailover automatically fails over when Key #1 hits 429", async () => {
  const oldPrimary = process.env.GEMINI_API_KEY;
  const oldBackup = process.env.GEMINI_API_KEY_BACKUP;

  try {
    process.env.GEMINI_API_KEY = "failing-key";
    process.env.GEMINI_API_KEY_BACKUP = "working-backup-key";

    const { executeWithGeminiFailover } = await loadClient();

    const attemptedKeys = [];
    const result = await executeWithGeminiFailover(async (client, keyIndex) => {
      attemptedKeys.push(client.apiKey);
      if (client.apiKey === "failing-key") {
        const err = new Error("Resource has been exhausted (e.g. check quota).");
        err.status = 429;
        throw err;
      }
      return `success-with-${client.apiKey}`;
    });

    assert.equal(result, "success-with-working-backup-key");
    assert.deepEqual(attemptedKeys, ["failing-key", "working-backup-key"]);
  } finally {
    if (oldPrimary === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldPrimary;
    if (oldBackup === undefined) delete process.env.GEMINI_API_KEY_BACKUP; else process.env.GEMINI_API_KEY_BACKUP = oldBackup;
  }
});
