import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { RequestForm } from "./RequestForm";
import { ArrowLeft, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

interface RequestNewPageProps {
  searchParams: Promise<{
    prof_id?: string;
  }>;
}

export default async function RequestNewPage({ searchParams }: RequestNewPageProps) {
  const { prof_id } = await searchParams;

  if (!prof_id) redirect("/professors");

  const { session, user } = await getCurrentUserAndProfile();
  if (!session || !user) redirect("/login");

  const professors = await sql`
    SELECT id, first_name, last_name, preferred_name, institution
    FROM profiles
    WHERE id = ${prof_id} AND role = 'professor' AND status = 'approved'
    LIMIT 1;
  `;
  const professor = professors[0];

  if (!professor) {
    redirect("/professors");
  }

  // Fetch requests count in last 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const countResult = await sql`
    SELECT COUNT(*)::int as count
    FROM requests
    WHERE student_id = ${user.id} AND created_at > ${twentyFourHoursAgo};
  `;

  const requestsToday = countResult[0]?.count || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", maxWidth: "720px" }}>

      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Back link */}
        <Link
          href="/professors"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", width: "fit-content",
            padding: "0.4rem 0.8rem", borderRadius: "100px", background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.2)"
          }}
        >
          <ArrowLeft size={12} style={{ color: "#4f46e5" }} />
          <span style={{
            fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#4f46e5",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            Back to Directory
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#4f46e5",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            <GraduationCap size={14} />
            Mentorship Request
          </div>
        </div>

        <h1 className="font-display" style={{
          fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900,
          color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1,
        }}>
          Initiate your{" "}
          <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>
            intellectual dialogue
          </em>
        </h1>

        <p style={{
          fontSize: "0.95rem", color: "#475569", opacity: 0.75,
          fontWeight: 400, maxWidth: "44rem", lineHeight: 1.8,
          fontFamily: "var(--font-sans)",
        }}>
          Every mentorship thread on Schollective starts with a focused request.
          Be specific about your needs to respect the professor&apos;s time.
        </p>
      </header>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(79, 70, 229, 0.07)" }} />

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
