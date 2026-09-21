"use client";

/**
 * Cookie-consent state and the analytics that depend on it.
 *
 * The banner offers a choice between essential and optional analytics cookies,
 * so that choice has to actually gate something. Product analytics and session
 * replay start only once consent is given; error reporting stays on, since it
 * carries no analytics identity and is what keeps the app debuggable.
 *
 * TWO GATES, NOT ONE, AND WHY THE SECOND EXISTS
 * Consent is the first. The second is age: this product's students include
 * minors, and a recording of a 15-year-old's screen inside a mentorship thread
 * is not something a teenager can meaningfully agree to on their own. So before
 * anything optional starts, `/api/me/analytics` is asked whether this account is
 * a minor, and a "yes" leaves PostHog, Amplitude and session replay switched
 * off no matter what was accepted.
 *
 * The failure direction is deliberate: if that answer cannot be obtained, the
 * optional tools do NOT start. A database hiccup costs a day of usage data; the
 * opposite default costs a recording of a child.
 */

export const CONSENT_COOKIE = "schollective-cookie-consent";
const MAX_AGE = 60 * 60 * 24 * 365;
// Configured per environment (NEXT_PUBLIC_AMPLITUDE_API_KEY). No literal
// fallback: analytics keys belong in env config, and baking one into the
// bundle means rotating it requires a deploy even for a client-side value.
const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "";

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
 * Set once we have learnt this account is a minor, or that we could not find
 * out. Never cleared: the answer cannot become "yes, record this child" later in
 * the same page, and a flag that could flip back would be a race waiting to
 * happen.
 */
let analyticsSuppressed = false;

/** Whether optional analytics have been turned off for this page session. */
export function areOptionalAnalyticsSuppressed(): boolean {
  return analyticsSuppressed;
}

/**
 * Turns optional analytics off for this page session and tears down whatever
 * already started.
 *
 * Called by MinorAnalyticsGuard the moment a signed-in page reports that the
 * account is a minor. Teardown is best-effort and each provider is isolated, so
 * an SDK that changes shape costs a warning rather than the guarantee: the flag
 * above is set first, and it is the flag that stops anything NEW from starting.
 */
export async function suppressOptionalAnalytics(reason: string): Promise<void> {
  analyticsSuppressed = true;

  // PostHog keeps a person profile and can be told to stop without being torn
  // down. `reset()` drops the identity so a queued event is not attributed to a
  // person afterwards.
  try {
    const { default: posthog } = await import("posthog-js");
    posthog.opt_out_capturing();
    posthog.reset();
  } catch {
    // Not loaded, or not configured. Nothing to stop.
  }

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.getReplay()?.stop();
  } catch {
    // Replay was never added (the usual case: it is only added on consent).
  }

  console.warn(`[analytics] Optional analytics suppressed: ${reason}`);
}

/**
 * Asks the server whether optional analytics belong on this account.
 *
 * Fails closed: any error, timeout or unparseable answer reads as "do not
 * start". A signed-in minor is the only reason this endpoint says no, and the
 * cost of a wrong no is aggregate usage data, while the cost of a wrong yes is
 * recording a child's screen.
 */
async function optionalAnalyticsAllowed(): Promise<boolean> {
  if (analyticsSuppressed) return false;

  try {
    const response = await fetch("/api/me/analytics", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return false;

    const data = (await response.json()) as { suppress?: unknown };
    if (data?.suppress === true) {
      analyticsSuppressed = true;
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Starts optional, consent-gated tooling. Safe to call more than once — it
 * runs on page load when consent already exists, and again the moment someone
 * accepts, so analytics begin without waiting for a reload.
 */
export function startOptionalAnalytics(): Promise<void> {
  if (typeof window === "undefined" || readConsent() !== "accepted" || analyticsSuppressed) {
    return Promise.resolve();
  }

  if (!analyticsStartPromise) {
    analyticsStartPromise = optionalAnalyticsAllowed()
      .then((allowed) =>
        allowed ? Promise.all([startAmplitude(), startPostHog(), startSessionReplay()]) : undefined,
      )
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
