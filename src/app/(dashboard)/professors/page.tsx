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
    .select("id, first_name, last_name, preferred_name, institution, expertise_fields, is_accepting_requests, updated_at")
    .eq("role", "professor")
    .eq("status", "approved")
    .eq("profile_complete", true);

  if (isAcceptingOnly) {
    dbQuery = dbQuery.eq("is_accepting_requests", true);
  }

  if (institution && institution !== "all") {
    dbQuery = dbQuery.eq("institution", institution);
  }

  // Apply sorting based on sort param
  if (currentSort === "recent") {
    dbQuery = dbQuery.order("updated_at", { ascending: false });
  } else {
    // Relevance / alpha -> order by last name
    dbQuery = dbQuery.order("last_name", { ascending: true });
  }

  const { data: rawProfessors } = await dbQuery;
  let professors = rawProfessors || [];

  // Filter by search text query (matches name, institution, OR expertise fields / topics)
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    professors = professors.filter((p) => {
      const fullName = `${p.first_name || ""} ${p.last_name || ""} ${p.preferred_name || ""}`.toLowerCase();
      const inst = (p.institution || "").toLowerCase();
      const fields = (p.expertise_fields || []).map((f: string) => f.toLowerCase()).join(" ");
      return fullName.includes(q) || inst.includes(q) || fields.includes(q);
    });
  }

  // Filter by selected expertise areas (multi-select)
  if (expertise && expertise !== "all") {
    const selectedExpertise = expertise
      .split(",")
      .map(decodeURIComponent)
      .filter(Boolean)
      .map((s) => s.toLowerCase());

    if (selectedExpertise.length > 0) {
      professors = professors.filter((p) => {
        const profFields = (p.expertise_fields || []).map((f: string) => f.toLowerCase());
        return selectedExpertise.some(
          (sel) => profFields.includes(sel) || profFields.some((f: string) => f.includes(sel))
        );
      });
    }
  }

  // Fetch full dataset for populating filter dropdown options (all approved complete professors)
  const { data: filterData } = await supabase
    .from("profiles")
    .select("institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "approved")
    .eq("profile_complete", true);

  const distinctInstitutions = Array.from(
    new Set(filterData?.map((p) => p.institution).filter(Boolean) as string[])
  ).sort();
  const distinctExpertise = Array.from(
    new Set(filterData?.flatMap((p) => p.expertise_fields || []))
  ).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4.5rem", paddingBottom: "4rem" }}>
      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            width: "fit-content",
            padding: "0.5rem 1rem",
            borderRadius: "100px",
            background: "rgba(79, 70, 229, 0.08)",
            border: "1px solid rgba(79, 70, 229, 0.25)",
            transition: "all 0.2s ease",
          }}
        >
          <ArrowLeft size={13} style={{ color: "#4f46e5" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
            Back to Dashboard
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginTop: "0.25rem" }}>
          <span style={{ width: "2rem", height: "2px", background: "#6366f1", display: "block" }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
            Academic Directory
          </span>
        </div>

        <h1 className="font-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.12 }}>
          Discover your{" "}
          <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>intellectual mentor</em>
        </h1>
        <p style={{ fontSize: "1.02rem", color: "#475569", opacity: 0.8, fontWeight: 400, maxWidth: "46rem", lineHeight: 1.85, fontFamily: "var(--font-sans)", marginTop: "0.35rem" }}>
          Connect with verified experts across all academic disciplines. Every professor
          is manually approved via institutional credentials.
        </p>
      </header>

      <DirectorySearch
        institutions={distinctInstitutions}
        expertiseAreas={distinctExpertise}
      />

      {professors && professors.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "2.25rem" }}>
          {professors.map((prof) => (
            <ProfessorCard key={prof.id} professor={prof as any} />
          ))}
        </div>
      ) : (
        <div style={{ border: "1px dashed rgba(99, 102, 241, 0.6)", borderRadius: "24px", padding: "5rem 2.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)" }}>
          <h3 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            No mentors found
          </h3>
          <p style={{ fontSize: "0.88rem", color: "#475569", opacity: 0.8, maxWidth: "26rem", lineHeight: 1.75, fontFamily: "var(--font-sans)", marginBottom: "0.75rem" }}>
            Try broadening your search or resetting your filters. Or, explore these popular research fields:
          </p>
          
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.25rem" }}>
            {["Machine Learning", "Bio-Ethics", "Computer Science"].map((field) => (
              <Link key={field} href={`/professors?expertise=${encodeURIComponent(field)}`} style={{ textDecoration: "none" }}>
                <span style={{ padding: "0.5rem 1.1rem", border: "1px solid rgba(79, 70, 229, 0.3)", background: "rgba(79, 70, 229, 0.08)", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, color: "#4f46e5" }}>
                  {field}
                </span>
              </Link>
            ))}
          </div>

          <Link href="/professors" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.85rem 2rem", border: "2px solid #4f46e5", background: "#4f46e5", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ffffff", fontFamily: "var(--font-sans)", cursor: "pointer", boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)" }}>
              Reset Filters
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
