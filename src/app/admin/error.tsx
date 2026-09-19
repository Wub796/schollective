"use client";

import { ErrorState } from "@/components/ui/ErrorState";

/**
 * The moderation screens are the least-exercised and the most destructive place
 * to lose the shell: an admin is usually midway through a queue. Keeping the
 * admin navigation mounted means a single failed panel does not strand them
 * outside the tooling they were in the middle of.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} scope="admin" />;
}
