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
    accepting?: string;
    sort?: string;
  }>;
}

export default async function ProfessorsPage({ searchParams }: ProfessorsPageProps) {
  const supabase = await createClient();
  const { query, institution, expertise, accepting, sort } = await searchParams;
  const isAcceptingOnly = accepting !== "false"; // default true
  const currentSort = sort || "relevance";

  let dbQuery = supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, institution, expertise_fields, is_accepting_requests")
    .eq("role", "professor")
    .eq("status", "approved")
    .eq("profile_complete", true);

  if (isAcceptingOnly) {
    dbQuery = dbQuery.eq("is_accepting_requests", true);
  }

  if (query) {
    dbQuery = dbQuery.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,preferred_name.ilike.%${query}%,institution.ilike.%${query}%`
    );
  }
  if (institution && institution !== "all") dbQuery = dbQuery.eq("institution", institution);
  
  if (expertise && expertise !== "all") {
    const selectedExpertise = expertise.split(",").map(decodeURIComponent).filter(Boolean);
    if (selectedExpertise.length > 0) {
      dbQuery = dbQuery.overlap("expertise_fields", selectedExpertise);
    }
  }

  // Apply sorting based on sort param
  if (currentSort === "recent") {
    dbQuery = dbQuery.order("updated_at", { ascending: false });
  } else {
    // Relevance / alpha -> order by last name
    dbQuery = dbQuery.order("last_name", { ascending: true });
  }

  const { data: professors } = await dbQuery;

  let filterQuery = supabase
    .from("profiles")
    .select("institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "approved")
    .eq("profile_complete", true);

  if (isAcceptingOnly) {
    filterQuery = filterQuery.eq("is_accepting_requests", true);
  }

  const { data: filterData } = await filterQuery;

  const distinctInstitutions = Array.from(
    new Set(filterData?.map((p) => p.institution).filter(Boolean) as string[])
  ).sort();
  const distinctExpertise = Array.from(
    new Set(filterData?.flatMap((p) => p.expertise_fields || []))
  ).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>
      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <Link
          href="/dashboard"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", width: "fit-content" }}
        >
          <ArrowLeft size={12} style={{ color: "rgba(15, 23, 42, 0.3)" }} />
          <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans, monospace)" }}>
            Back to Dashboard
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans, monospace)" }}>
            Academic Bridge
          </span>
        </div>

        <h1 className="font-display" style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Discover your{" "}
          <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>intellectual mentor</em>
        </h1>
        <p style={{ fontSize: "0.95rem", color: "rgba(15, 23, 42, 0.4)", fontWeight: 300, maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem" }}>
          Connect with verified experts across all academic disciplines. Every professor
          is manually approved via institutional credentials.
        </p>
      </header>

      <DirectorySearch
        institutions={distinctInstitutions}
        expertiseAreas={distinctExpertise}
      />

      {professors && professors.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {professors.map((prof) => (
            <ProfessorCard key={prof.id} professor={prof as any} />
          ))}
        </div>
      ) : (
        <div style={{ border: "1px dashed rgba(15, 23, 42, 0.08)", borderRadius: "16px", padding: "5rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
          <h3 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.7)", letterSpacing: "-0.02em" }}>
            No mentors found
          </h3>
          <p style={{ fontSize: "0.82rem", color: "rgba(15, 23, 42, 0.35)", maxWidth: "24rem", lineHeight: 1.7, fontFamily: "var(--font-sans)", marginBottom: "0.5rem" }}>
            Try broadening your search or resetting your filters. Or, explore these popular research fields:
          </p>
          
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1rem" }}>
            {["Machine Learning", "Bio-Ethics", "Computer Science"].map((field) => (
              <Link key={field} href={`/professors?expertise=${encodeURIComponent(field)}`} style={{ textDecoration: "none" }}>
                <span style={{ padding: "0.35rem 0.85rem", border: "1px solid rgba(37, 99, 235, 0.15)", background: "rgba(37, 99, 235, 0.03)", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 500, color: "var(--accent)" }}>
                  {field}
                </span>
              </Link>
            ))}
          </div>

          <Link href="/professors" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.75rem 1.75rem", border: "1px solid rgba(15, 23, 42, 0.15)", borderRadius: "100px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.7)", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              Reset Filters
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
