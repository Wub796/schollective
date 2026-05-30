"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Mail, GraduationCap, Calendar, ChevronDown, RotateCcw, Ban, Check, X } from "lucide-react";
import { revokeVerification, setUserSuspended } from "@/app/admin/dashboard/admin-actions";
import { updateProfessorStatus } from "@/app/admin/dashboard/actions";
import { toast } from "sonner";

export interface ProfessorRecord {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  status: string | null;
  institution: string | null;
  expertise_fields: string[] | null;
  ai_score: number | null;
  ai_level: string | null;
  created_at: string;
}

type StatusFilter = "all" | "approved" | "pending" | "rejected" | "suspended";
type SortKey = "name" | "status" | "score" | "joined";

const STATUS_COLOUR: Record<string, string> = {
  approved:  "rgba(74,222,128,0.8)",
  pending:   "rgba(250,204,21,0.8)",
  rejected:  "rgba(248,113,113,0.8)",
  suspended: "rgba(239,68,68,0.8)",
};

function formatDate(iso: string) {
  try { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso)); }
  catch { return "—"; }
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-filter-pill" style={{ padding: "0.5rem 1.25rem", borderRadius: "100px", border: active ? "1px solid rgba(15, 23, 42,0.3)" : "1px solid rgba(15, 23, 42,0.07)", background: active ? "rgba(15, 23, 42,0.08)" : "transparent", color: active ? "var(--text-primary)" : "rgba(15, 23, 42,0.35)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

export function AdminProfessorsTable({ professors }: { professors: ProfessorRecord[] }) {
  const router = useRouter();
  const [query, setQuery]         = useState("");
  const [statusFilter, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey]     = useState<SortKey>("joined");
  const [sortAsc, setSortAsc]     = useState(false);
  const [busy, setBusy]           = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...professors];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => `${p.first_name} ${p.last_name} ${p.email} ${p.institution ?? ""}`.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    list.sort((a, b) => {
      // Prioritize pending professors at the top of the queue
      const aPending = a.status === "pending" ? 1 : 0;
      const bPending = b.status === "pending" ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;

      let cmp = 0;
      if (sortKey === "name")   cmp = `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`);
      if (sortKey === "status") cmp = (a.status ?? "").localeCompare(b.status ?? "");
      if (sortKey === "score")  cmp = (a.ai_score ?? 0) - (b.ai_score ?? 0);
      if (sortKey === "joined") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [professors, query, statusFilter, sortKey, sortAsc]);

  const counts = useMemo(() => ({
    all: professors.length,
    approved:  professors.filter((p) => p.status === "approved").length,
    pending:   professors.filter((p) => p.status === "pending").length,
    rejected:  professors.filter((p) => p.status === "rejected").length,
    suspended: professors.filter((p) => p.status === "suspended").length,
  }), [professors]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc((v) => !v); else { setSortKey(k); setSortAsc(true); }
  }

  async function handleRevoke(id: string) {
    setBusy(id); await revokeVerification(id); router.refresh(); setBusy(null);
  }
  async function handleSuspend(id: string, suspend: boolean) {
    setBusy(id); await setUserSuspended(id, suspend); router.refresh(); setBusy(null);
  }
  async function handleApprove(id: string) {
    setBusy(id);
    const res = await updateProfessorStatus(id, "approved");
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Professor approved successfully!");
      router.refresh();
    }
    setBusy(null);
  }
  async function handleReject(id: string) {
    if (!confirm("Are you sure you want to reject this professor's application?")) return;
    setBusy(id);
    const res = await updateProfessorStatus(id, "rejected");
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Professor application rejected.");
      router.refresh();
    }
    setBusy(null);
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
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <div style={{ position: "relative", maxWidth: "24rem" }}>
          <Search size={13} style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "rgba(15, 23, 42,0.25)", pointerEvents: "none" }} />
          <input type="text" placeholder="Search professors…" value={query} onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", height: "2.5rem", padding: "0.5rem 1.5rem 0.5rem 2.75rem", background: "rgba(255,255,255,0.6)", border: "1px solid var(--border)", borderRadius: "100px", color: "var(--text-primary)", fontSize: "0.75rem", fontFamily: "var(--font-sans)", outline: "none", transition: "border-color 0.25s ease, background-0.25s ease, box-shadow 0.25s ease" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.background = "rgba(255,255,255,0.95)";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.08)";
            }}
            onBlur={(e)  => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "rgba(255,255,255,0.6)";
              e.currentTarget.style.boxShadow = "none";
            }} />
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {(["all", "approved", "pending", "rejected", "suspended"] as StatusFilter[]).map((s) => (
            <FilterPill key={s} label={`${s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s]})`} active={statusFilter === s} onClick={() => setStatus(s)} />
          ))}
        </div>
      </div>

      <div style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans, monospace)" }}>
        {filtered.length} {filtered.length === 1 ? "professor" : "professors"}
      </div>

      <div style={{ border: "1px solid rgba(15, 23, 42,0.06)", borderRadius: "14px", overflow: "hidden", background: "rgba(15, 23, 42,0.012)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(15, 23, 42,0.05)" }}>
                <SortTh col="name"   label="Professor" />
                <SortTh col="status" label="Status" />
                <th style={{ padding: "0.85rem 1.1rem", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap" }}>Institution</th>
                <th style={{ padding: "0.85rem 1.1rem", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans, monospace)", whiteSpace: "nowrap" }}>Expertise</th>
                <SortTh col="score"  label="Score" />
                <SortTh col="joined" label="Joined" />
                <th style={{ padding: "0.85rem 1.1rem", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans, monospace)", textAlign: "right", whiteSpace: "nowrap" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "3rem 1.1rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans)" }}>No professors match the current filters.</td></tr>
              ) : filtered.map((p) => {
                const name = `${p.preferred_name ?? p.first_name} ${p.last_name}`;
                const isBusy = busy === p.id;
                const isSuspended = p.status === "suspended";
                const sColor = STATUS_COLOUR[p.status ?? ""] ?? "rgba(15, 23, 42,0.3)";
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(15, 23, 42,0.04)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15, 23, 42,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <div style={{ width: "1.8rem", height: "1.8rem", borderRadius: "7px", background: "rgba(15, 23, 42,0.04)", border: "1px solid rgba(15, 23, 42,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem", fontWeight: 700, color: "rgba(15, 23, 42,0.4)", flexShrink: 0 }}>
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>Dr. {name}</div>
                          <div style={{ fontSize: "0.58rem", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: "0.25rem" }}><Mail size={8} />{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.52rem", fontWeight: 700, color: sColor, fontFamily: "var(--font-sans)", textTransform: "capitalize" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sColor, flexShrink: 0 }} />{p.status ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.68rem", color: "rgba(15, 23, 42,0.4)", fontFamily: "var(--font-sans)" }}>
                        <GraduationCap size={11} style={{ flexShrink: 0 }} />{p.institution ?? <em style={{ opacity: 0.4 }}>—</em>}
                      </span>
                    </td>
                    <td style={{ padding: "0.9rem 1.1rem", maxWidth: "180px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {(p.expertise_fields ?? []).slice(0, 2).map((f, i) => (
                          <span key={i} style={{ padding: "0.3rem 0.75rem", borderRadius: "5px", background: "rgba(15, 23, 42,0.04)", border: "1px solid rgba(15, 23, 42,0.06)", fontSize: "0.52rem", color: "rgba(15, 23, 42,0.4)", fontFamily: "var(--font-sans)" }}>{f}</span>
                        ))}
                        {(p.expertise_fields?.length ?? 0) > 2 && <span style={{ fontSize: "0.52rem", color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans)" }}>+{p.expertise_fields!.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      {p.ai_score != null
                        ? <span style={{ fontSize: "0.72rem", fontWeight: 700, color: p.ai_score >= 70 ? "rgba(74,222,128,0.8)" : p.ai_score >= 40 ? "rgba(250,204,21,0.8)" : "rgba(248,113,113,0.8)", fontFamily: "var(--font-sans, monospace)" }}>{p.ai_score}</span>
                        : <span style={{ color: "rgba(15, 23, 42,0.2)", fontSize: "0.6rem" }}>—</span>}
                    </td>
                    <td style={{ padding: "0.9rem 1.1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.58rem", color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans, monospace)" }}>
                        <Calendar size={9} />{formatDate(p.created_at)}
                      </div>
                    </td>
                    <td style={{ padding: "0.9rem 1.1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                        {p.status === "approved" && (
                          <button disabled={isBusy} onClick={() => handleRevoke(p.id)}
                            className="btn-action"
                            style={{ padding: "0.45rem 1.15rem", borderRadius: "100px", border: "1px solid rgba(250,204,21,0.2)", background: "rgba(250,204,21,0.05)", color: "rgba(250,204,21,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.5 : 1, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <RotateCcw size={9} />{isBusy ? "…" : "Revoke"}
                          </button>
                        )}
                        {p.status === "pending" && (
                          <>
                            <button disabled={isBusy} onClick={() => handleApprove(p.id)}
                              className="btn-action-success"
                              style={{ padding: "0.45rem 1.15rem", borderRadius: "100px", border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.05)", color: "rgba(74,222,128,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.5 : 1, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <Check size={9} />{isBusy ? "…" : "Approve"}
                            </button>
                            <button disabled={isBusy} onClick={() => handleReject(p.id)}
                              className="btn-action-danger"
                              style={{ padding: "0.45rem 1.15rem", borderRadius: "100px", border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.05)", color: "rgba(248,113,113,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.5 : 1, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <X size={9} />{isBusy ? "…" : "Reject"}
                            </button>
                          </>
                        )}
                        {p.status === "rejected" && (
                          <button disabled={isBusy} onClick={() => handleApprove(p.id)}
                            className="btn-action-success"
                            style={{ padding: "0.45rem 1.15rem", borderRadius: "100px", border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.05)", color: "rgba(74,222,128,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.5 : 1, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Check size={9} />{isBusy ? "…" : "Approve"}
                          </button>
                        )}
                        <button disabled={isBusy} onClick={() => handleSuspend(p.id, !isSuspended)}
                          className={isSuspended ? "btn-action-success" : "btn-action-danger"}
                          style={{ padding: "0.45rem 1.15rem", borderRadius: "100px", border: isSuspended ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(248,113,113,0.2)", background: isSuspended ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)", color: isSuspended ? "rgba(74,222,128,0.75)" : "rgba(248,113,113,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.5 : 1, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          {isSuspended ? <><RotateCcw size={9} />{isBusy ? "…" : "Reactivate"}</> : <><Ban size={9} />{isBusy ? "…" : "Suspend"}</>}
                        </button>
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
