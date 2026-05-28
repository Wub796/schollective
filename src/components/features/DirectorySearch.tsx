"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-7 items-end">
        {/* Query */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[0.62rem] font-bold text-[rgba(15, 23, 42,0.3)] uppercase tracking-[0.2em] pl-4">
            Search Experts
          </label>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "1.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(15, 23, 42, 0.3)",
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
                height: "3rem",
                paddingLeft: "3.25rem",
                paddingRight: "1.75rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                background: "rgba(255, 255, 255, 0.6)",
                border: "1px solid var(--border)",
                borderRadius: "100px",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.25s ease, background-0.25s ease, box-shadow 0.25s ease",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Institution */}
        <div className="space-y-2">
          <label className="text-[0.62rem] font-bold text-[rgba(15, 23, 42,0.3)] uppercase tracking-[0.2em] pl-4">
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
          <label className="text-[0.62rem] font-bold text-[rgba(15, 23, 42,0.3)] uppercase tracking-[0.2em] pl-4">
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

      <div className="mt-5 flex items-center justify-between gap-8">
        <div className="flex gap-4">
          <Button
            onClick={() => updateSearch({ query: draftQuery })}
            size="sm"
          >
            Apply Filters
          </Button>
          {(draftQuery || currentInstitution !== "all" || currentExpertise !== "all") && (
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="gap-1.5"
            >
              <X size={12} />
              Clear All
            </Button>
          )}
        </div>
        <div className="text-[0.62rem] text-[rgba(15, 23, 42,0.25)] font-medium hidden sm:block">
          Filter through our network of verified academic mentors.
        </div>
      </div>
    </div>
  );
}
