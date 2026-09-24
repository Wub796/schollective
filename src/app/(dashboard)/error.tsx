"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/**
 * This boundary sits *inside* the dashboard layout, so when a page throws the
 * navigation, sidebar and session stay rendered and only the page body is
 * replaced. That matters more here than anywhere else: a throw in this segment
 * used to take the whole frame with it, leaving no way back into the app except
 * the browser's back button.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} scope="dashboard" />;
}
