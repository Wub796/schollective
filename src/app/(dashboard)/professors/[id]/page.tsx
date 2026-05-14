import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, GraduationCap, Building2, BookOpen, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfessorProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch professor
  const { data: professor } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, institution, expertise_fields, avatar_url, is_accepting_requests")
    .eq("id", id)
    .eq("role", "professor")
    .eq("status", "approved")
    .single();

  if (!professor) notFound();

  const displayName = professor.preferred_name || professor.first_name;
  const initials    = `${professor.first_name?.[0] ?? ""}${professor.last_name?.[0] ?? ""}`.toUpperCase();
  const isAccepting = professor.is_accepting_requests !== false;

  // Check if student already has an active/pending request with this professor
  const { data: existingRequest } = await supabase
    .from("requests")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("professor_id", id)
    .in("status", ["pending", "active"])
    .maybeSingle();

  const hasActiveRequest = !!existingRequest;

  return (
    <div style={{ padding: "3rem 0", display: "flex", flexDirection: "column", gap: "3rem", maxWidth: "680px" }}>

      {/* Back */}
      <Link href="/professors" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", width: "fit-content" }}>
        <ArrowLeft size={12} color="rgba(250, 250, 249, 0.35)" />
        <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.35)", fontFamily: "var(--font-sans)" }}>
          Back to Directory
        </span>
      </Link>

      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Faculty Profile
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", border: "1px solid rgba(250, 250, 249, 0.12)", background: "rgba(250, 250, 249, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {professor.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={professor.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.6)", letterSpacing: "-0.02em" }}>{initials}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <h1 className="font-display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
              Dr. {displayName} <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.35)" }}>{professor.last_name}</em>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              {/* Verified badge */}
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.8rem", border: "1px solid rgba(120,220,120,0.25)", borderRadius: "100px", background: "rgba(120,220,120,0.04)" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(120,220,120,0.8)" }} />
                <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(120,220,120,0.8)", fontFamily: "var(--font-mono, monospace)" }}>Verified Faculty</span>
              </span>
              {/* Availability */}
              <span style={{ padding: "0.3rem 0.8rem", border: `1px solid ${isAccepting ? "rgba(250, 250, 249, 0.1)" : "rgba(250, 250, 249, 0.06)"}`, borderRadius: "100px", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: isAccepting ? "rgba(250, 250, 249, 0.4)" : "rgba(250, 250, 249, 0.2)", fontFamily: "var(--font-mono, monospace)" }}>
                {isAccepting ? "Accepting Requests" : "Not Accepting"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)" }} />

      {/* Details grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Institution */}
        {professor.institution && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "8px", border: "1px solid rgba(250, 250, 249, 0.08)", background: "rgba(250, 250, 249, 0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
              <Building2 size={12} color="rgba(250, 250, 249, 0.4)" />
            </div>
            <div>
              <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.25)", fontFamily: "var(--font-mono, monospace)", marginBottom: "0.35rem" }}>Institution</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "rgba(250, 250, 249, 0.8)", fontFamily: "var(--font-sans)" }}>{professor.institution}</div>
            </div>
          </div>
        )}

        {/* Expertise */}
        {professor.expertise_fields && professor.expertise_fields.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "8px", border: "1px solid rgba(250, 250, 249, 0.08)", background: "rgba(250, 250, 249, 0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
              <BookOpen size={12} color="rgba(250, 250, 249, 0.4)" />
            </div>
            <div>
              <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.25)", fontFamily: "var(--font-mono, monospace)", marginBottom: "0.75rem" }}>Research Areas</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {professor.expertise_fields.map((field: string) => (
                  <span key={field} style={{ padding: "0.35rem 0.85rem", border: "1px solid rgba(250, 250, 249, 0.1)", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 500, color: "rgba(250, 250, 249, 0.6)", fontFamily: "var(--font-sans)" }}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)" }} />

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {hasActiveRequest ? (
          <div style={{ padding: "1rem 1.5rem", border: "1px solid rgba(250, 250, 249, 0.08)", borderRadius: "12px", background: "rgba(250, 250, 249, 0.02)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,200,80,0.8)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.78rem", color: "rgba(250, 250, 249, 0.5)", fontFamily: "var(--font-sans)" }}>
              You already have a {existingRequest?.status} request with this professor.{" "}
              <Link href={`/messages/${existingRequest?.id}`} style={{ color: "rgba(250, 250, 249, 0.75)", textDecoration: "none" }}>
                View thread →
              </Link>
            </span>
          </div>
        ) : isAccepting ? (
          <Link href={`/request/${professor.id}`} style={{ textDecoration: "none" }}>
            <button className="btn-request" style={{ width: "100%", padding: "1.1rem 2rem", background: "#fafaf9", color: "#080c14", border: "none", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <Mail size={13} />
              Request Mentorship
            </button>
          </Link>
        ) : (
          <div style={{ padding: "1rem 1.5rem", border: "1px solid rgba(250, 250, 249, 0.06)", borderRadius: "12px", background: "rgba(250, 250, 249, 0.01)", textAlign: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "rgba(250, 250, 249, 0.35)", fontFamily: "var(--font-sans)" }}>
              This professor is not currently accepting new requests.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
