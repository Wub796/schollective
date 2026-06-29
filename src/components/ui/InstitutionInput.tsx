"use client";

import React, { useState, useRef, useEffect } from "react";

interface InstitutionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

/**
 * A smart autocomplete input backed by the server-side US university database
 * (~2,300 institutions). Uses debounced fetch to remain extremely lightweight on the client.
 */
export function InstitutionInput({
  value,
  onChange,
  placeholder = "e.g. Massachusetts Institute of Technology",
  id,
  name,
}: InstitutionInputProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search fetch
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // If suggestion matches value exactly, don't refetch
    if (suggestions.length === 1 && suggestions[0] === value) {
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/universities?q=${encodeURIComponent(value)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0 && focused);
      } catch (err) {
        console.error("Failed to fetch universities:", err);
      } finally {
        setLoading(false);
      }
    }, 250); // 250ms debounce

    return () => clearTimeout(delayDebounce);
  }, [value, focused]);

  const select = (selectedName: string) => {
    onChange(selectedName);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlighted]) select(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setFocused(true);
          if (suggestions.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: "100%",
          background: "rgba(15, 23, 42, 0.02)",
          border: `1px solid ${focused ? "rgba(147, 51, 234, 0.4)" : "rgba(15, 23, 42, 0.08)"}`,
          borderRadius: "120px",
          padding: "0.95rem 3rem 0.95rem 1.75rem",
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          outline: "none",
          fontFamily: "var(--font-sans)",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: focused ? "0 0 0 3px rgba(147, 51, 234, 0.1)" : "none",
        }}
        onBlur={() => {
          setFocused(false);
          // Delay so dropdown click fires first
          setTimeout(() => setOpen(false), 200);
        }}
      />

      {loading && (
        <div style={{
          position: "absolute",
          right: "1.5rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "0.68rem",
          color: "rgba(15, 23, 42, 0.35)",
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          pointerEvents: "none"
        }}>
          Searching…
        </div>
      )}

      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "rgba(255, 255, 255, 0.98)",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          {suggestions.map((s, i) => {
            const isActive = i === highlighted;
            return (
              <button
                key={s}
                type="button"
                onMouseDown={() => select(s)}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.75rem 1.25rem",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-sans)",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  background: isActive ? "var(--accent-dim)" : "transparent",
                  border: "none",
                  borderBottom: i < suggestions.length - 1 ? "1px solid rgba(15, 23, 42, 0.04)" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {/* Highlight the matched portion */}
                <HighlightMatch text={s} query={value} />
              </button>
            );
          })}
          <div style={{
            padding: "0.5rem 1.25rem",
            fontSize: "0.56rem",
            color: "rgba(15, 23, 42, 0.3)",
            borderTop: "1px solid rgba(15, 23, 42, 0.04)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            Search US Academic Institutions
          </div>
        </div>
      )}
    </div>
  );
}

/** Bolds the matching characters in the suggestion text */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!queryWords.length) return <span>{text}</span>;

  // Find all match ranges
  const ranges: [number, number][] = [];
  for (const word of queryWords) {
    let idx = text.toLowerCase().indexOf(word);
    while (idx !== -1) {
      ranges.push([idx, idx + word.length]);
      idx = text.toLowerCase().indexOf(word, idx + 1);
    }
  }

  if (!ranges.length) return <span>{text}</span>;

  // Merge overlapping ranges
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [ranges[0]];
  for (const [s, e] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }

  // Build JSX
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const [s, e] of merged) {
    if (cursor < s) parts.push(text.slice(cursor, s));
    parts.push(
      <strong key={s} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
        {text.slice(s, e)}
      </strong>
    );
    cursor = e;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <span>{parts}</span>;
}
