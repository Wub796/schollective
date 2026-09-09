"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
        <AlertTriangle size={26} />
      </div>
      <h1 className="mt-6 text-2xl font-black text-slate-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        This page hit an error. A new version may have shipped while your tab was
        open. Reload the page to get the latest version and continue.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          size="sm"
          icon={<RefreshCw size={15} />}
          onClick={() => window.location.reload()}
        >
          Reload page
        </Button>
        <Button variant="outline" size="sm" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
