import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { ProfessorCard } from "@/components/features/ProfessorCard";
import { DirectorySearch } from "@/components/features/DirectorySearch";
import { ArrowLeft, Inbox } from "lucide-react";

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

  // 1. Base Query
  let dbQuery = supabase
    .from("profiles")
    .select("id, first_name, last_name, preferred_name, institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "approved");

  // 2. Dynamic Filtering
  if (query) {
    dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,preferred_name.ilike.%${query}%,institution.ilike.%${query}%`);
  }

  if (institution && institution !== "all") {
    dbQuery = dbQuery.eq("institution", institution);
  }

  // Handle array containment for expertise_fields
  if (expertise && expertise !== "all") {
    dbQuery = dbQuery.contains("expertise_fields", [expertise]);
  }

  const { data: professors, error } = await dbQuery.order("last_name", { ascending: true });

  // 3. Fetch Distinct Values for Filters (In a real app, these might be from a lookup table)
  // For now, we'll derive them from the approved professors to ensure we only show valid filters
  const { data: filterData } = await supabase
    .from("profiles")
    .select("institution, expertise_fields")
    .eq("role", "professor")
    .eq("status", "approved");

  const distinctInstitutions = Array.from(new Set(filterData?.map(p => p.institution).filter(Boolean) as string[])).sort();
  const distinctExpertise = Array.from(new Set(filterData?.flatMap(p => p.expertise_fields || []))).sort();

  return (
    <div className="min-h-screen bg-[var(--navy)]">
      {/* Background Polish */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_10%,rgba(212,146,42,0.03),transparent_70%)] pointer-events-none"></div>

      <main className="relative z-10 p-12 lg:p-24 max-w-7xl mx-auto">
        
        {/* Navigation / Header */}
        <header className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--ivory)] transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          
          <div className="max-w-3xl">
            <div className="text-[0.75rem] font-bold tracking-[0.2em] text-[var(--amber)] uppercase mb-3">Academic Bridge</div>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-[var(--ivory)] leading-tight mb-4">
              Discover your <em>intellectual mentor</em>
            </h1>
            <p className="text-[var(--text-muted)] text-lg leading-relaxed max-w-2xl font-light">
              Connect with verified experts across all academic disciplines. Every professor on Schollective is manually approved via their institutional credentials.
            </p>
          </div>
        </header>

        {/* Search & Filters */}
        <DirectorySearch 
          institutions={distinctInstitutions} 
          expertiseAreas={distinctExpertise} 
        />

        {/* Results Grid */}
        {professors && professors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {professors.map((prof) => (
              <ProfessorCard key={prof.id} professor={prof as any} />
            ))}
          </div>
        ) : (
          /* Empty State for Search */
          <div className="bg-[rgba(17,34,64,0.3)] border border-dashed border-[rgba(155,175,192,0.15)] rounded-[40px] p-24 text-center backdrop-blur-sm animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-[rgba(212,146,42,0.1)] rounded-full flex items-center justify-center mx-auto mb-8 border border-[rgba(212,146,42,0.2)]">
              <Inbox size={32} className="text-[var(--amber)]" />
            </div>
            <h3 className="font-serif text-3xl text-[var(--ivory)] mb-4 font-light text-center">No mentors found</h3>
            <p className="text-[var(--text-muted)] max-w-md mx-auto mb-10 text-lg leading-relaxed">
              We couldn't find any approved professors matching your current filters. Try broadening your search or expertise selection.
            </p>
            <Link href="/professors">
              <Button variant="outline" size="lg">Reset All Filters</Button>
            </Link>
          </div>
        )}
        
        {/* Footer Polish */}
        <footer className="mt-32 pt-16 border-t border-[rgba(155,175,192,0.1)] text-center">
          <div className="font-serif text-2xl text-[var(--ivory)] mb-4">Schol<span>lective</span></div>
          <div className="text-[var(--text-muted)] text-xs uppercase tracking-widest opacity-50">
            Connecting expertise with aspiration since 2025.
          </div>
        </footer>
      </main>
    </div>
  );
}
