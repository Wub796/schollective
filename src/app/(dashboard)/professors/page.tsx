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
    <div className="py-10 lg:py-16 space-y-12">
      {/* Header */}
      <header>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-[#3a3a3a] hover:text-[#8a8a8a] transition-colors mb-8 group no-underline"
        >
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
        <p className="text-[0.62rem] font-bold tracking-[0.25em] text-[#3a3a3a] uppercase mb-3">
          Academic Bridge
        </p>
        <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#f2f2f0] leading-tight mb-4">
          Discover your <em className="italic text-[#5a5a5a]">intellectual mentor</em>
        </h1>
        <p className="text-[#4a4a4a] text-base font-light max-w-2xl leading-relaxed">
          Connect with verified experts across all academic disciplines. Every professor
          is manually approved via institutional credentials.
        </p>
      </header>

      <DirectorySearch
        institutions={distinctInstitutions}
        expertiseAreas={distinctExpertise}
      />

      {professors && professors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {professors.map((prof) => (
            <ProfessorCard key={prof.id} professor={prof as any} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[rgba(255,255,255,0.05)] rounded-2xl p-20 text-center">
          <h3 className="font-display text-xl text-[#d4d4d2] mb-3 font-semibold">
            No mentors found
          </h3>
          <p className="text-[#4a4a4a] text-sm font-light max-w-xs mx-auto leading-relaxed mb-8">
            Try broadening your search or resetting your filters.
          </p>
          <Link href="/professors">
            <Button variant="outline">Reset Filters</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
