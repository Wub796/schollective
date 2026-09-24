"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/**
 * Last-resort boundary for any segment without a closer one: the auth pages,
 * /messages, /deactivated. It sits directly under the root layout, so a throw
 * anywhere in a group that has its own boundary is still caught by that group
 * boundary instead — which is what keeps the signed-in shell on screen.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} scope="app" />;
}
