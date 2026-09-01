/**
 * Client instrumentation, loaded by Next.js on every page.
 *
 * Next resolves `src/instrumentation-client` ahead of a root-level file and
 * loads only the first match, so everything client-side starts here. PostHog
 * previously lived in a root-level file that was never loaded, which meant
 * every capture() call in the app was silently discarded.
 */
import * as Sentry from "@sentry/nextjs";
import { readConsent, startOptionalAnalytics } from "@/lib/consent";

// Error reporting runs for everyone: it carries no analytics identity and is
// what makes a failure in front of a beta tester diagnosable. Session replay
// is added by startOptionalAnalytics() only after consent.
Sentry.init({
  dsn: "https://ea8c26bfcedaa4ebcdbb726dd3a9b1f5@o4512008580825088.ingest.us.sentry.io/4512008591441920",
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

if (readConsent() === "accepted") {
  void startOptionalAnalytics();
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
