"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/**
 * Sign-in, sign-up, verification and onboarding all live here, and they are the
 * pages a stranded user is least able to work around: if this segment throws
 * without a boundary of its own, the group's centred shell goes with it and the
 * only way forward is the browser's back button.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} scope="auth" />;
}
