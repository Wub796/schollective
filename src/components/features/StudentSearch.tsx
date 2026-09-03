"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchStudents, type SearchResult } from "@/app/(dashboard)/friends/actions";
import { PersonRow } from "@/components/features/PersonRow";
import { FriendshipControls } from "@/components/features/FriendshipControls";
import { fullName } from "@/lib/people";
import type { StudentCard } from "@/lib/neon/social";

const DEBOUNCE_MS = 300;

interface StudentSearchProps {
  /** Classmates at the viewer's institution, shown before anything is typed. */
  suggestions: StudentCard[];
  institution: string | null;
}

const hintStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--text-secondary)",
  opacity: 0.75,
  lineHeight: 1.7,
  fontFamily: "var(--font-sans)",
  padding: "0.25rem 0.25rem 0",
};

const listLabelStyle: React.CSSProperties = {
  fontSize: "0.58rem",
  fontWeight: 800,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--accent)",
  fontFamily: "var(--font-sans, monospace)",
};

export function StudentSearch({ suggestions, institution }: StudentSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Each search gets a number; only the newest may write its answer, so a slow
  // earlier response can never replace the results for what is typed now.
  const latestSearch = useRef(0);

  useEffect(() => {
    const term = query.trim();
    const searchNumber = ++latestSearch.current;

    if (term.length < 2) {
      setResults(null);
      setSearching(false);
      setError(null);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await searchStudents(term);
        if (searchNumber !== latestSearch.current) return;
        if ("error" in response) {
          setError(response.error);
          setResults([]);
        } else {
          setError(null);
          setResults(response.results);
        }
      } catch {
        if (searchNumber === latestSearch.current) {
          setError("Search is unavailable right now.");
          setResults([]);
        }
      } finally {
        if (searchNumber === latestSearch.current) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const renderRow = (student: StudentCard, state: SearchResult["state"]) => (
    <PersonRow
      key={student.id}
      person={student}
      href={`/students/${student.id}`}
      actions={<FriendshipControls studentId={student.id} studentName={fullName(student)} initialState={state} />}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={15}
          aria-hidden="true"
          style={{ position: "absolute", left: "1.5rem", top: "50%", transform: "translateY(-50%)", color: "rgba(15, 23, 42, 0.35)", pointerEvents: "none" }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students by name or school…"
          aria-label="Search students by name or school"
          autoComplete="off"
          style={{
            width: "100%",
            height: "3.25rem",
            paddingLeft: "3.5rem",
            paddingRight: "3.25rem",
            background: "rgba(255, 255, 255, 0.85)",
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
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.boxShadow = "0 0 0 4px rgba(79, 70, 229, 0.08)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.85)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {searching && (
          <Loader2
            size={15}
            className="animate-spin"
            aria-hidden="true"
            style={{ position: "absolute", right: "1.5rem", top: "50%", marginTop: "-7.5px", color: "var(--accent)" }}
          />
        )}
      </div>

      <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {results === null ? (
          suggestions.length > 0 ? (
            <>
              <span style={listLabelStyle}>
                {institution ? `Classmates at ${institution}` : "Classmates you may know"}
              </span>
              {suggestions.map((student) => renderRow(student, "none"))}
            </>
          ) : (
            <p style={hintStyle}>
              Type at least two letters of a name or school. Students appear once they have finished setting up their profile.
            </p>
          )
        ) : error ? (
          <p style={{ ...hintStyle, color: "#dc2626", opacity: 1 }}>{error}</p>
        ) : results.length === 0 ? (
          searching ? null : (
            <p style={hintStyle}>
              No students match &ldquo;{query.trim()}&rdquo;. Check the spelling, or try their school instead.
            </p>
          )
        ) : (
          <>
            <span style={listLabelStyle}>
              {results.length} student{results.length === 1 ? "" : "s"}
            </span>
            {results.map((student) => renderRow(student, student.state))}
          </>
        )}
      </div>
    </div>
  );
}
