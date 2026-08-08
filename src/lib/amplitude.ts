import { AmplitudeAI, AIConfig } from "@amplitude/ai";

type AiMessageOptions = Parameters<AmplitudeAI["trackAiMessage"]>[0];

const AMPLITUDE_AI_KEY =
  process.env.AMPLITUDE_AI_API_KEY ||
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ||
  "42fa9dfa0e18070bf773091bf6d7db9c";

// `AmplitudeAI` pulls in `@amplitude/analytics-node`, which cannot be resolved
// inside the Cloudflare Worker bundle and makes the constructor throw at module
// load. Create the client lazily and swallow failures so observability can
// never break the AI routes that import this module — telemetry is best-effort.
let client: AmplitudeAI | null | undefined;

function getAiClient(): AmplitudeAI | null {
  if (client !== undefined) return client;
  try {
    client = new AmplitudeAI({
      apiKey: AMPLITUDE_AI_KEY,
      config: new AIConfig({
        contentMode: "full",
        redactPii: true,
      }),
    });
  } catch (err) {
    console.warn("[amplitude] AI observability unavailable:", err instanceof Error ? err.message : err);
    client = null;
  }
  return client;
}

export const ai = {
  trackAiMessage(opts: AiMessageOptions): void {
    try {
      getAiClient()?.trackAiMessage(opts);
    } catch {
      // Best-effort telemetry: never fail the calling request.
    }
  },
};
