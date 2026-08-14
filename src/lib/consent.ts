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

export type ConsentValue = "accepted" | "declined";

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
  return value === "accepted" || value === "declined" ? value : null;
}

export function writeConsent(value: ConsentValue): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

let started = false;

/**
 * Starts the optional, consent-gated tooling. Safe to call more than once —
 * it runs on page load when consent already exists, and again the moment
 * someone accepts, so analytics begin without waiting for a reload.
 */
export async function startOptionalAnalytics(): Promise<void> {
  if (started || typeof window === "undefined") return;
  started = true;

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (token) {
    const { default: posthog } = await import("posthog-js");
    posthog.init(token, {
      // Proxied through /ingest (see next.config.ts) so the request is
      // same-origin for both the CSP and ad blockers.
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.addIntegration(Sentry.replayIntegration());
  } catch {
    // Replay is a nice-to-have; never let it break the page.
  }
}
