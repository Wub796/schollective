"use client";

/**
 * Cookie-consent state and the analytics that depend on it.
 *
 * The banner offers a choice between essential and optional analytics cookies,
 * so that choice has to actually gate something. Product analytics and session
 * replay start only once consent is given; error reporting stays on, since it
 * carries no analytics identity and is what keeps the app debuggable.
 */

export const CONSENT_COOKIE = "schollective-cookie-consent";
const MAX_AGE = 60 * 60 * 24 * 365;
const AMPLITUDE_API_KEY =
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "42fa9dfa0e18070bf773091bf6d7db9c";

export type ConsentValue = "accepted" | "declined";

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;

  const consentCookie = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`));
  const value = consentCookie?.slice(CONSENT_COOKIE.length + 1);

  return value === "accepted" || value === "declined" ? value : null;
}

export function writeConsent(value: ConsentValue): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

let analyticsStartPromise: Promise<void> | null = null;

/**
 * Starts optional, consent-gated tooling. Safe to call more than once — it
 * runs on page load when consent already exists, and again the moment someone
 * accepts, so analytics begin without waiting for a reload.
 */
export function startOptionalAnalytics(): Promise<void> {
  if (typeof window === "undefined" || readConsent() !== "accepted") {
    return Promise.resolve();
  }

  if (!analyticsStartPromise) {
    analyticsStartPromise = Promise.all([
      startAmplitude(),
      startPostHog(),
      startSessionReplay(),
    ])
      .then(() => undefined)
      .catch((error) => {
        // A blocked analytics provider must never affect the application, and
        // clearing the promise lets a later accepted page retry initialization.
        analyticsStartPromise = null;
        console.warn(
          "[analytics] Optional analytics could not be started:",
          error instanceof Error ? error.message : error,
        );
      });
  }

  return analyticsStartPromise;
}

async function startAmplitude(): Promise<void> {
  if (!AMPLITUDE_API_KEY || readConsent() !== "accepted") return;

  try {
    const amplitude = await import("@amplitude/unified");
    if (readConsent() !== "accepted") return;

    await amplitude.initAll(AMPLITUDE_API_KEY, {
      analytics: {
        autocapture: true,
        logLevel: amplitude.Types.LogLevel.None,
        flushMaxRetries: 0,
      },
      sessionReplay: {
        sampleRate: 1,
      },
    });
    amplitude.track("Viewed Home Page", { prompt_version: "BA400.4" });
  } catch {
    // Gracefully silent if client-side analytics or an ad blocker fails.
  }
}

async function startPostHog(): Promise<void> {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token || readConsent() !== "accepted") return;

  try {
    const { default: posthog } = await import("posthog-js");
    if (readConsent() !== "accepted") return;

    posthog.init(token, {
      // Proxied through /ingest (see next.config.ts) so the request is
      // same-origin for both the CSP and ad blockers.
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
  } catch {
    // Gracefully silent if client-side analytics or an ad blocker fails.
  }
}

async function startSessionReplay(): Promise<void> {
  if (readConsent() !== "accepted") return;

  try {
    const Sentry = await import("@sentry/nextjs");
    if (readConsent() === "accepted") {
      Sentry.addIntegration(Sentry.replayIntegration());
    }
  } catch {
    // Replay is a nice-to-have; never let it break the page.
  }
}
