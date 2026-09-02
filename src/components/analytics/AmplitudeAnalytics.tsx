"use client";

import { useEffect } from "react";
import { readConsent, startOptionalAnalytics } from "@/lib/consent";

/**
 * Boots optional analytics only after the visitor has consented. The shared
 * starter is also called by the consent banner and client instrumentation, so
 * repeated calls are intentionally safe.
 */
export function AmplitudeAnalytics() {
  useEffect(() => {
    if (readConsent() === "accepted") {
      void startOptionalAnalytics();
    }
  }, []);

  return null;
}
