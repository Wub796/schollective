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
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <span style={{ width: "1.25rem", height: "1px", background: "rgba(250,250,249,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(250,250,249,0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            User Management
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.6rem, 4vw, 3.5rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Registered <em style={{ fontStyle: "italic", color: "rgba(250,250,249,0.3)" }}>Accounts</em>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "rgba(250,250,249,0.38)", fontWeight: 300, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.5rem" }}>
          Browse, search, and manage every account on the Schollective platform. Suspend or reactivate users as needed.
        </p>
      </div>

      <AdminUsersTable users={(allUsers ?? []) as any} />
    </AdminShell>
  );
}
