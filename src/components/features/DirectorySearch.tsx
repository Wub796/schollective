"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface DirectorySearchProps {
  institutions: string[];
  expertiseAreas: string[];
}

export function DirectorySearch({ institutions, expertiseAreas }: DirectorySearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state only for the query input to avoid lag
  const [draftQuery, setDraftQuery] = useState(searchParams.get("query") || "");

  const updateSearch = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/professors?${params.toString()}`);
  };

  const handleClear = () => {
    setDraftQuery("");
    router.push("/professors");
  };

  const currentInstitution = searchParams.get("institution") || "all";
  const currentExpertise = searchParams.get("expertise") || "all";

  return (
    <div className="bg-[rgba(17,34,64,0.3)] border border-[rgba(155,175,192,0.1)] rounded-[32px] p-8 mb-12 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="md:col-span-2 space-y-2">
          <label className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Search Experts</label>
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--amber)] transition-colors" />
            <Input 
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateSearch({ query: draftQuery })}
              className="pl-12"
              placeholder="Search by name, topic, or field..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Institution</label>
          <Select 
            value={currentInstitution} 
            onChange={(e) => updateSearch({ institution: e.target.value })}
          >
            <option value="all">All Institutions</option>
            {institutions.map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Expertise Area</label>
          <Select 
            value={currentExpertise} 
            onChange={(e) => updateSearch({ expertise: e.target.value })}
          >
            <option value="all">All Expertise</option>
            {expertiseAreas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-4">
          <button 
            onClick={() => updateSearch({ query: draftQuery })}
            className="bg-[var(--amber)] text-[var(--navy)] px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[var(--amber-light)] transition-all shadow-lg shadow-[var(--amber)]/10"
          >
            Apply Filters
          </button>
          {(draftQuery || currentInstitution !== "all" || currentExpertise !== "all") && (
            <button 
              onClick={handleClear}
              className="flex items-center gap-2 text-[var(--text-muted)] text-xs hover:text-[var(--ivory)] transition-colors"
            >
              <X size={14} />
              Clear All
            </button>
          )}
        </div>
        <div className="text-[0.7rem] text-[var(--text-muted)] font-medium tracking-wide">
          Filter through our network of verified academic mentors.
        </div>
      </div>
    </div>
  );
}
