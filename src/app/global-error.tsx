"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/**
 * Catches a failure in the root layout itself, which is why this is the one
 * error surface that has to render its own <html> and <body>: the root layout,
 * and therefore `globals.css`, did not run.
 *
 * `ErrorState` writes every colour as `var(--token, literal)`, so it renders in
 * the app's ink-on-paper palette here even with no stylesheet loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ErrorState error={error} reset={reset} scope="root-layout" />
      </body>
    </html>
  );
}
