import React from "react";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminThreadsTable } from "@/components/features/AdminThreadsTable";

export const dynamic = "force-dynamic";

export default async function AdminThreadsPage() {
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session) redirect("/login");

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  // The admin branch of the RLS policy still requires the admin's database
  // identity to be set — a bare query sees no rows at all.
  const threads = await runAs(user.id, async () => sql`
    SELECT 
      r.id,
      r.status,
      r.topic as subject,
      r.created_at,
      r.updated_at,
      json_build_object('id', s.id, 'first_name', s.first_name, 'last_name', s.last_name, 'email', s.email) as student,
      json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'institution', p.institution) as professor
    FROM requests r
    LEFT JOIN profiles s ON r.student_id = s.id
    LEFT JOIN profiles p ON r.professor_id = p.id
    ORDER BY r.created_at DESC;
  `);

  const active = threads?.filter((t: any) => t.status === "active").length ?? 0;
  const closed = threads?.filter((t: any) => t.status === "closed").length ?? 0;
  const pending = threads?.filter((t: any) => t.status === "pending").length ?? 0;

  return (
    <AdminShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Mentorship <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>Threads</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
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
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)", letterSpacing: "0.05em" }}>
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
