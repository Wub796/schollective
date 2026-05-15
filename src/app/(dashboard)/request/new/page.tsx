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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", maxWidth: "680px" }}>

      {/* Back link */}
      <Link
        href="/professors"
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          textDecoration: "none", width: "fit-content",
        }}
      >
        <ArrowLeft size={12} style={{ color: "rgba(129, 140, 248, 0.4)" }} />
        <span style={{
          fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.3em",
          textTransform: "uppercase", color: "rgba(129, 140, 248, 0.4)",
          fontFamily: "var(--font-mono, monospace)",
        }}>
          Back to Directory
        </span>
      </Link>

      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.3em",
            textTransform: "uppercase", color: "rgba(129, 140, 248, 0.5)",
            fontFamily: "var(--font-mono, monospace)",
          }}>
            <GraduationCap size={11} />
            Mentorship Request
          </div>
        </div>

        <h1 className="font-display" style={{
          fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 900,
          color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05,
        }}>
          Initiate your{" "}
          <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.3)" }}>
            intellectual dialogue
          </em>
        </h1>

        <p style={{
          fontSize: "0.88rem", color: "rgba(168, 179, 207, 0.5)",
          fontWeight: 300, maxWidth: "44rem", lineHeight: 1.75,
          fontFamily: "var(--font-sans)",
        }}>
          Every mentorship thread on Schollective starts with a focused request.
          Be specific about your needs to respect the professor&apos;s time.
        </p>
      </header>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(129, 140, 248, 0.07)" }} />

      {/* Form */}
      <RequestForm professor={professor as any} />

      {/* Footer */}
      <p style={{
        textAlign: "center",
        color: "rgba(250, 250, 249, 0.12)",
        fontSize: "0.52rem",
        textTransform: "uppercase",
        letterSpacing: "0.35em",
        fontWeight: 700,
        fontFamily: "var(--font-mono, monospace)",
        paddingBottom: "2rem",
      }}>
        Powered by academic equity · Schollective 2025
      </p>
    </div>
  );
}
