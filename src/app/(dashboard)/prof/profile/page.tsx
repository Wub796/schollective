import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ShieldCheck, GraduationCap, BookOpen, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfPublicProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "professor") redirect("/dashboard");

  const displayName = profile.preferred_name || profile.first_name || "Professor";
  const initials    = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div style={{ padding: "3rem 0", display: "flex", flexDirection: "column", gap: "3.5rem", maxWidth: "680px" }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Faculty Portal
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Your public{" "}
          <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.35)" }}>profile</em>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Eye size={12} color="rgba(250, 250, 249, 0.3)" />
          <p style={{ fontSize: "0.75rem", color: "rgba(250, 250, 249, 0.35)", fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
            This is exactly how students see your card in the mentor directory.
          </p>
        </div>
      </header>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)" }} />

      {/* ── Profile card preview (mimics ProfessorCard) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Student View
          </span>
        </div>

        <div style={{
          position: "relative",
          background: "rgba(250, 250, 249, 0.025)",
          border: "1px solid rgba(250, 250, 249, 0.08)",
          borderRadius: "16px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Top shimmer */}
          <div style={{
            position: "absolute", insetInline: 0, top: 0, height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(250, 250, 249, 0.15), transparent)",
          }} />

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div style={{
              width: "3rem", height: "3rem", borderRadius: "50%",
              background: "rgba(250, 250, 249, 0.05)", border: "1px solid rgba(250, 250, 249, 0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.85rem", fontWeight: 600, color: "rgba(250, 250, 249, 0.6)",
              fontFamily: "var(--font-sans)",
            }}>
              {initials || "?"}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.3rem 0.7rem", borderRadius: "100px",
              border: "1px solid rgba(250, 250, 249, 0.08)",
              background: "rgba(250, 250, 249, 0.03)",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(120,200,120,0.7)" }} />
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.35)", fontFamily: "var(--font-mono, monospace)" }}>
                Verified
              </span>
            </div>
          </div>

          {/* Name + institution */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.88)", lineHeight: 1.2, marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
              Dr. {displayName} {profile.last_name}
            </h3>
            <div style={{ fontSize: "0.68rem", color: "rgba(250, 250, 249, 0.38)", fontFamily: "var(--font-sans)", lineHeight: 1.4, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <GraduationCap size={12} color="rgba(250, 250, 249, 0.25)" />
              {profile.institution || "Independent Researcher"}
            </div>
          </div>

          {/* Hairline */}
          <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)", marginBottom: "1.25rem" }} />

          {/* Expertise tags */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.2)", marginBottom: "0.75rem", fontFamily: "var(--font-mono, monospace)" }}>
              Focus Areas
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {profile.expertise_fields?.slice(0, 4).map((field: string, idx: number) => (
                <span key={idx} style={{
                  padding: "0.3rem 0.7rem", borderRadius: "100px",
                  border: "1px solid rgba(250, 250, 249, 0.08)",
                  background: "rgba(250, 250, 249, 0.03)",
                  fontSize: "0.65rem", color: "rgba(250, 250, 249, 0.5)", fontFamily: "var(--font-sans)",
                }}>
                  {field}
                </span>
              )) || (
                <span style={{ fontSize: "0.72rem", fontStyle: "italic", color: "rgba(250, 250, 249, 0.22)", fontFamily: "var(--font-sans)" }}>
                  Open to all topics
                </span>
              )}
            </div>
          </div>

          {/* CTA (non-functional preview) */}
          <div style={{
            padding: "0.85rem 1.5rem",
            background: "rgba(250, 250, 249, 0.08)",
            border: "1px solid rgba(250, 250, 249, 0.12)",
            borderRadius: "100px",
            textAlign: "center",
            fontSize: "0.58rem", fontWeight: 700,
            letterSpacing: "0.24em", textTransform: "uppercase",
            color: "rgba(250, 250, 249, 0.8)", fontFamily: "var(--font-sans)",
            cursor: "default",
          }}>
            Request Mentorship
          </div>
        </div>
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)" }} />

      {/* ── Info breakdown ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Profile Details
          </span>
        </div>

        {/* Fields */}
        <div className="grid-2" style={{ gap: "1.75rem" }}>
          {[
            { icon: <BookOpen size={14} color="rgba(250, 250, 249, 0.3)" />, label: "Full Name",    value: `Dr. ${profile.first_name ?? ""} ${profile.last_name ?? ""}` },
            { icon: <GraduationCap size={14} color="rgba(250, 250, 249, 0.3)" />, label: "Institution", value: profile.institution || "Not specified" },
          ].map(({ icon, label, value }) => (
            <div key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                {icon}
                <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.28)", fontFamily: "var(--font-mono, monospace)" }}>
                  {label}
                </span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "rgba(250, 250, 249, 0.7)", fontFamily: "var(--font-sans)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Expertise list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.28)", fontFamily: "var(--font-mono, monospace)" }}>
              Expertise Fields
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {profile.expertise_fields?.map((field: string, idx: number) => (
              <span key={idx} style={{
                padding: "0.35rem 0.85rem", borderRadius: "100px",
                border: "1px solid rgba(250, 250, 249, 0.1)",
                background: "rgba(250, 250, 249, 0.04)",
                fontSize: "0.72rem", color: "rgba(250, 250, 249, 0.55)", fontFamily: "var(--font-sans)",
              }}>
                {field}
              </span>
            )) || (
              <span style={{ fontSize: "0.78rem", fontStyle: "italic", color: "rgba(250, 250, 249, 0.22)", fontFamily: "var(--font-sans)" }}>
                No fields specified yet — update them in your profile settings.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)" }} />

      {/* ── Verification status ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <ShieldCheck size={18} color="rgba(120,200,120,0.6)" />
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(250, 250, 249, 0.6)", fontFamily: "var(--font-sans)", marginBottom: "0.2rem" }}>
            Verified Faculty Account
          </div>
          <div style={{ fontSize: "0.6rem", color: "rgba(250, 250, 249, 0.25)", fontFamily: "var(--font-sans)" }}>
            Your account was reviewed and approved by the Schollective admin team.
          </div>
        </div>
      </div>
    </div>
  );
}
