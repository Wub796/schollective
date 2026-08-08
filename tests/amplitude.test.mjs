// Executable contract for src/lib/amplitude.ts:
// The AI telemetry client must never break the AI routes that import it, even
// when `AmplitudeAI` cannot be constructed (the Cloudflare Worker failure mode
// where @amplitude/analytics-node is unresolvable). The module is bundled with
// a stub @amplitude/ai so the real constructor is never invoked.
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const stub = ({ throws }) => `
  export class AIConfig {
    constructor(opts) {
      this.opts = opts;
    }
  }
  export class AmplitudeAI {
    constructor() {
      globalThis.__amplitudeConstructs = (globalThis.__amplitudeConstructs || 0) + 1;
      if (${throws}) throw new Error("ConfigurationError: analytics-node unavailable");
      globalThis.__amplitudeClient = this;
      this.messages = [];
    }
    trackAiMessage(opts) {
      this.messages.push(opts);
    }
  }
`;

let nonce = 0;

async function loadAmplitude(clientThrows) {
  const result = await build({
    entryPoints: ["src/lib/amplitude.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "amplitude-stub",
        setup(build) {
          build.onResolve({ filter: /^@amplitude\/ai$/ }, () => ({
            path: "@amplitude/ai",
            namespace: "stub",
          }));
          build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            loader: "js",
            contents: stub({ throws: clientThrows }),
          }));
        },
      },
    ],
  });
  const code = result.outputFiles[0].text + `\n// nonce ${nonce++}`;
  // Unique data URL per call → fresh module instance (own client cache).
  return import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
}

const opts = { content: "x", sessionId: "s", model: "m", provider: "google", latencyMs: 1 };
const silentWarn = () => {
  const orig = console.warn;
  console.warn = () => {};
  return () => {
    console.warn = orig;
  };
};

test("importing the module never throws, even when the client constructor throws", async () => {
  const mod = await loadAmplitude(true);
  assert.equal(typeof mod.ai.trackAiMessage, "function");
});

test("the client is constructed lazily, not at import", async () => {
  globalThis.__amplitudeClient = undefined;
  await loadAmplitude(false);
  assert.equal(globalThis.__amplitudeClient, undefined);
});

test("trackAiMessage is a safe no-op when the client cannot be constructed", async () => {
  const restore = silentWarn();
  try {
    const mod = await loadAmplitude(true);
    assert.doesNotThrow(() => mod.ai.trackAiMessage(opts));
  } finally {
    restore();
  }
});

test("trackAiMessage forwards the exact message when the client is available", async () => {
  globalThis.__amplitudeClient = undefined;
  const mod = await loadAmplitude(false);
  mod.ai.trackAiMessage(opts);
  assert.equal(globalThis.__amplitudeClient.messages.length, 1);
  assert.equal(globalThis.__amplitudeClient.messages[0], opts);
});

test("a failed construction is cached so later calls do not retry it", async () => {
  const restore = silentWarn();
  try {
    globalThis.__amplitudeConstructs = 0;
    const mod = await loadAmplitude(true);
    mod.ai.trackAiMessage(opts);
    mod.ai.trackAiMessage(opts);
    assert.equal(globalThis.__amplitudeConstructs, 1);
  } finally {
    restore();
  }
});
