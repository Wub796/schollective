import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminProfessorsTable } from "@/components/features/AdminProfessorsTable";

export const dynamic = "force-dynamic";

export default async function AdminProfessorsPage() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  const { data: professors } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, email, status, institution, expertise_fields, ai_score, ai_level, created_at")
    .eq("role", "professor")
    .order("created_at", { ascending: false });

  const approved  = professors?.filter((p) => p.status === "approved").length ?? 0;
  const pending   = professors?.filter((p) => p.status === "pending").length  ?? 0;
  const rejected  = professors?.filter((p) => p.status === "rejected").length ?? 0;

  return (
    <AdminShell>
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <span style={{ width: "1.25rem", height: "1px", background: "rgba(250,250,249,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(250,250,249,0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Faculty Management
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.6rem, 4vw, 3.5rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Professor <em style={{ fontStyle: "italic", color: "rgba(250,250,249,0.3)" }}>Roster</em>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "rgba(250,250,249,0.38)", fontWeight: 300, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.5rem" }}>
          All professor applications and approved faculty. Revoke verification or suspend accounts directly from here.
        </p>
      </div>

      {/* Mini stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { label: "Approved", value: approved,  color: "rgba(74,222,128,0.8)" },
          { label: "Pending",  value: pending,   color: "rgba(250,204,21,0.8)" },
          { label: "Rejected", value: rejected,  color: "rgba(248,113,113,0.8)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              padding: "0.9rem 1.4rem",
              border: `1px solid ${color}22`,
              borderRadius: "12px",
              background: `${color}08`,
              display: "flex", flexDirection: "column", gap: "0.2rem",
            }}
          >
            <span className="font-display" style={{ fontSize: "2.4rem", fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,250,249,0.3)", fontFamily: "var(--font-mono, monospace)" }}>{label}</span>
          </div>
        ))}
      </div>

      <AdminProfessorsTable professors={(professors ?? []) as any} />
    </AdminShell>
  );
}
