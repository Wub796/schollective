import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { AccountSecuritySettings } from "@/components/features/AccountSecuritySettings";

export const dynamic = "force-dynamic";

export default async function ProfPublicProfilePage() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect("/login");

  // Allow admins to preview as professor
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "professor";

  if (!isAdminPreviewing && profile.role !== "professor") redirect("/dashboard");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "800px", paddingBottom: "6rem" }}>
      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Faculty Security & <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>Preferences</em>
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0, opacity: 0.85 }}>
          Manage your password, account verification details, security settings, and UI preferences.
        </p>
      </header>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.15)" }} />

      {/* Account Security & Preferences Component */}
      <AccountSecuritySettings profile={profile} />
    </div>
  );
}
