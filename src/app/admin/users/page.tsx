import React from "react";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminUsersTable } from "@/components/features/AdminUsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session) redirect("/login");

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  // Runs under the admin's identity so the scoped profiles_select policy
  // (migration 0006) resolves its admin branch; bare, this would return nothing.
  const allUsers = await runAs(user.id, async () => sql`
    SELECT id, first_name, last_name, preferred_name, email, role, status, institution, created_at
    FROM profiles
    ORDER BY created_at DESC;
  `);


  return (
    <AdminShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Registered <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>Accounts</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
            Browse, search, and manage every account on the Schollective platform. Suspend or reactivate users as needed.
          </p>
        </div>

        <AdminUsersTable users={(allUsers ?? []) as any} />
      </div>
    </AdminShell>
  );
}
