import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { RequestForm } from "./RequestForm";
import { ArrowLeft, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

interface RequestNewPageProps {
  searchParams: Promise<{
    prof_id?: string;
  }>;
}

export default async function RequestNewPage({ searchParams }: RequestNewPageProps) {
  const supabase = await createClient();
  const { prof_id } = await searchParams;

  if (!prof_id) redirect("/professors");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: professor, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, institution")
    .eq("id", prof_id)
    .eq("role", "professor")
    .eq("status", "approved")
    .single();

  if (error || !professor) {
    console.error("Invalid professor ID:", error);
    redirect("/professors");
  }

  // Fetch requests count in last 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: requestCount } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("student_id", session.user.id)
    .gt("created_at", twentyFourHoursAgo);

  const requestsToday = requestCount || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", maxWidth: "720px" }}>

      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Back link */}
        <Link
          href="/professors"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", width: "fit-content",
            padding: "0.4rem 0.8rem", borderRadius: "100px", background: "rgba(0, 140, 187, 0.08)", border: "1px solid rgba(0, 140, 187, 0.2)"
          }}
        >
          <ArrowLeft size={12} style={{ color: "#008CBB" }} />
          <span style={{
            fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#008CBB",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            Back to Directory
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#FFC20F", display: "block" }} />
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#008CBB",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            <GraduationCap size={14} />
            Mentorship Request
          </div>
        </div>

        <h1 className="font-display" style={{
          fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900,
          color: "#141005", letterSpacing: "-0.035em", lineHeight: 1.1,
        }}>
          Initiate your{" "}
          <em style={{ fontStyle: "italic", color: "#008CBB", fontWeight: 300 }}>
            intellectual dialogue
          </em>
        </h1>

        <p style={{
          fontSize: "0.95rem", color: "#3b3527", opacity: 0.75,
          fontWeight: 400, maxWidth: "44rem", lineHeight: 1.8,
          fontFamily: "var(--font-sans)",
        }}>
          Every mentorship thread on Schollective starts with a focused request.
          Be specific about your needs to respect the professor&apos;s time.
        </p>
      </header>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(37, 99, 235, 0.07)" }} />

      {/* Form */}
      <RequestForm professor={professor as any} requestsToday={requestsToday} />

      {/* Footer */}
      <p style={{
        textAlign: "center",
        color: "rgba(15, 23, 42, 0.12)",
        fontSize: "0.52rem",
        textTransform: "uppercase",
        letterSpacing: "0.35em",
        fontWeight: 700,
        fontFamily: "var(--font-sans, monospace)",
        paddingBottom: "2rem",
      }}>
        Powered by academic equity · Schollective 2025
      </p>
    </div>
  );
}
