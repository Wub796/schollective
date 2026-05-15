import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ThreadCard } from "@/components/features/ThreadCard";
import { BookOpen, Search } from "lucide-react";

export const dynamic = "force-dynamic";

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
      <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.85)", letterSpacing: "-0.02em" }}>
        {text}
      </h2>
    </div>
  );
}

export default async function ThreadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preferred_name, first_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/prof/dashboard");

  // Allow admins to preview as student
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "student";

  if (!isAdminPreviewing && profile.role !== "student") redirect("/prof/dashboard");

  const { data: requests } = await supabase
    .from("requests")
    .select(`
      id, status, topic, updated_at,
      professor:professor_id ( first_name, last_name, preferred_name, expertise ),
      messages ( content, created_at )
    `)
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  const processed = (requests || []).map((req: any) => {
    const prof = Array.isArray(req.professor) ? req.professor[0] : req.professor;
    return {
      ...req,
      participant: {
        first_name: prof?.first_name ?? "Unknown",
        last_name: prof?.last_name ?? null,
        preferred_name: prof?.preferred_name ?? null,
        detail: prof?.expertise ?? "Professor",
      },
      latest_message:
        req.messages?.length > 0
          ? [...req.messages].sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          : undefined,
    };
  });

  const ongoing = processed.filter((r: any) => r.status !== "closed");
  const past    = processed.filter((r: any) => r.status === "closed");
  const displayName = profile.preferred_name || profile.first_name || "Scholar";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Student Portal
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
            {displayName}&apos;s{" "}
            <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.35)" }}>threads</em>
          </h1>
          <Link href="/professors" style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.65rem 1.35rem",
              border: "1px solid rgba(250, 250, 249, 0.12)", borderRadius: "100px",
              fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.24em",
              textTransform: "uppercase", color: "rgba(250, 250, 249, 0.55)",
              fontFamily: "var(--font-sans)", cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}>
              <Search size={11} />
              Find a Mentor
            </div>
          </Link>
        </div>
        <p style={{ fontSize: "0.9rem", color: "rgba(250, 250, 249, 0.4)", fontWeight: 300, maxWidth: "42rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          All your mentorship threads in one place — ongoing dialogues and completed sessions.
        </p>
      </header>

      {/* ── Stats strip ── */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        {[
          { value: processed.length, label: "Total Threads", sub: "Lifetime" },
          { value: ongoing.length,   label: "Ongoing",        sub: "Active + Pending" },
          { value: past.length,      label: "Completed",      sub: "Past Sessions" },
        ].map(({ value, label, sub }) => (
          <div key={label} style={{
            padding: "1.25rem 1.75rem",
            border: "1px solid rgba(129, 140, 248, 0.08)",
            borderRadius: "14px",
            background: "rgba(129, 140, 248, 0.03)",
            display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: "9rem",
          }}>
            <span className="font-display" style={{ fontSize: "2rem", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {value}
            </span>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(250, 250, 249, 0.6)", fontFamily: "var(--font-sans)" }}>{label}</div>
            <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.3)", fontFamily: "var(--font-mono, monospace)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)" }} />

      {/* ── Empty state (no threads at all) ── */}
      {processed.length === 0 && (
        <div style={{
          border: "1px dashed rgba(250, 250, 249, 0.08)", borderRadius: "16px",
          padding: "5rem 2rem", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem",
        }}>
          <div style={{
            width: "3.5rem", height: "3.5rem", borderRadius: "50%",
            background: "rgba(250, 250, 249, 0.04)", border: "1px solid rgba(250, 250, 249, 0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={20} color="rgba(250, 250, 249, 0.3)" />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.7)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              No threads yet
            </h3>
            <p style={{ fontSize: "0.82rem", color: "rgba(250, 250, 249, 0.32)", maxWidth: "26rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
              Threads appear here once a professor accepts your mentorship request.
              Start by finding a mentor in the directory.
            </p>
          </div>
          <Link href="/professors" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "0.8rem 1.85rem", border: "1px solid rgba(250, 250, 249, 0.15)",
              borderRadius: "100px", fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(250, 250, 249, 0.7)", fontFamily: "var(--font-sans)", cursor: "pointer",
            }}>
              Browse Professors
            </div>
          </Link>
        </div>
      )}

      {/* ── Ongoing threads ── */}
      {ongoing.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <SectionLabel text="Ongoing" />
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.25)", fontFamily: "var(--font-mono, monospace)" }}>
              {ongoing.length} thread{ongoing.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {ongoing.map((req: any) => (
              <ThreadCard key={req.id} request={req} viewerRole="student" />
            ))}
          </div>
        </div>
      )}

      {/* ── Past threads ── */}
      {past.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.45)", letterSpacing: "-0.02em" }}>
                Past Sessions
              </h2>
            </div>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.15)", fontFamily: "var(--font-mono, monospace)" }}>
              {past.length} completed
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem", opacity: 0.75 }}>
            {past.map((req: any) => (
              <ThreadCard key={req.id} request={req} viewerRole="student" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
