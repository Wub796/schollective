import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ThreadCard } from "@/components/features/ThreadCard";
import { PlusCircle, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "student") {
    redirect(profile.role === "admin" ? "/admin/dashboard" : "/prof/dashboard");
  }

  const displayName = profile.preferred_name || profile.first_name || "Scholar";

  const { data: requests } = await supabase
    .from("requests")
    .select(`
      id, status, topic, updated_at,
      professor:professor_id ( first_name, last_name, preferred_name, expertise ),
      messages ( content, created_at )
    `)
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  const processedRequests = (requests || []).map((req: any) => {
    const prof = Array.isArray(req.professor) ? req.professor[0] : req.professor;
    return {
      ...req,
      participant: {
        first_name: prof.first_name,
        last_name: prof.last_name,
        preferred_name: prof.preferred_name,
        detail: prof.expertise,
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

  return (
    <div style={{ padding: "3rem 0", display: "flex", flexDirection: "column", gap: "4rem" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
          <span style={{
            fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.38em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-mono, monospace)",
          }}>
            Student Portal
          </span>
        </div>

        {/* Headline + CTA row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{
            fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900,
            color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.05,
          }}>
            Welcome back,{" "}
            <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.35)" }}>{displayName}</em>
          </h1>

          <Link href="/professors" style={{ textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: "#fff", color: "#080c14",
              borderRadius: "100px",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.22em", textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}>
              <PlusCircle size={14} />
              New Request
            </div>
          </Link>
        </div>

        <p style={{
          fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", fontWeight: 300,
          maxWidth: "42rem", lineHeight: 1.7, fontFamily: "var(--font-sans)",
          marginTop: "0.25rem",
        }}>
          Track your mentorship requests and active research dialogues.
        </p>
      </header>

      {/* ── Hairline ───────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

      {/* ── Threads section ────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
            <h2 className="font-display" style={{
              fontSize: "1.3rem", fontWeight: 700, color: "rgba(255,255,255,0.85)",
              letterSpacing: "-0.02em",
            }}>
              Active Threads
            </h2>
          </div>
          {processedRequests.length > 0 && (
            <span style={{
              fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.28em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              fontFamily: "var(--font-mono, monospace)",
            }}>
              {processedRequests.length} total
            </span>
          )}
        </div>

        {/* Empty state */}
        {processedRequests.length === 0 ? (
          <div style={{
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "5rem 2rem",
            textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
          }}>
            <div style={{
              width: "3rem", height: "3rem", borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BookOpen size={20} color="rgba(255,255,255,0.3)" />
            </div>
            <div>
              <h3 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
                Your dashboard is waiting
              </h3>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", maxWidth: "28rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
                You haven&apos;t submitted any mentorship requests yet. Start by connecting with a verified professor.
              </p>
            </div>
            <Link href="/professors" style={{ textDecoration: "none", marginTop: "0.5rem" }}>
              <div style={{
                padding: "0.75rem 1.75rem",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "100px",
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.7)",
                fontFamily: "var(--font-sans)", cursor: "pointer",
              }}>
                Browse Professors
              </div>
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {processedRequests.map((req) => (
              <ThreadCard key={req.id} request={req as any} viewerRole="student" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
