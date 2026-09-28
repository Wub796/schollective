import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { AdminShell } from "@/components/ui/AdminShell";
import { AccountSecuritySettings } from "@/components/features/AccountSecuritySettings";

export const dynamic = "force-dynamic";

/**
 * The admin's own account settings.
 *
 * This page exists because the Settings entry used to link to `/profile`, the
 * student settings URL. That route lives in the `(dashboard)` group, so it
 * rendered inside AppShell — which resolves a non-professor to the student
 * navigation — and an admin who opened it left the admin shell for a student
 * one. Settings belongs to the surface it is reached from, so it gets its own
 * route under `/admin` and the AdminShell around it.
 *
 * The panel itself is the same one students and faculty get: password, cursor
 * preference, feedback and the two ways to leave the platform. It is already
 * role-aware and labels the account "Admin".
 */
export default async function AdminSettingsPage() {
  const { session, profile } = await getCurrentUserAndProfile();
  if (!session) redirect("/login");

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  return (
    <AdminShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "800px", paddingBottom: "6rem" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Admin Security & <em style={{ color: "var(--accent)" }}>Preferences</em>
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0, opacity: 0.85 }}>
            Manage the password and interface preferences on this operator account. Account changes here affect only you, never the platform.
          </p>
        </header>

        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.15)" }} />

        <AccountSecuritySettings profile={profile} />
      </div>
    </AdminShell>
  );
}
