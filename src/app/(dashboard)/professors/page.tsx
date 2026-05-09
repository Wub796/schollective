import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfessorCard } from "@/components/features/ProfessorCard";
import { DirectorySearch } from "@/components/features/DirectorySearch";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProfessorsPageProps {
  searchParams: Promise<{
    query?: string;
    institution?: string;
    expertise?: string;
  }>;
}

export default async function ProfessorsPage({ searchParams }: ProfessorsPageProps) {
  const supabase = await createClient();
  const { query, institution, expertise } = await searchParams;

  let dbQuery = supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "approved");

  if (query) {
    dbQuery = dbQuery.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,preferred_name.ilike.%${query}%,institution.ilike.%${query}%`
    );
  }
  if (institution && institution !== "all") dbQuery = dbQuery.eq("institution", institution);
  if (expertise && expertise !== "all") dbQuery = dbQuery.contains("expertise_fields", [expertise]);

  const { data: professors } = await dbQuery.order("last_name", { ascending: true });

  const { data: filterData } = await supabase
    .from("profiles")
    .select("institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "approved");

  const distinctInstitutions = Array.from(
    new Set(filterData?.map((p) => p.institution).filter(Boolean) as string[])
  ).sort();
  const distinctExpertise = Array.from(
    new Set(filterData?.flatMap((p) => p.expertise_fields || []))
  ).sort();

  return (
    <div style={{ padding: "3rem 0", display: "flex", flexDirection: "column", gap: "3.5rem" }}>
      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <Link
          href="/dashboard"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", width: "fit-content" }}
        >
          <ArrowLeft size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
          <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Back to Dashboard
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono, monospace)" }}>
            Academic Bridge
          </span>
        </div>

        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Discover your{" "}
          <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.35)" }}>intellectual mentor</em>
        </h1>
        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", fontWeight: 300, maxWidth: "42rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          Connect with verified experts across all academic disciplines. Every professor
          is manually approved via institutional credentials.
        </p>
      </header>

      <DirectorySearch
        institutions={distinctInstitutions}
        expertiseAreas={distinctExpertise}
      />

      {professors && professors.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {professors.map((prof) => (
            <ProfessorCard key={prof.id} professor={prof as any} />
          ))}
        </div>
      ) : (
        <div style={{ border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "16px", padding: "5rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
          <h3 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.02em" }}>
            No mentors found
          </h3>
          <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", maxWidth: "24rem", lineHeight: 1.7, fontFamily: "var(--font-sans)" }}>
            Try broadening your search or resetting your filters.
          </p>
          <Link href="/professors" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.75rem 1.75rem", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "100px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              Reset Filters
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
