"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface DirectorySearchProps {
  institutions: string[];
  expertiseAreas: string[];
}

export function DirectorySearch({ institutions, expertiseAreas }: DirectorySearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search input query draft
  const [draftQuery, setDraftQuery] = useState(searchParams.get("query") || "");

  // Desktop expertise dropdown open state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expertiseSearch, setExpertiseSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mobile filters bottom sheet open state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
    setIsMobileFiltersOpen(false);
    router.push("/professors");
  };

  const currentInstitution = searchParams.get("institution") || "all";
  const currentSort = searchParams.get("sort") || "relevance";
  const currentAccepting = searchParams.get("accepting") !== "false";

  // Expertise array from query params (comma-separated)
  const currentExpertiseParam = searchParams.get("expertise") || "";
  const selectedExpertise = currentExpertiseParam
    ? currentExpertiseParam.split(",").map(decodeURIComponent).filter(Boolean)
    : [];

  const handleToggleExpertise = (area: string) => {
    let newSelected: string[];
    if (selectedExpertise.includes(area)) {
      newSelected = selectedExpertise.filter((a) => a !== area);
    } else {
      newSelected = [...selectedExpertise, area];
    }
    updateSearch({ expertise: newSelected.join(",") });
  };

  const handleToggleAccepting = () => {
    updateSearch({ accepting: currentAccepting ? "false" : "true" });
  };

  // Filter expertise areas by input search
  const filteredExpertise = expertiseAreas.filter((area) =>
    area.toLowerCase().includes(expertiseSearch.toLowerCase())
  );

  return (
    <div className="mb-10">
      {/* ── DESKTOP FILTER GRID (hidden on mobile, visible on md+) ── */}
      <div className="hidden md:grid grid-cols-12 gap-5 items-end">
        {/* Search Input (Query) */}
        <div className="col-span-4 space-y-2">
          <label className="text-[0.62rem] font-bold text-[rgba(15,23,42,0.3)] uppercase tracking-[0.2em] pl-4">
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
                transition: "all 0.25s ease",
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

        {/* Institution Select */}
        <div className="col-span-3 space-y-2">
          <label className="text-[0.62rem] font-bold text-[rgba(15,23,42,0.3)] uppercase tracking-[0.2em] pl-4">
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

        {/* Expertise Multi-Select Dropdown */}
        <div className="col-span-3 space-y-2" ref={dropdownRef} style={{ position: "relative" }}>
          <label className="text-[0.62rem] font-bold text-[rgba(15,23,42,0.3)] uppercase tracking-[0.2em] pl-4">
            Expertise Area
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: "flex",
              height: "3rem",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "100px",
              paddingLeft: "2rem",
              paddingRight: "1.5rem",
              fontSize: "0.875rem",
              background: isDropdownOpen ? "rgba(15, 23, 42, 0.04)" : "rgba(15, 23, 42, 0.02)",
              border: `1px solid ${isDropdownOpen ? "rgba(147, 51, 234, 0.4)" : "rgba(15, 23, 42, 0.08)"}`,
              color: "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
              {selectedExpertise.length === 0
                ? "All Expertise"
                : `${selectedExpertise.length} selected`}
            </span>
            <ChevronDown size={14} style={{ color: "rgba(15, 23, 42, 0.3)" }} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute",
                  top: "105%",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "#ffffff",
                  border: "1px solid rgba(15, 23, 42, 0.1)",
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 12px -6px rgba(0, 0, 0, 0.1)",
                  padding: "0.85rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <input
                  type="text"
                  value={expertiseSearch}
                  onChange={(e) => setExpertiseSearch(e.target.value)}
                  placeholder="Filter expertise..."
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    fontSize: "0.8rem",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    borderRadius: "100px",
                    outline: "none",
                    background: "rgba(15, 23, 42, 0.01)",
                  }}
                />
                <div style={{ maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {filteredExpertise.length === 0 ? (
                    <span style={{ fontSize: "0.75rem", color: "rgba(15, 23, 42, 0.4)", textAlign: "center", padding: "0.5rem" }}>
                      No results found
                    </span>
                  ) : (
                    filteredExpertise.map((area) => {
                      const isChecked = selectedExpertise.includes(area);
                      return (
                        <div
                          key={area}
                          onClick={() => handleToggleExpertise(area)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.45rem 0.75rem",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            background: isChecked ? "rgba(147, 51, 234, 0.05)" : "transparent",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = isChecked ? "rgba(147, 51, 234, 0.08)" : "rgba(15, 23, 42, 0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = isChecked ? "rgba(147, 51, 234, 0.05)" : "transparent")}
                        >
                          <span style={{ color: isChecked ? "rgb(147, 51, 234)" : "rgba(15, 23, 42, 0.8)", fontWeight: isChecked ? 600 : 400 }}>
                            {area}
                          </span>
                          {isChecked && <Check size={12} color="rgb(147, 51, 234)" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort Select */}
        <div className="col-span-2 space-y-2">
          <label className="text-[0.62rem] font-bold text-[rgba(15,23,42,0.3)] uppercase tracking-[0.2em] pl-4">
            Sort By
          </label>
          <Select
            value={currentSort}
            onChange={(e) => updateSearch({ sort: e.target.value })}
          >
            <option value="relevance">Relevance</option>
            <option value="recent">Most Recent</option>
            <option value="alpha">Alphabetical</option>
          </Select>
        </div>
      </div>

      {/* ── MOBILE FILTER INTERFACE (visible on mobile, hidden on md+) ── */}
      <div className="grid md:hidden grid-cols-12 gap-3 items-center">
        {/* Simple search bar */}
        <div className="col-span-9" style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "1.2rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(15, 23, 42, 0.3)",
              pointerEvents: "none",
            }}
          />
          <input
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateSearch({ query: draftQuery })}
            placeholder="Search mentors..."
            style={{
              width: "100%",
              height: "2.6rem",
              paddingLeft: "2.6rem",
              paddingRight: "1.2rem",
              background: "rgba(255, 255, 255, 0.7)",
              border: "1px solid var(--border)",
              borderRadius: "100px",
              color: "var(--text-primary)",
              fontSize: "0.82rem",
              outline: "none",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        {/* Filter Trigger Button */}
        <div className="col-span-3">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              width: "100%",
              height: "2.6rem",
              borderRadius: "100px",
              border: "1px solid rgba(15, 23, 42, 0.1)",
              background: "rgba(15, 23, 42, 0.02)",
              color: "rgba(15, 23, 42, 0.7)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={12} />
            Filter
          </button>
        </div>
      </div>

      {/* Availability & Actions row */}
      <div className="mt-5 flex items-center justify-between gap-8 flex-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={() => updateSearch({ query: draftQuery })}
              size="sm"
            >
              Apply Search
            </Button>
            {(draftQuery || currentInstitution !== "all" || selectedExpertise.length > 0 || currentSort !== "relevance" || searchParams.get("accepting") === "false") && (
              <Button
                onClick={handleClear}
                variant="ghost"
                size="sm"
                className="gap-1.5 animate-fade-in"
              >
                <X size={12} />
                Clear All
              </Button>
            )}
          </div>

          {/* Availability Toggle */}
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={currentAccepting}
              onChange={handleToggleAccepting}
              style={{ display: "none" }}
            />
            <div style={{
              width: "2.2rem",
              height: "1.2rem",
              borderRadius: "100px",
              background: currentAccepting ? "var(--accent)" : "rgba(15, 23, 42, 0.15)",
              position: "relative",
              transition: "background 0.25s",
              border: "1px solid rgba(15, 23, 42, 0.05)",
            }}>
              <div style={{
                width: "0.9rem",
                height: "0.9rem",
                borderRadius: "50%",
                background: "#ffffff",
                position: "absolute",
                top: "50%",
                left: currentAccepting ? "calc(100% - 1.05rem)" : "0.15rem",
                transform: "translateY(-50%)",
                transition: "left 0.25s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }} />
            </div>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.65)", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "var(--font-sans)" }}>
              Accepting Requests Only
            </span>
          </label>
        </div>

        <div className="text-[0.62rem] text-[rgba(15, 23, 42,0.25)] font-medium hidden sm:block">
          Filter through our network of verified academic mentors.
        </div>
      </div>

      {/* ── MOBILE BOTTOM SHEET FILTER MODAL ── */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "#000000",
                zIndex: 100,
              }}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                background: "#ffffff",
                borderTopLeftRadius: "24px",
                borderTopRightRadius: "24px",
                boxShadow: "0 -10px 25px rgba(0,0,0,0.1)",
                zIndex: 101,
                padding: "2rem 1.5rem 3rem",
                maxHeight: "85vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "1.75rem",
              }}
            >
              {/* Sheet Handle & Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  Search Filters
                </span>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  style={{
                    border: "none",
                    background: "rgba(15,23,42,0.05)",
                    borderRadius: "50%",
                    width: "1.75rem",
                    height: "1.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Institution Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(15,23,42,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
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

              {/* Expertise Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(15,23,42,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  Expertise Areas
                </label>
                <div style={{
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  borderRadius: "16px",
                  padding: "0.75rem",
                  maxHeight: "160px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}>
                  {expertiseAreas.map((area) => {
                    const isChecked = selectedExpertise.includes(area);
                    return (
                      <div
                        key={area}
                        onClick={() => handleToggleExpertise(area)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.4rem 0.5rem",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          background: isChecked ? "rgba(147, 51, 234, 0.05)" : "transparent",
                        }}
                      >
                        <span style={{ color: isChecked ? "rgb(147, 51, 234)" : "rgba(15, 23, 42, 0.7)", fontWeight: isChecked ? 600 : 400 }}>
                          {area}
                        </span>
                        {isChecked && <Check size={12} color="rgb(147, 51, 234)" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sort Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(15,23,42,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  Sort By
                </label>
                <Select
                  value={currentSort}
                  onChange={(e) => updateSearch({ sort: e.target.value })}
                >
                  <option value="relevance">Relevance</option>
                  <option value="recent">Most Recent</option>
                  <option value="alpha">Alphabetical</option>
                </Select>
              </div>

              {/* Sheet Actions */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  onClick={handleClear}
                  style={{
                    flex: 1,
                    height: "3rem",
                    borderRadius: "100px",
                    border: "1px solid rgba(15,23,42,0.15)",
                    background: "#ffffff",
                    color: "rgba(15,23,42,0.7)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  style={{
                    flex: 2,
                    height: "3rem",
                    borderRadius: "100px",
                    border: "none",
                    background: "var(--accent)",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
