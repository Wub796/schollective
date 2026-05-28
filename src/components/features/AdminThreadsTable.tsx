"use client";

import React, { useState, useMemo } from "react";
import { Search, Calendar, ChevronDown } from "lucide-react";

export interface ThreadRecord {
  id: string;
  status: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  student:   { id: string; first_name: string; last_name: string; email: string } | null;
  professor: { id: string; first_name: string; last_name: string; institution: string | null } | null;
}

type StatusFilter = "all" | "active" | "pending" | "closed";
type SortKey = "subject" | "status" | "student" | "professor" | "created" | "updated";

const STATUS_COLOUR: Record<string, string> = {
  active:  "rgba(74,222,128,0.8)",
  pending: "rgba(250,204,21,0.8)",
  closed:  "rgba(148,163,184,0.55)",
};

function formatDate(iso: string) {
  try { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso)); }
  catch { return "—"; }
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-filter-pill" style={{ padding: "0.35rem 0.85rem", borderRadius: "100px", border: active ? "1px solid rgba(15, 23, 42,0.3)" : "1px solid rgba(15, 23, 42,0.07)", background: active ? "rgba(15, 23, 42,0.08)" : "transparent", color: active ? "#fafaf9" : "rgba(15, 23, 42,0.35)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

export function AdminThreadsTable({ threads }: { threads: ThreadRecord[] }) {
  const [query, setQuery]         = useState("");
  const [statusFilter, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey]     = useState<SortKey>("created");
  const [sortAsc, setSortAsc]     = useState(false);

  const filtered = useMemo(() => {
    let list = [...threads];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => {
        const sName = t.student ? `${t.student.first_name} ${t.student.last_name} ${t.student.email}` : "";
        const pName = t.professor ? `${t.professor.first_name} ${t.professor.last_name}` : "";
        return `${t.subject ?? ""} ${sName} ${pName}`.toLowerCase().includes(q);
      });
    }
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "subject")   cmp = (a.subject ?? "").localeCompare(b.subject ?? "");
      if (sortKey === "status")    cmp = a.status.localeCompare(b.status);
      if (sortKey === "student")   cmp = `${a.student?.last_name}`.localeCompare(`${b.student?.last_name}`);
      if (sortKey === "professor") cmp = `${a.professor?.last_name}`.localeCompare(`${b.professor?.last_name}`);
      if (sortKey === "created")   cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortKey === "updated")   cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [threads, query, statusFilter, sortKey, sortAsc]);

  const counts = useMemo(() => ({
    all:     threads.length,
    active:  threads.filter((t) => t.status === "active").length,
    pending: threads.filter((t) => t.status === "pending").length,
    closed:  threads.filter((t) => t.status === "closed").length,
  }), [threads]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc((v) => !v); else { setSortKey(k); setSortAsc(true); }
  }

  function SortTh({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th onClick={() => toggleSort(col)} style={{ padding: "0.85rem 1.1rem", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: active ? "rgba(15, 23, 42,0.55)" : "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans, monospace)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {label}<ChevronDown size={9} style={{ opacity: active ? 1 : 0.3, transform: active && sortAsc ? "rotate(180deg)" : "none", transition: "transform 0.18s" }} />
        </span>
      </th>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Search + filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <div style={{ position: "relative", maxWidth: "26rem" }}>
          <Search size={13} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(15, 23, 42,0.25)", pointerEvents: "none" }} />
          <input type="text" placeholder="Search by subject, student, or professor…" value={query} onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "0.6rem 1rem 0.6rem 2.4rem", background: "rgba(15, 23, 42,0.03)", border: "1px solid rgba(15, 23, 42,0.08)", borderRadius: "10px", color: "var(--text-primary)", fontSize: "0.75rem", fontFamily: "var(--font-sans)", outline: "none" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(15, 23, 42,0.2)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(15, 23, 42,0.08)")} />
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["all", "active", "pending", "closed"] as StatusFilter[]).map((s) => (
            <FilterPill key={s} label={`${s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s]})`} active={statusFilter === s} onClick={() => setStatus(s)} />
          ))}
        </div>
      </div>

      <div style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans, monospace)" }}>
        {filtered.length} {filtered.length === 1 ? "thread" : "threads"}
      </div>

      <div style={{ border: "1px solid rgba(15, 23, 42,0.06)", borderRadius: "14px", overflow: "hidden", background: "rgba(15, 23, 42,0.012)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15, 23, 42,0.05)" }}>
                <SortTh col="subject"   label="Subject" />
                <SortTh col="status"    label="Status" />
                <SortTh col="student"   label="Student" />
                <SortTh col="professor" label="Professor" />
                <SortTh col="created"   label="Started" />
                <SortTh col="updated"   label="Last Activity" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "3rem 1.1rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans)" }}>No threads match the current filters.</td></tr>
              ) : filtered.map((t) => {
                const sColor = STATUS_COLOUR[t.status] ?? "rgba(15, 23, 42,0.3)";
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(15, 23, 42,0.04)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15, 23, 42,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

                    {/* Subject */}
                    <td style={{ padding: "0.9rem 1.1rem", maxWidth: "220px" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 500, color: t.subject ? "#fafaf9" : "rgba(15, 23, 42,0.25)", fontFamily: "var(--font-sans)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: t.subject ? "normal" : "italic" }}>
                        {t.subject ?? "No subject"}
                      </span>
                      <span style={{ fontSize: "0.52rem", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans, monospace)" }}>
                        #{t.id.slice(0, 8)}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.52rem", fontWeight: 700, color: sColor, fontFamily: "var(--font-sans)", textTransform: "capitalize" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sColor, flexShrink: 0 }} />{t.status}
                      </span>
                    </td>

                    {/* Student */}
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      {t.student ? (
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{t.student.first_name} {t.student.last_name}</div>
                          <div style={{ fontSize: "0.55rem", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans)" }}>{t.student.email}</div>
                        </div>
                      ) : <span style={{ color: "rgba(15, 23, 42,0.2)", fontSize: "0.6rem" }}>—</span>}
                    </td>

                    {/* Professor */}
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      {t.professor ? (
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>Dr. {t.professor.first_name} {t.professor.last_name}</div>
                          <div style={{ fontSize: "0.55rem", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans)" }}>{t.professor.institution ?? "—"}</div>
                        </div>
                      ) : <span style={{ color: "rgba(15, 23, 42,0.2)", fontSize: "0.6rem" }}>—</span>}
                    </td>

                    {/* Started */}
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.58rem", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans, monospace)" }}>
                        <Calendar size={9} />{formatDate(t.created_at)}
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.58rem", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans, monospace)" }}>
                        <Calendar size={9} />{formatDate(t.updated_at)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
