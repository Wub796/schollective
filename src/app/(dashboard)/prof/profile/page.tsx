import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

  if (!profile) redirect("/dashboard");

  // Allow admins to preview as professor
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "professor";

  if (!isAdminPreviewing && profile.role !== "professor") redirect("/dashboard");

  const displayName = profile.preferred_name || profile.first_name || "Professor";
  const initials    = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", maxWidth: "680px" }}>

      {/* ── Header ── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#FFC20F", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#008CBB", fontFamily: "var(--font-sans, monospace)" }}>
            Faculty Portal
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#141005", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Your public{" "}
          <em style={{ fontStyle: "italic", color: "#008CBB", fontWeight: 300 }}>profile</em>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Eye size={14} style={{ color: "#008CBB" }} />
          <p style={{ fontSize: "0.88rem", color: "#3b3527", opacity: 0.75, fontFamily: "var(--font-sans)", lineHeight: 1.6 }}>
            This is exactly how students see your card in the mentor directory.
          </p>
        </div>
      </header>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(161, 197, 209, 0.4)" }} />

      {/* ── Profile card preview (mimics ProfessorCard) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <span style={{ width: "1rem", height: "2px", background: "#FFC20F", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#008CBB", fontFamily: "var(--font-sans, monospace)" }}>
            Student View
          </span>
        </div>

        <div style={{
          position: "relative",
          background: "#ffffff",
          border: "1.5px solid rgba(161, 197, 209, 0.5)",
          borderRadius: "16px",
          padding: "2.25rem 2.5rem",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        }}>
          {/* Top shimmer */}
          <div style={{
            position: "absolute", insetInline: 0, top: 0, height: "2px",
            background: "linear-gradient(90deg, transparent, #FFC20F, transparent)",
          }} />

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div style={{
              width: "3.2rem", height: "3.2rem", borderRadius: "50%",
              background: "rgba(0, 140, 187, 0.1)", border: "1px solid rgba(0, 140, 187, 0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.95rem", fontWeight: 800, color: "#008CBB",
              fontFamily: "var(--font-sans)",
            }}>
              {initials || "?"}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.35rem 0.85rem", borderRadius: "100px",
              border: "1px solid rgba(255, 194, 15, 0.6)",
              background: "#FFC20F",
            }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#141005", fontFamily: "var(--font-sans, monospace)" }}>
                Verified
              </span>
            </div>
          </div>

          {/* Name + institution */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#141005", lineHeight: 1.2, marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
              Dr. {displayName} {profile.last_name}
            </h3>
            <div style={{ fontSize: "0.75rem", color: "#3b3527", opacity: 0.75, fontFamily: "var(--font-sans)", lineHeight: 1.4, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <GraduationCap size={14} style={{ color: "#008CBB" }} />
              {profile.institution || "Independent Researcher"}
            </div>
          </div>

          {/* Hairline */}
          <div style={{ height: "1px", background: "rgba(161, 197, 209, 0.4)", marginBottom: "1.25rem" }} />

          {/* Expertise tags */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#008CBB", marginBottom: "0.75rem", fontFamily: "var(--font-sans, monospace)" }}>
              Focus Areas
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {profile.expertise_fields?.slice(0, 4).map((field: string, idx: number) => (
                <span key={idx} style={{
                  padding: "0.4rem 0.85rem", borderRadius: "100px",
                  border: "1px solid rgba(161, 197, 209, 0.6)",
                  background: "rgba(161, 197, 209, 0.15)",
                  fontSize: "0.7rem", fontWeight: 600, color: "#141005", fontFamily: "var(--font-sans)",
                }}>
                  {field}
                </span>
              )) || (
                <span style={{ fontSize: "0.72rem", fontStyle: "italic", color: "#3b3527", opacity: 0.5, fontFamily: "var(--font-sans)" }}>
                  Open to all topics
                </span>
              )}
            </div>
          </div>

          {/* CTA (non-functional preview) */}
          <div style={{
            padding: "0.85rem 1.5rem",
            background: "rgba(15, 23, 42, 0.08)",
            border: "1px solid rgba(15, 23, 42, 0.12)",
            borderRadius: "100px",
            textAlign: "center",
            fontSize: "0.58rem", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(15, 23, 42, 0.8)", fontFamily: "var(--font-sans)",
            cursor: "default",
          }}>
            Request Mentorship
          </div>
        </div>
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.06)" }} />

      {/* ── Info breakdown ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans, monospace)" }}>
            Profile Details
          </span>
        </div>

        {/* Fields */}
        <div className="grid-2" style={{ gap: "1.75rem" }}>
          {[
            { icon: <BookOpen size={14} color="rgba(15, 23, 42, 0.3)" />, label: "Full Name",    value: `Dr. ${profile.first_name ?? ""} ${profile.last_name ?? ""}` },
            { icon: <GraduationCap size={14} color="rgba(15, 23, 42, 0.3)" />, label: "Institution", value: profile.institution || "Not specified" },
          ].map(({ icon, label, value }) => (
            <div key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                {icon}
                <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.28)", fontFamily: "var(--font-sans, monospace)" }}>
                  {label}
                </span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "rgba(15, 23, 42, 0.7)", fontFamily: "var(--font-sans)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Expertise list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.28)", fontFamily: "var(--font-sans, monospace)" }}>
              Expertise Fields
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {profile.expertise_fields?.map((field: string, idx: number) => (
              <span key={idx} style={{
                padding: "0.35rem 0.85rem", borderRadius: "100px",
                border: "1px solid rgba(15, 23, 42, 0.1)",
                background: "rgba(15, 23, 42, 0.04)",
                fontSize: "0.72rem", color: "rgba(15, 23, 42, 0.55)", fontFamily: "var(--font-sans)",
              }}>
                {field}
              </span>
            )) || (
              <span style={{ fontSize: "0.78rem", fontStyle: "italic", color: "rgba(15, 23, 42, 0.22)", fontFamily: "var(--font-sans)" }}>
                No fields specified yet — update them in your profile settings.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.06)" }} />

      {/* ── Verification status ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <ShieldCheck size={18} color="rgba(120,200,120,0.6)" />
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.6)", fontFamily: "var(--font-sans)", marginBottom: "0.2rem" }}>
            Verified Faculty Account
          </div>
          <div style={{ fontSize: "0.6rem", color: "rgba(15, 23, 42, 0.25)", fontFamily: "var(--font-sans)" }}>
            Your account was reviewed and approved by the Schollective admin team.
          </div>
        </div>
      </div>
    </div>
  );
}
