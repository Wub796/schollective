import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminUsersTable } from "@/components/features/AdminUsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // Use session client to verify the requester is an admin
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  // Use service-role client to read ALL profiles (bypasses RLS)
  const adminClient = createAdminClient();
  const { data: allUsers } = await adminClient
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, email, role, status, institution, created_at")
    .order("created_at", { ascending: false });


  return (
    <AdminShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1.5rem", height: "2px", background: "#FFC20F", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#008CBB", fontFamily: "var(--font-sans, monospace)" }}>
              User Management
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#141005", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Registered <em style={{ fontStyle: "italic", color: "#008CBB", fontWeight: 300 }}>Accounts</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#3b3527", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
            Browse, search, and manage every account on the Schollective platform. Suspend or reactivate users as needed.
          </p>
        </div>

        <AdminUsersTable users={(allUsers ?? []) as any} />
      </div>
    </AdminShell>
  );
}
