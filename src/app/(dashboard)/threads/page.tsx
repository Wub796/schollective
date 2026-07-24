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
      <span style={{ width: "1rem", height: "2px", background: "#FFC20F", display: "block" }} />
      <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#141005", letterSpacing: "-0.025em" }}>
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
      messages ( content, created_at, read_at, sender_id )
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
      hasUnread: req.messages?.some((msg: any) => msg.sender_id !== user.id && !msg.read_at),
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
          <span style={{ width: "1.5rem", height: "2px", background: "#FFC20F", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#008CBB", fontFamily: "var(--font-sans, monospace)" }}>
            Student Portal
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#141005", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            {displayName}&apos;s{" "}
            <em style={{ fontStyle: "italic", color: "#008CBB", fontWeight: 300 }}>threads</em>
          </h1>
          <Link href="/professors" style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              border: "2px solid #008CBB", background: "#008CBB", borderRadius: "100px",
              fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em",
              textTransform: "uppercase", color: "#ffffff",
              fontFamily: "var(--font-sans)", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0, 140, 187, 0.2)",
              transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
            }}>
              <Search size={14} />
              Find a Mentor
            </div>
          </Link>
        </div>
        <p style={{ fontSize: "0.95rem", color: "#3b3527", opacity: 0.75, fontWeight: 400, maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          All your mentorship threads in one place — ongoing dialogues and completed sessions.
        </p>
      </header>

      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
        {[
          { value: processed.length, label: "Total Threads", sub: "Lifetime" },
          { value: ongoing.length,   label: "Ongoing",        sub: "Active + Pending" },
          { value: past.length,      label: "Completed",      sub: "Past Sessions" },
        ].map(({ value, label, sub }) => (
          <div key={label} style={{
            padding: "2.25rem 2.5rem",
            border: "1px solid rgba(161, 197, 209, 0.45)",
            borderRadius: "14px",
            background: "rgba(161, 197, 209, 0.12)",
            display: "flex", flexDirection: "column", gap: "0.5rem",
          }}>
            <span className="font-display" style={{ fontSize: "2.8rem", fontWeight: 900, color: "#141005", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {value}
            </span>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#141005", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>{label}</div>
            <div style={{
              display: "inline-block", fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#141005", background: "#FFC20F",
              padding: "0.25rem 0.75rem", borderRadius: "100px", width: "fit-content", marginTop: "0.5rem",
              fontFamily: "var(--font-sans, monospace)", border: "1px solid rgba(255, 194, 15, 0.6)"
            }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(161, 197, 209, 0.4)" }} />

      {/* ── Empty state (no threads at all) ── */}
      {processed.length === 0 && (
        <div style={{
          border: "1px dashed rgba(161, 197, 209, 0.6)", borderRadius: "16px",
          padding: "4rem 2rem", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
          background: "rgba(255, 255, 255, 0.7)",
        }}>
          <div style={{
            width: "3.5rem", height: "3.5rem", borderRadius: "50%",
            background: "rgba(255, 194, 15, 0.25)", border: "1px solid rgba(255, 194, 15, 0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={20} style={{ color: "#141005" }} />
          </div>
          <div>
            <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#141005", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
              No threads yet
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#3b3527", opacity: 0.75, maxWidth: "26rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
              Threads appear here once a professor accepts your mentorship request.
              Start by finding a mentor in the directory.
            </p>
          </div>
          <Link href="/professors" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "0.8rem 2rem", border: "2px solid #008CBB", background: "#008CBB",
              borderRadius: "100px", fontSize: "0.62rem", fontWeight: 800,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#ffffff", fontFamily: "var(--font-sans)", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0, 140, 187, 0.25)",
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
            <span style={{
              marginLeft: "auto", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "#141005", background: "rgba(255, 194, 15, 0.35)",
              padding: "0.3rem 0.8rem", borderRadius: "100px", fontFamily: "var(--font-sans, monospace)"
            }}>
              {ongoing.length} thread{ongoing.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {ongoing.map((req: any) => (
              <ThreadCard key={req.id} request={req} viewerRole="student" hasUnread={req.hasUnread} />
            ))}
          </div>
        </div>
      )}

      {/* ── Past threads ── */}
      {past.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "1rem", height: "2px", background: "#A1C5D1", display: "block" }} />
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#141005", opacity: 0.6, letterSpacing: "-0.025em" }}>
                Past Sessions
              </h2>
            </div>
            <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#3b3527", opacity: 0.5, fontFamily: "var(--font-sans, monospace)" }}>
              {past.length} completed
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem", opacity: 0.8 }}>
            {past.map((req: any) => (
              <ThreadCard key={req.id} request={req} viewerRole="student" hasUnread={req.hasUnread} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
