"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Users,
  GraduationCap,
  ShieldCheck,
  Mail,
  Calendar,
  ChevronDown,
  Ban,
  RotateCcw,
} from "lucide-react";
import { setUserSuspended } from "@/app/admin/dashboard/admin-actions";
import { useRouter } from "next/navigation";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface UserRecord {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  role: "student" | "professor" | "admin";
  status: string | null;
  institution: string | null;
  created_at: string;
}

interface AdminUsersTableProps {
  users: UserRecord[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
type RoleFilter   = "all" | "student" | "professor" | "admin";
type StatusFilter = "all" | "active" | "pending" | "approved" | "suspended" | "rejected";
type SortKey      = "name" | "role" | "joined";

const ROLE_ICON: Record<string, React.ReactNode> = {
  student:   <Users size={11} />,
  professor: <GraduationCap size={11} />,
  admin:     <ShieldCheck size={11} />,
};

const ROLE_COLOUR: Record<string, string> = {
  student:   "rgba(100, 180, 255, 0.8)",
  professor: "rgba(140, 220, 140, 0.8)",
  admin:     "rgba(255, 160, 80, 0.8)",
};

const STATUS_COLOUR: Record<string, string> = {
  active:    "rgba(100, 220, 120, 0.8)",
  approved:  "rgba(100, 220, 120, 0.8)",
  pending:   "rgba(255, 200, 60, 0.8)",
  suspended: "rgba(255, 80, 80, 0.8)",
  rejected:  "rgba(180, 80, 80, 0.8)",
};

function effectiveStatus(u: UserRecord): string {
  const raw = u.status ?? (u.role === "student" ? "active" : "active");
  // Normalise DB value "approved" → "active" so filters and display agree
  return raw === "approved" ? "active" : raw;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

/* ─── Pill filter button ─────────────────────────────────────────────────── */
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="btn-filter-pill"
      style={{
        padding: "0.35rem 0.85rem",
        borderRadius: "100px",
        border: active
          ? "1px solid rgba(250, 250, 249, 0.3)"
          : "1px solid rgba(250, 250, 249, 0.07)",
        background: active ? "rgba(250, 250, 249, 0.08)" : "transparent",
        color: active ? "#fafaf9" : "rgba(250, 250, 249, 0.35)",
        fontSize: "0.55rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontFamily: "var(--font-sans)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const router = useRouter();
  const [query,        setQuery]        = useState("");
  const [roleFilter,   setRoleFilter]   = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey,      setSortKey]      = useState<SortKey>("joined");
  const [sortAsc,      setSortAsc]      = useState(false);
  const [suspending,   setSuspending]   = useState<string | null>(null);

  /* ── Derived list ── */
  const filtered = useMemo(() => {
    let list = [...users];

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((u) =>
        `${u.first_name} ${u.last_name} ${u.email} ${u.institution ?? ""}`.toLowerCase().includes(q)
      );
    }

    // Role
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);

    // Status
    if (statusFilter !== "all") {
      list = list.filter((u) => effectiveStatus(u) === statusFilter);
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")   cmp = `${a.last_name}${a.first_name}`.localeCompare(`${b.last_name}${b.first_name}`);
      if (sortKey === "role")   cmp = a.role.localeCompare(b.role);
      if (sortKey === "joined") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [users, query, roleFilter, statusFilter, sortKey, sortAsc]);

  /* ── Sort toggle ── */
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  /* ── Suspend / reactivate ── */
  async function handleSuspend(userId: string, suspend: boolean) {
    setSuspending(userId);
    await setUserSuspended(userId, suspend);
    router.refresh();
    setSuspending(null);
  }

  /* ── Counts for filter pills ── */
  const counts = useMemo(() => ({
    all:       users.length,
    student:   users.filter((u) => u.role === "student").length,
    professor: users.filter((u) => u.role === "professor").length,
    admin:     users.filter((u) => u.role === "admin").length,
  }), [users]);

  const statusCounts = useMemo(() => ({
    all:       users.length,
    active:    users.filter((u) => effectiveStatus(u) === "active").length,
    pending:   users.filter((u) => effectiveStatus(u) === "pending").length,
    suspended: users.filter((u) => effectiveStatus(u) === "suspended").length,
  }), [users]);

  /* ── Sort header cell ── */
  function SortTh({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        onClick={() => toggleSort(col)}
        style={{
          padding: "0.85rem 1.25rem",
          fontSize: "0.5rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: active ? "rgba(250,250,249,0.55)" : "rgba(250,250,249,0.2)",
          fontFamily: "var(--font-mono, monospace)",
          cursor: "pointer",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {label}
          <ChevronDown
            size={10}
            style={{
              opacity: active ? 1 : 0.3,
              transform: active && sortAsc ? "rotate(180deg)" : "none",
              transition: "transform 0.18s",
            }}
          />
        </span>
      </th>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Search + filters bar ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* Search input */}
        <div style={{ position: "relative", maxWidth: "26rem" }}>
          <Search
            size={14}
            style={{
              position: "absolute", left: "0.9rem", top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(250,250,249,0.25)", pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, or institution…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem 1rem 0.65rem 2.5rem",
              background: "rgba(250,250,249,0.03)",
              border: "1px solid rgba(250,250,249,0.08)",
              borderRadius: "10px",
              color: "#fafaf9",
              fontSize: "0.78rem",
              fontFamily: "var(--font-sans)",
              outline: "none",
              transition: "border-color 0.18s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(250,250,249,0.2)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(250,250,249,0.08)")}
          />
        </div>

        {/* Filter pills row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          {/* Role filters */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["all", "student", "professor", "admin"] as RoleFilter[]).map((r) => (
              <FilterPill
                key={r}
                label={`${r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)} (${counts[r as keyof typeof counts] ?? 0})`}
                active={roleFilter === r}
                onClick={() => setRoleFilter(r)}
              />
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "18px", background: "rgba(250,250,249,0.08)", flexShrink: 0 }} />

          {/* Status filters */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["all", "active", "pending", "suspended"] as StatusFilter[]).map((s) => (
              <FilterPill
                key={s}
                label={`${s === "all" ? "Any Status" : s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s as keyof typeof statusCounts] ?? 0})`}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Results count ── */}
      <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250,250,249,0.2)", fontFamily: "var(--font-mono, monospace)" }}>
        {filtered.length} {filtered.length === 1 ? "account" : "accounts"} found
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden lg:block" style={{ border: "1px solid rgba(250,250,249,0.06)", borderRadius: "14px", overflow: "hidden", background: "rgba(250,250,249,0.015)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(250,250,249,0.05)" }}>
                <SortTh col="name"   label="Account" />
                <SortTh col="role"   label="Role" />
                <th style={{ padding: "0.85rem 1.25rem", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,250,249,0.2)", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>Status</th>
                <th style={{ padding: "0.85rem 1.25rem", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,250,249,0.2)", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>Institution</th>
                <SortTh col="joined" label="Joined" />
                <th style={{ padding: "0.85rem 1.25rem", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,250,249,0.2)", fontFamily: "var(--font-mono, monospace)", textAlign: "right", whiteSpace: "nowrap" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3.5rem 1.25rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(250,250,249,0.2)", fontFamily: "var(--font-sans)" }}>
                    No accounts match the current filters.
                  </td>
                </tr>
              ) : filtered.map((u) => {
                const displayName = u.preferred_name || u.first_name;
                const status = effectiveStatus(u);
                const isSuspended = status === "suspended";
                const isMe = false; // can't suspend yourself — server enforces this too
                const busy = suspending === u.id;

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: "1px solid rgba(250,250,249,0.04)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,250,249,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Account */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "2rem", height: "2rem", borderRadius: "8px",
                          background: "rgba(250,250,249,0.04)",
                          border: "1px solid rgba(250,250,249,0.07)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.65rem", fontWeight: 700, color: "rgba(250,250,249,0.4)",
                          fontFamily: "var(--font-sans)", flexShrink: 0,
                        }}>
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: isSuspended ? "rgba(250,250,249,0.35)" : "#fafaf9", fontFamily: "var(--font-sans)", textDecoration: isSuspended ? "line-through" : "none" }}>
                            {displayName} {u.last_name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6rem", color: "rgba(250,250,249,0.3)", fontFamily: "var(--font-sans)", marginTop: "0.15rem" }}>
                            <Mail size={9} />
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "6px",
                        background: `${ROLE_COLOUR[u.role]}10`,
                        border: `1px solid ${ROLE_COLOUR[u.role]}30`,
                        color: ROLE_COLOUR[u.role],
                        fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em",
                        textTransform: "capitalize", fontFamily: "var(--font-sans)",
                      }}>
                        {ROLE_ICON[u.role]}
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                        fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em",
                        textTransform: "capitalize", fontFamily: "var(--font-sans)",
                        color: STATUS_COLOUR[status] ?? "rgba(250,250,249,0.35)",
                      }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: STATUS_COLOUR[status] ?? "rgba(250,250,249,0.35)", flexShrink: 0 }} />
                        {status}
                      </span>
                    </td>

                    {/* Institution */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "rgba(250,250,249,0.4)", fontFamily: "var(--font-sans)" }}>
                        {u.institution || <span style={{ color: "rgba(250,250,249,0.15)", fontStyle: "italic" }}>—</span>}
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.6rem", color: "rgba(250,250,249,0.3)", fontFamily: "var(--font-mono, monospace)" }}>
                        <Calendar size={9} />
                        {formatDate(u.created_at)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      {u.role !== "admin" && (
                        <button
                          disabled={busy}
                          onClick={() => handleSuspend(u.id, !isSuspended)}
                          className={isSuspended ? "btn-action-success" : "btn-action-danger"}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "0.35rem",
                            padding: "0.35rem 0.8rem",
                            borderRadius: "8px",
                            border: isSuspended
                              ? "1px solid rgba(100,220,120,0.25)"
                              : "1px solid rgba(255,80,80,0.2)",
                            background: isSuspended
                              ? "rgba(100,220,120,0.05)"
                              : "rgba(255,80,80,0.05)",
                            color: isSuspended
                              ? "rgba(100,220,120,0.7)"
                              : "rgba(255,100,100,0.7)",
                            fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em",
                            textTransform: "uppercase", fontFamily: "var(--font-sans)",
                            cursor: busy ? "wait" : "pointer",
                            opacity: busy ? 0.5 : 1,
                          }}
                        >
                          {isSuspended ? <RotateCcw size={10} /> : <Ban size={10} />}
                          {busy ? "…" : isSuspended ? "Reactivate" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="lg:hidden" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", fontSize: "0.78rem", color: "rgba(250,250,249,0.2)", fontFamily: "var(--font-sans)" }}>
            No accounts match the current filters.
          </div>
        ) : filtered.map((u) => {
          const displayName = u.preferred_name || u.first_name;
          const status = effectiveStatus(u);
          const isSuspended = status === "suspended";
          const busy = suspending === u.id;

          return (
            <div
              key={u.id}
              style={{
                padding: "1.25rem",
                border: "1px solid rgba(250,250,249,0.06)",
                borderRadius: "12px",
                background: "rgba(250,250,249,0.015)",
                display: "flex", flexDirection: "column", gap: "0.85rem",
              }}
            >
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "2.2rem", height: "2.2rem", borderRadius: "8px",
                  background: "rgba(250,250,249,0.04)",
                  border: "1px solid rgba(250,250,249,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700, color: "rgba(250,250,249,0.4)",
                  fontFamily: "var(--font-sans)", flexShrink: 0,
                }}>
                  {u.first_name[0]}{u.last_name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fafaf9", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName} {u.last_name}
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(250,250,249,0.3)", fontFamily: "var(--font-sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </div>
                </div>
                {/* Role pill */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "6px",
                  background: `${ROLE_COLOUR[u.role]}10`,
                  border: `1px solid ${ROLE_COLOUR[u.role]}30`,
                  color: ROLE_COLOUR[u.role],
                  fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "capitalize", fontFamily: "var(--font-sans)",
                  flexShrink: 0,
                }}>
                  {ROLE_ICON[u.role]}
                  {u.role}
                </span>
              </div>

              {/* Meta row */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.55rem", color: STATUS_COLOUR[status] ?? "rgba(250,250,249,0.35)", fontFamily: "var(--font-sans)", fontWeight: 700 }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: STATUS_COLOUR[status] ?? "rgba(250,250,249,0.35)" }} />
                  {status}
                </span>
                {u.institution && (
                  <span style={{ fontSize: "0.6rem", color: "rgba(250,250,249,0.3)", fontFamily: "var(--font-sans)" }}>
                    {u.institution}
                  </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.55rem", color: "rgba(250,250,249,0.25)", fontFamily: "var(--font-mono, monospace)" }}>
                  <Calendar size={9} />
                  {formatDate(u.created_at)}
                </span>
              </div>

              {/* Action */}
              {u.role !== "admin" && (
                <button
                  disabled={busy}
                  onClick={() => handleSuspend(u.id, !isSuspended)}
                  className={isSuspended ? "btn-action-success" : "btn-action-danger"}
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.4rem 0.9rem",
                    borderRadius: "8px",
                    border: isSuspended ? "1px solid rgba(100,220,120,0.25)" : "1px solid rgba(255,80,80,0.2)",
                    background: isSuspended ? "rgba(100,220,120,0.05)" : "rgba(255,80,80,0.05)",
                    color: isSuspended ? "rgba(100,220,120,0.7)" : "rgba(255,100,100,0.7)",
                    fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", fontFamily: "var(--font-sans)",
                    cursor: busy ? "wait" : "pointer",
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {isSuspended ? <RotateCcw size={10} /> : <Ban size={10} />}
                  {busy ? "…" : isSuspended ? "Reactivate" : "Suspend"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
