import React from "react";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminUsersTable } from "@/components/features/AdminUsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { session, profile } = await getCurrentUserAndProfile();
  if (!session) redirect("/login");

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  const allUsers = await sql`
    SELECT id, first_name, last_name, preferred_name, email, role, status, institution, created_at
    FROM profiles
    ORDER BY created_at DESC;
  `;


  return (
    <AdminShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
              User Management
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Registered <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Accounts</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#475569", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
            Browse, search, and manage every account on the Schollective platform. Suspend or reactivate users as needed.
          </p>
        </div>

        <AdminUsersTable users={(allUsers ?? []) as any} />
      </div>
    </AdminShell>
  );
}
