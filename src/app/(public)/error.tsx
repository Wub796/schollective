"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/**
 * Public pages are the ones an anonymous visitor and a search crawler see, so
 * this boundary keeps the site header and footer in place while the failed page
 * is retried — a visitor who hits a problem mid-browse stays on the site rather
 * than landing on a bare error screen.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} scope="public" />;
}
