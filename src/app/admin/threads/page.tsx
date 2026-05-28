import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminThreadsTable } from "@/components/features/AdminThreadsTable";

export const dynamic = "force-dynamic";

export default async function AdminThreadsPage() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  // Fetch all requests/threads with student + professor name joined
  const { data: threads } = await supabase
    .from("requests")
    .select(`
      id,
      status,
      subject,
      created_at,
      updated_at,
      student:profiles!requests_student_id_fkey(id, first_name, last_name, email),
      professor:profiles!requests_professor_id_fkey(id, first_name, last_name, institution)
    `)
    .order("created_at", { ascending: false });

  const active = threads?.filter((t) => t.status === "active").length ?? 0;
  const closed = threads?.filter((t) => t.status === "closed").length ?? 0;
  const pending = threads?.filter((t) => t.status === "pending").length ?? 0;

  return (
    <AdminShell>
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
          <span style={{ width: "1.25rem", height: "1px", background: "rgba(15, 23, 42,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans, monospace)" }}>
            Activity Monitor
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.6rem, 4vw, 3.5rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Mentorship <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42,0.3)" }}>Threads</em>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "rgba(15, 23, 42,0.38)", fontWeight: 300, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.5rem" }}>
          Monitor all mentorship dialogues across the platform. Filter by status or participant to review activity.
        </p>
      </div>

      {/* Mini stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {[
          { label: "Active",  value: active,  color: "rgba(74,222,128,0.8)" },
          { label: "Pending", value: pending, color: "rgba(250,204,21,0.8)" },
          { label: "Closed",  value: closed,  color: "rgba(148,163,184,0.6)" },
          { label: "Total",   value: threads?.length ?? 0, color: "rgba(37, 99, 235,0.8)" },
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
            <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans, monospace)" }}>{label}</span>
          </div>
        ))}
      </div>

      <AdminThreadsTable threads={(threads ?? []) as any} />
    </AdminShell>
  );
}
