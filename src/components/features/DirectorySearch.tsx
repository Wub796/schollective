"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
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
    <div className="mb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
        {/* Query */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[0.62rem] font-bold text-[rgba(250,250,249,0.3)] uppercase tracking-[0.2em] pl-1">
            Search Experts
          </label>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(250, 250, 249, 0.3)",
                pointerEvents: "none",
                flexShrink: 0,
              }}
            />
            <input
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateSearch({ query: draftQuery })}
              placeholder="Search by name, topic, or field…"
              style={{
                width: "100%",
                height: "2.75rem",
                paddingLeft: "2.5rem",
                paddingRight: "1rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                background: "rgba(17, 17, 19, 0.6)",
                border: "1px solid rgba(129, 140, 248, 0.12)",
                borderRadius: "0.75rem",
                color: "#fafaf9",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.2s, background 0.2s",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.5)";
                e.currentTarget.style.background = "rgba(17, 17, 19, 0.85)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.12)";
                e.currentTarget.style.background = "rgba(17, 17, 19, 0.6)";
              }}
            />
          </div>
        </div>


        {/* Institution */}
        <div className="space-y-2">
          <label className="text-[0.62rem] font-bold text-[rgba(250,250,249,0.3)] uppercase tracking-[0.2em] pl-1">
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
          <label className="text-[0.62rem] font-bold text-[rgba(250,250,249,0.3)] uppercase tracking-[0.2em] pl-1">
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
            className="bg-[rgba(129,140,248,0.15)] text-[rgba(250,250,249,0.9)] px-5 py-2 rounded-lg text-[0.68rem] font-bold uppercase tracking-widest hover:bg-[rgba(129,140,248,0.25)] transition-colors"
          >
            Apply Filters
          </button>
          {(draftQuery || currentInstitution !== "all" || currentExpertise !== "all") && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-[rgba(250,250,249,0.35)] text-[0.68rem] hover:text-[rgba(250,250,249,0.65)] transition-colors"
            >
              <X size={12} />
              Clear All
            </button>
          )}
        </div>
        <div className="text-[0.62rem] text-[rgba(250,250,249,0.25)] font-medium hidden sm:block">
          Filter through our network of verified academic mentors.
        </div>
      </div>
    </div>
  );
}
