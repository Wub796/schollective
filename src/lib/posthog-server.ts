import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return null;
  client ??= new PostHog(apiKey, {
    host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const posthog = getClient();
  if (!posthog) return;

  try {
    posthog.capture({ distinctId, event, properties });
    await posthog.flush();
  } catch (error) {
    console.error("[posthog] server capture failed:", error);
  }
}
