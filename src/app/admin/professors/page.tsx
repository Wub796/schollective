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
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
              Faculty Management
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Professor <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Roster</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#475569", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
            All professor applications and approved faculty. Revoke verification or suspend accounts directly from here.
          </p>
        </div>

        {/* Mini stats */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[
            { label: "Approved", value: approved,  bg: "rgba(99, 102, 241, 0.2)", border: "rgba(79, 70, 229, 0.3)", color: "#4f46e5" },
            { label: "Pending",  value: pending,   bg: "rgba(79, 70, 229, 0.25)", border: "rgba(79, 70, 229, 0.6)", color: "#0f172a" },
            { label: "Rejected", value: rejected,  bg: "rgba(15, 23, 42, 0.05)", border: "rgba(15, 23, 42, 0.15)", color: "#0f172a" },
          ].map(({ label, value, bg, border, color }) => (
            <div
              key={label}
              style={{
                padding: "1.25rem 1.75rem",
                border: `1px solid ${border}`,
                borderRadius: "14px",
                background: bg,
                display: "flex", alignItems: "center", gap: "1rem",
              }}
            >
              <span className="font-display" style={{ fontSize: "1.8rem", fontWeight: 900, color, letterSpacing: "-0.03em" }}>
                {value}
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-sans)", letterSpacing: "0.05em" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <AdminProfessorsTable professors={(professors ?? []) as any} />
      </div>
    </AdminShell>
  );
}
