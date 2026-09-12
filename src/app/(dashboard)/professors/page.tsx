import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { ProfessorCard } from "@/components/features/ProfessorCard";
import { DirectorySearch } from "@/components/features/DirectorySearch";
import { AiProfessorRecommendations } from "@/components/features/AiProfessorRecommendations";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;
export const dynamicParams = true;

interface ProfessorsPageProps {
  searchParams: Promise<{
    query?: string;
    institution?: string;
    expertise?: string;
    accepting?: string;
    sort?: string;
    page?: string;
  }>;
}

/** Results per page. The directory used to render every approved professor. */
const PAGE_SIZE = 24;

const PAGER_LINK: React.CSSProperties = {
  display: "inline-block",
  padding: "0.6rem 1.4rem",
  border: "1px solid var(--accent)",
  borderRadius: "100px",
  fontSize: "0.65rem",
  fontWeight: 800,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--accent)",
  fontFamily: "var(--font-sans)",
};

export default async function ProfessorsPage({ searchParams }: ProfessorsPageProps) {
  const { query, institution, expertise, accepting, sort, page } = await searchParams;
  const isAcceptingOnly = accepting !== "false"; // default true
  const currentSort = sort || "relevance";

  const pageNumber = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const offset = (pageNumber - 1) * PAGE_SIZE;

  // Filtering, sorting, counting and paging all happen in Postgres.
  //
  // Previously the page SELECTed every approved professor with no LIMIT and then
  // applied all four filters in JavaScript, so each request transferred and
  // parsed the entire faculty table to render at most a screenful. The filters
  // are expressed as "parameter is null OR it matches", which keeps this a single
  // prepared statement instead of string-built SQL.
  const q = query?.trim() ? query.trim().toLowerCase() : null;
  const inst = institution && institution !== "all" ? institution : null;
  const expertiseList =
    expertise && expertise !== "all"
      ? expertise.split(",").map(decodeURIComponent).filter(Boolean).map((t) => t.toLowerCase())
      : null;
  const expertiseFilter = expertiseList && expertiseList.length > 0 ? expertiseList : null;

  // `jsonb_typeof(...) = 'array'` guards the legacy rows where the column holds a
  // bare JSON string rather than an array — jsonb_array_elements_text errors on
  // those, which would take the whole directory down rather than skip one row.
  const [pageRows, countRows, institutionRows, expertiseRows] = await Promise.all([
    currentSort === "recent"
      ? sql`
          SELECT id, first_name, last_name, preferred_name, institution, expertise_fields, is_accepting_requests, updated_at
          FROM profiles
          WHERE role = 'professor' AND status = 'approved'
            AND (${isAcceptingOnly}::boolean IS NOT TRUE OR is_accepting_requests IS NOT FALSE)
            AND (${inst}::text IS NULL OR institution = ${inst})
            AND (${q}::text IS NULL OR (
                  lower(concat_ws(' ', first_name, last_name, preferred_name)) LIKE '%' || ${q} || '%'
               OR lower(coalesce(institution, '')) LIKE '%' || ${q} || '%'
               OR (jsonb_typeof(expertise_fields) = 'array' AND EXISTS (
                     SELECT 1 FROM jsonb_array_elements_text(expertise_fields) e
                     WHERE lower(e) LIKE '%' || ${q} || '%'))
            ))
            AND (${expertiseFilter}::text[] IS NULL OR (
                  jsonb_typeof(expertise_fields) = 'array' AND EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text(expertise_fields) e
                    JOIN unnest(${expertiseFilter}::text[]) sel ON lower(e) LIKE '%' || sel || '%')
            ))
          ORDER BY updated_at DESC
          LIMIT ${PAGE_SIZE} OFFSET ${offset};
        `
      : sql`
          SELECT id, first_name, last_name, preferred_name, institution, expertise_fields, is_accepting_requests, updated_at
          FROM profiles
          WHERE role = 'professor' AND status = 'approved'
            AND (${isAcceptingOnly}::boolean IS NOT TRUE OR is_accepting_requests IS NOT FALSE)
            AND (${inst}::text IS NULL OR institution = ${inst})
            AND (${q}::text IS NULL OR (
                  lower(concat_ws(' ', first_name, last_name, preferred_name)) LIKE '%' || ${q} || '%'
               OR lower(coalesce(institution, '')) LIKE '%' || ${q} || '%'
               OR (jsonb_typeof(expertise_fields) = 'array' AND EXISTS (
                     SELECT 1 FROM jsonb_array_elements_text(expertise_fields) e
                     WHERE lower(e) LIKE '%' || ${q} || '%'))
            ))
            AND (${expertiseFilter}::text[] IS NULL OR (
                  jsonb_typeof(expertise_fields) = 'array' AND EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text(expertise_fields) e
                    JOIN unnest(${expertiseFilter}::text[]) sel ON lower(e) LIKE '%' || sel || '%')
            ))
          ORDER BY last_name ASC NULLS LAST
          LIMIT ${PAGE_SIZE} OFFSET ${offset};
        `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM profiles
      WHERE role = 'professor' AND status = 'approved'
        AND (${isAcceptingOnly}::boolean IS NOT TRUE OR is_accepting_requests IS NOT FALSE)
        AND (${inst}::text IS NULL OR institution = ${inst})
        AND (${q}::text IS NULL OR (
              lower(concat_ws(' ', first_name, last_name, preferred_name)) LIKE '%' || ${q} || '%'
           OR lower(coalesce(institution, '')) LIKE '%' || ${q} || '%'
           OR (jsonb_typeof(expertise_fields) = 'array' AND EXISTS (
                 SELECT 1 FROM jsonb_array_elements_text(expertise_fields) e
                 WHERE lower(e) LIKE '%' || ${q} || '%'))
        ))
        AND (${expertiseFilter}::text[] IS NULL OR (
              jsonb_typeof(expertise_fields) = 'array' AND EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(expertise_fields) e
                JOIN unnest(${expertiseFilter}::text[]) sel ON lower(e) LIKE '%' || sel || '%')
        ));
    `,
    // Filter dropdown options come from their own aggregate queries rather than
    // from the result set, so they stay complete without the page fetching
    // everything. Both are small and bounded.
    sql`
      SELECT DISTINCT institution
      FROM profiles
      WHERE role = 'professor' AND status = 'approved' AND institution IS NOT NULL AND institution <> ''
      ORDER BY institution ASC;
    `,
    sql`
      SELECT DISTINCT e AS field
      FROM profiles, jsonb_array_elements_text(expertise_fields) e
      WHERE role = 'professor' AND status = 'approved'
        AND jsonb_typeof(expertise_fields) = 'array'
      ORDER BY field ASC;
    `,
  ]);

  const professors = (pageRows || []) as any[];
  const totalCount = (countRows as any[])?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const distinctInstitutions = ((institutionRows || []) as any[])
    .map((r) => r.institution as string)
    .filter(Boolean);
  const distinctExpertise = ((expertiseRows || []) as any[])
    .map((r) => r.field as string)
    .filter(Boolean);

  // Preserve the active filters when moving between pages.
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (institution) params.set("institution", institution);
    if (expertise) params.set("expertise", expertise);
    if (accepting) params.set("accepting", accepting);
    if (sort) params.set("sort", sort);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/professors?${qs}` : "/professors";
  };

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
          <ArrowLeft size={13} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-sans, monospace)" }}>
            Back to Dashboard
          </span>
        </Link>

        <h1 className="font-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.12 }}>
          Discover your{" "}
          <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>intellectual mentor</em>
        </h1>
        <p style={{ fontSize: "1.02rem", color: "var(--text-secondary)", opacity: 0.8, fontWeight: 400, maxWidth: "46rem", lineHeight: 1.85, fontFamily: "var(--font-sans)", marginTop: "0.35rem" }}>
          Connect with verified experts across all academic disciplines. Every professor
          is manually approved via institutional credentials.
        </p>
      </header>

      {/* AI Recommendations */}
      <AiProfessorRecommendations />

      <DirectorySearch
        institutions={distinctInstitutions}
        expertiseAreas={distinctExpertise}
      />

      {professors && professors.length > 0 ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "2.25rem" }}>
            {professors.map((prof) => (
              <ProfessorCard key={prof.id} professor={prof as any} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Directory pages"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
            >
              {pageNumber > 1 && (
                <Link href={pageHref(pageNumber - 1)} style={{ textDecoration: "none" }}>
                  <span style={PAGER_LINK}>Previous</span>
                </Link>
              )}
              <span
                aria-live="polite"
                style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}
              >
                Page {pageNumber} of {totalPages} · {totalCount} mentor{totalCount === 1 ? "" : "s"}
              </span>
              {pageNumber < totalPages && (
                <Link href={pageHref(pageNumber + 1)} style={{ textDecoration: "none" }}>
                  <span style={PAGER_LINK}>Next</span>
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <div style={{ border: "1px dashed rgba(99, 102, 241, 0.6)", borderRadius: "24px", padding: "5rem 2.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)" }}>
          <h3 className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            No mentors found
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", opacity: 0.8, maxWidth: "26rem", lineHeight: 1.75, fontFamily: "var(--font-sans)", marginBottom: "0.75rem" }}>
            Try broadening your search or resetting your filters. Or, explore these popular research fields:
          </p>
          
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.25rem" }}>
            {["Machine Learning", "Bio-Ethics", "Computer Science"].map((field) => (
              <Link key={field} href={`/professors?expertise=${encodeURIComponent(field)}`} style={{ textDecoration: "none" }}>
                <span style={{ padding: "0.5rem 1.1rem", border: "1px solid rgba(79, 70, 229, 0.3)", background: "rgba(79, 70, 229, 0.08)", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)" }}>
                  {field}
                </span>
              </Link>
            ))}
          </div>

          <Link href="/professors" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.85rem 2rem", border: "2px solid var(--accent)", background: "var(--accent)", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ffffff", fontFamily: "var(--font-sans)", cursor: "pointer", boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)" }}>
              Reset Filters
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
