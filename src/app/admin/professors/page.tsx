import React from "react";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { AdminShell } from "@/components/ui/AdminShell";
import { AdminProfessorsTable } from "@/components/features/AdminProfessorsTable";

export const dynamic = "force-dynamic";

/** `runAs` returns `any` by design, so the row shape is restated here. */
interface AdminProfessorRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  email: string | null;
  status: string | null;
  institution: string | null;
  expertise_fields: unknown;
  ai_score: number | null;
  ai_level: string | null;
  created_at: string;
}

export default async function AdminProfessorsPage() {
  const { session, user, profile } = await getCurrentUserAndProfile();
  if (!session) redirect("/login");

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "professor" ? "/prof/dashboard" : "/dashboard");
  }

  // Under the admin's identity: the scoped profiles_select policy (migration
  // 0006) only exposes non-approved professor rows via its admin branch.
  const professors = (await runAs(user.id, async () => sql`
    SELECT id, first_name, last_name, preferred_name, email, status, institution, expertise_fields, ai_score, ai_level, created_at
    FROM profiles
    WHERE role = 'professor'
    ORDER BY created_at DESC;
  `)) as AdminProfessorRow[];

  const getEffectiveStatus = (status: string | null) => {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";
    if (status === "suspended") return "suspended";
    return "pending";
  };

  const approved  = professors?.filter((p) => getEffectiveStatus(p.status) === "approved").length  ?? 0;
  const pending   = professors?.filter((p) => getEffectiveStatus(p.status) === "pending").length   ?? 0;
  const rejected  = professors?.filter((p) => getEffectiveStatus(p.status) === "rejected").length  ?? 0;
  const suspended = professors?.filter((p) => getEffectiveStatus(p.status) === "suspended").length ?? 0;

  return (
    <AdminShell>
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Professor <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>Roster</em>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", opacity: 0.75, fontWeight: 400, maxWidth: "38rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
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
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)", letterSpacing: "0.05em" }}>
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
