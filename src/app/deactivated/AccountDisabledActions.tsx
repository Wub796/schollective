"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

/**
 * The two things a disabled account can do: come back, or leave for good.
 *
 * Both call routes that decide for themselves who the caller is — the session is
 * the only identity either one accepts, so nothing here needs to be trusted.
 */
export function AccountDisabledActions() {
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    try {
      const res = await fetch("/api/auth/account/restore", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "Could not restore the account.");
        return;
      }
      toast.success("Welcome back. Your account is active again.");
      router.refresh();
      // Always /dashboard: it is the one entry point that knows where each role
      // belongs (a professor is sent on to /prof/dashboard, an admin to the
      // admin shell), so this does not have to guess from the status it got back.
      router.push("/dashboard");
    } catch {
      toast.error("Could not restore the account. Please try again.");
    } finally {
      setRestoring(false);
    }
  }

  async function handleSignOut() {
    // The sessions were revoked when the account was disabled, so this is
    // clearing the browser's stale cookie rather than a server-side sign-out.
    await authClient.signOut().catch(() => {});
    router.push("/login");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.85rem", width: "100%" }}>
      <Button
        onClick={handleRestore}
        disabled={restoring}
        size="md"
        icon={restoring ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
      >
        {restoring ? "Restoring…" : "Restore my account"}
      </Button>
      <button
        type="button"
        onClick={handleSignOut}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "transparent",
          border: "none",
          padding: "0.25rem",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "rgba(15, 23, 42, 0.45)",
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
        }}
      >
        <LogOut size={12} />
        Sign out
      </button>
    </div>
  );
}
