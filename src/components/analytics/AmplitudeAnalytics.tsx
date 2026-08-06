"use client";

import { useEffect, useRef } from "react";
import * as amplitude from "@amplitude/unified";

// Amplitude ingestion key — public by design; move to an env var when you set up environments.
const AMPLITUDE_API_KEY =
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || "42fa9dfa0e18070bf773091bf6d7db9c";

export function AmplitudeAnalytics() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!AMPLITUDE_API_KEY) {
      console.warn("Amplitude API key missing — analytics disabled");
      return;
    }

    // Initialize unified SDK with autocapture and session replay
    try {
      amplitude
        .initAll(AMPLITUDE_API_KEY, {
          analytics: {
            autocapture: true,
            logLevel: amplitude.Types.LogLevel.None,
            flushMaxRetries: 0,
          },
          sessionReplay: {
            sampleRate: 1,
          },
        })
        .then(() => {
          amplitude.track("Viewed Home Page", { prompt_version: "BA400.4" });
        })
        .catch(() => {
          // Gracefully silent if client ad blocker blocks analytics
        });
    } catch {
      // Gracefully silent if client ad blocker blocks analytics
    }
  }, []);

  return null;
}
