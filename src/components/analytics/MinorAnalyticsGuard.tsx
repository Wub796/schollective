"use client";

import { useEffect } from "react";
import { areOptionalAnalyticsSuppressed, suppressOptionalAnalytics } from "@/lib/consent";

/**
 * Stops optional analytics for an account that is under 18.
 *
 * Consent alone is not enough here. A cookie banner asks whoever is looking at
 * the screen, and the person looking at the screen is not always the person
 * whose data it is: this product's students include high-schoolers, and a
 * session replay of a 15-year-old reading a mentorship thread is not something
 * they can meaningfully agree to on their own behalf. So the signed-in layouts
 * render this as soon as they know, and it tears down whatever started.
 *
 * Rendered by the signed-in surfaces rather than the root layout, because the
 * answer needs the database and the root layout serves anonymous visitors whose
 * pages should not pay for a query they cannot use. `src/lib/consent.ts` also
 * asks `/api/me/analytics` before starting anything, which is what covers a page
 * that has not mounted this yet; the two are belt and braces, and the flag they
 * share is what makes the second one cheap.
 *
 * The honest limit: an event that fired before the first signed-in render — the
 * `identify` on the sign-in screen, for instance — has already been delivered.
 * The guarantee starts at the first page that knows, which is why the signup
 * form additionally declines to identify a student who said they are in high
 * school.
 */
export function MinorAnalyticsGuard({ isMinor }: { isMinor: boolean }) {
  useEffect(() => {
    if (!isMinor || areOptionalAnalyticsSuppressed()) return;
    void suppressOptionalAnalytics("signed-in account is under 18");
  }, [isMinor]);

  return null;
}
