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
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
              Activity Monitor
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Mentorship <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Threads</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#475569", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
            Monitor all mentorship dialogues across the platform. Filter by status or participant to review activity.
          </p>
        </div>

        {/* Mini stats */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[
            { label: "Active",  value: active,  bg: "rgba(99, 102, 241, 0.2)", border: "rgba(79, 70, 229, 0.3)", color: "#4f46e5" },
            { label: "Pending", value: pending, bg: "rgba(79, 70, 229, 0.25)", border: "rgba(79, 70, 229, 0.6)", color: "#0f172a" },
            { label: "Closed",  value: closed,  bg: "rgba(15, 23, 42, 0.05)", border: "rgba(15, 23, 42, 0.15)", color: "#0f172a" },
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

        <AdminThreadsTable threads={(threads ?? []) as any} />
      </div>
    </AdminShell>
  );
}
