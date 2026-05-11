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
    <div className="bg-[rgba(250, 250, 249, 0.02)] border border-[rgba(250, 250, 249, 0.06)] rounded-2xl p-6 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
        {/* Query */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[0.62rem] font-bold text-[#3a3a3a] uppercase tracking-[0.2em] pl-1">
            Search Experts
          </label>
          <div className="relative group">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3a3a3a] group-focus-within:text-[#8a8a8a] transition-colors"
            />
            <Input
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateSearch({ query: draftQuery })}
              className="pl-10"
              placeholder="Search by name, topic, or field…"
            />
          </div>
        </div>

        {/* Institution */}
        <div className="space-y-2">
          <label className="text-[0.62rem] font-bold text-[#3a3a3a] uppercase tracking-[0.2em] pl-1">
            Institution
          </label>
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

        {/* Expertise */}
        <div className="space-y-2">
          <label className="text-[0.62rem] font-bold text-[#3a3a3a] uppercase tracking-[0.2em] pl-1">
            Expertise Area
          </label>
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

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex gap-3">
          <button
            onClick={() => updateSearch({ query: draftQuery })}
            className="bg-[#e8e8e6] text-[#0d0d0d] px-5 py-2 rounded-lg text-[0.68rem] font-bold uppercase tracking-widest hover:bg-[#f2f2f0] transition-colors"
          >
            Apply Filters
          </button>
          {(draftQuery || currentInstitution !== "all" || currentExpertise !== "all") && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-[#3a3a3a] text-[0.68rem] hover:text-[#8a8a8a] transition-colors"
            >
              <X size={12} />
              Clear All
            </button>
          )}
        </div>
        <div className="text-[0.62rem] text-[#3a3a3a] font-medium hidden sm:block">
          Filter through our network of verified academic mentors.
        </div>
      </div>
    </div>
  );
}
