"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  ShieldAlert,
  AlertTriangle,
  Baby,
  CheckCheck,
  RotateCcw,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  UserX,
} from "lucide-react";
import {
  isUrgentConcern,
  safetyConcernLabel,
  safetyReportStatusLabel,
  type SafetyReportStatus,
} from "@/lib/youth-protection";
import type { AdminSafetyReportRow, SafetyReportCounts } from "@/lib/neon/youth-protection";
import {
  loadSafetyEvidence,
  removeSafetyReport,
  updateSafetyStatus,
} from "@/app/admin/safety/actions";

/**
 * The youth-protection safety queue, as an admin works through it.
 *
 * Named for its reports, not for safety in general: `AdminSafetyQueue` is the
 * AI/bot moderation queue on the overview page, which is about flagged accounts
 * and has nothing to do with this. Two components called "the safety queue" that
 * read different tables is a support ticket waiting to happen.
 *
 * Three things this screen does differently from the feedback queue, each
 * because of what is being read:
 *
 *   - **Urgency is visible without reading.** The category, whether a minor was
 *     on the thread, and whether the report carries its own copy of the messages
 *     are all on the collapsed row, so an admin can decide what to open first
 *     without opening anything. (Urgent reports also arrive first; the ordering
 *     is in src/lib/neon/youth-protection.ts.)
 *   - **The evidence is one click away, not attached.** Transcripts are fetched
 *     when a report is opened, through a server action that re-checks admin
 *     rights, then cached here so re-opening costs nothing.
 *   - **Deleting says what it destroys.** The evidence copy is the only copy that
 *     survives the accounts being deleted, so the confirmation names that rather
 *     than asking "are you sure?".
 *
 * Laid out with the feedback queue's vocabulary on purpose — same tab pills,
 * same chips, same card and row-button shapes — so that triaging two queues is
 * one learned motion rather than two. Red is kept for an unread report and for
 * anything urgent, because on this screen that is a signal and not a status.
 */

type Filter = "open" | "new" | "reviewing" | "closed" | "all";

const TABS: Array<{ value: Filter; label: string }> = [
  { value: "open",      label: "Open" },
  { value: "new",       label: "Not yet read" },
  { value: "reviewing", label: "Being handled" },
  { value: "closed",    label: "Closed" },
  { value: "all",       label: "All" },
];

const STATUS_TONES: Record<string, { color: string; background: string; border: string }> = {
  new:       { color: "#b91c1c", background: "rgba(220, 38, 38, 0.08)",  border: "rgba(220, 38, 38, 0.3)" },
  reviewing: { color: "#b45309", background: "rgba(217, 119, 6, 0.1)",   border: "rgba(217, 119, 6, 0.28)" },
  closed:    { color: "#15803d", background: "rgba(22, 163, 74, 0.1)",   border: "rgba(22, 163, 74, 0.26)" },
};

const URGENT_TONE = { color: "#b91c1c", background: "rgba(220, 38, 38, 0.08)", border: "rgba(220, 38, 38, 0.3)" };
const MINOR_TONE = { color: "#4f46e5", background: "rgba(99, 102, 241, 0.1)", border: "rgba(99, 102, 241, 0.28)" };

const CARD: React.CSSProperties = {
  padding: "1.5rem 1.6rem",
  borderRadius: "var(--radius-surface)",
  background: "#ffffff",
  border: "1px solid rgba(99, 102, 241, 0.15)",
  boxShadow: "0 4px 18px rgba(99, 102, 241, 0.04)",
  display: "flex", flexDirection: "column", gap: "1rem",
};

function chip(tone: { color: string; background: string; border: string }): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: "0.3rem",
    padding: "0.2rem 0.6rem", borderRadius: "var(--radius-control)",
    fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
    fontFamily: "var(--font-sans, monospace)", color: tone.color, background: tone.background, border: `1px solid ${tone.border}`,
  };
}

/** Medium date plus short time, stamped once on the client (see the queue). */
function stamp(value: string): string {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function who(name: string | null, email: string | null): string {
  const trimmed = (name ?? "").trim();
  if (trimmed) return trimmed;
  return email || "account deleted";
}

interface EvidenceRow {
  id: string;
  sender_label: string | null;
  sender_role: string | null;
  content: string;
  sent_at: string;
}

export function AdminSafetyReportQueue({
  reports,
  counts,
}: {
  reports: AdminSafetyReportRow[];
  counts: SafetyReportCounts;
}) {
  const [filter, setFilter] = useState<Filter>("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Record<string, EvidenceRow[] | "error">>({});
  const [loadingEvidence, setLoadingEvidence] = useState<string | null>(null);

  const visible = reports.filter((report) => {
    if (filter === "all") return true;
    if (filter === "open") return report.status === "new" || report.status === "reviewing";
    return report.status === filter;
  });

  const open = reports.filter((report) => report.status !== "closed");

  async function move(id: string, status: SafetyReportStatus) {
    setBusyId(id);
    try {
      const result = await updateSafetyStatus(id, status);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${safetyReportStatusLabel(status)}.`);
    } catch {
      toast.error("That report could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    const report = reports.find((row) => row.id === id);
    const evidenceNote =
      report && report.evidence_count > 0
        ? `It holds the only surviving copy of ${report.evidence_count} message${report.evidence_count === 1 ? "" : "s"} from that thread — if an account in it is deleted, nothing else will have them.`
        : "The report itself is the only copy of what was sent.";

    if (!window.confirm(`Delete this safety report permanently? ${evidenceNote}`)) return;

    setBusyId(id);
    try {
      const result = await removeSafetyReport(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Report deleted.");
    } catch {
      toast.error("That report could not be removed.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleEvidence(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);

    if (evidence[id]) return;
    setLoadingEvidence(id);
    try {
      const result = await loadSafetyEvidence(id);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      const rows = (result as { evidence?: EvidenceRow[] }).evidence ?? [];
      setEvidence((prev) => ({ ...prev, [id]: rows }));
    } catch {
      setEvidence((prev) => ({ ...prev, [id]: "error" }));
      toast.error("Could not load the copied messages.");
    } finally {
      setLoadingEvidence(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const active = filter === tab.value;
          const count =
            tab.value === "all" ? counts.total : tab.value === "open" ? open.length : counts[tab.value];

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              aria-pressed={active}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.45rem",
                padding: "0.45rem 0.9rem", borderRadius: "var(--radius-control)",
                border: active ? "1px solid rgba(79, 70, 229, 0.35)" : "1px solid var(--border)",
                background: active ? "var(--accent-dim)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", cursor: "pointer",
                fontFamily: "var(--font-sans, monospace)",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
              <span style={{
                minWidth: "1.15rem", padding: "0 0.3rem", borderRadius: "999px",
                background: active ? "rgba(79, 70, 229, 0.15)" : "rgba(15, 23, 42, 0.06)",
                fontSize: "0.6rem", fontWeight: 800, textAlign: "center",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div style={{
          padding: "3rem 2rem", borderRadius: "var(--radius-surface)",
          border: "1px dashed rgba(99, 102, 241, 0.4)",
          background: "rgba(255, 255, 255, 0.7)", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem",
        }}>
          <ShieldAlert size={22} color="#6366f1" />
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", opacity: 0.8 }}>
            {counts.total === 0 ? "No safety reports have ever been filed." : "Nothing in this view."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {visible.map((report) => {
            const urgent = isUrgentConcern(report.category);
            const expanded = expandedId === report.id;
            const rows = evidence[report.id];
            const busy = busyId === report.id;

            return (
              <article
                key={report.id}
                style={{
                  ...CARD,
                  borderColor: urgent && report.status !== "closed" ? "rgba(220, 38, 38, 0.35)" : "rgba(99, 102, 241, 0.15)",
                  opacity: busy ? 0.6 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                  <span style={chip(STATUS_TONES[report.status] ?? STATUS_TONES.new)}>
                    {safetyReportStatusLabel(report.status)}
                  </span>
                  {urgent && report.status !== "closed" && (
                    <span style={chip(URGENT_TONE)}>
                      <AlertTriangle size={10} /> Urgent
                    </span>
                  )}
                  {report.minor_involved && (
                    <span style={chip(MINOR_TONE)}>
                      <Baby size={10} /> Minor on the thread
                    </span>
                  )}
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 700,
                    color: "var(--text-primary)", fontFamily: "var(--font-sans)",
                  }}>
                    {safetyConcernLabel(report.category)}
                  </span>
                  <span
                    suppressHydrationWarning
                    style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-tertiary)" }}
                  >
                    {stamp(report.created_at)}
                  </span>
                </div>

                <div style={{
                  display: "grid", gap: "0.3rem", fontSize: "0.72rem",
                  color: "var(--text-secondary)", fontFamily: "var(--font-sans)",
                }}>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>From:</strong>{" "}
                    {who(report.reporter_name, report.reporter_email)}
                    {report.reporter_role ? ` (${report.reporter_role})` : ""}
                    {!report.reporter_id ? " — account deleted since" : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--text-primary)" }}>About:</strong>{" "}
                    {report.reported_profile_id
                      ? who(report.reported_name, report.reported_email)
                      : "nobody named"}
                    {report.reported_profile_id && !report.reported_name && !report.reported_email && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#b45309" }}>
                        <UserX size={11} /> account deleted since
                      </span>
                    )}
                  </div>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>Thread:</strong>{" "}
                    {report.request_id ? <code style={{ fontSize: "0.68rem" }}>{report.request_id}</code> : "not a thread report"}
                  </div>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>Evidence:</strong>{" "}
                    {report.snapshot_summary ?? "no copy was taken"}
                  </div>
                </div>

                <p style={{
                  margin: 0, fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-primary)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {report.message}
                </p>

                {report.admin_note && (
                  <p style={{
                    margin: 0, padding: "0.7rem 0.9rem", borderRadius: "var(--radius-inset)",
                    background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.2)",
                    fontSize: "0.75rem", lineHeight: 1.6, color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)",
                  }}>
                    <strong style={{ color: "var(--text-primary)" }}>Note:</strong> {report.admin_note}
                  </p>
                )}

                <div style={{
                  display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem",
                  paddingTop: "0.85rem", borderTop: "1px solid rgba(99, 102, 241, 0.12)",
                }}>
                  {report.evidence_count > 0 && (
                    <RowButton
                      onClick={() => toggleEvidence(report.id)}
                      icon={loadingEvidence === report.id ? Loader2 : expanded ? ChevronUp : ChevronDown}
                      spinning={loadingEvidence === report.id}
                      label={`${expanded ? "Hide" : "Read"} ${report.evidence_count} copied message${report.evidence_count === 1 ? "" : "s"}`}
                    />
                  )}

                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    {report.status === "new" && (
                      <RowButton
                        disabled={busy}
                        onClick={() => move(report.id, "reviewing")}
                        icon={Loader2}
                        spinning={busy}
                        label="Take it"
                      />
                    )}
                    {report.status !== "closed" && (
                      <RowButton
                        disabled={busy}
                        onClick={() => move(report.id, "closed")}
                        icon={CheckCheck}
                        label="Close"
                      />
                    )}
                    {report.status === "closed" && (
                      <RowButton
                        disabled={busy}
                        onClick={() => move(report.id, "reviewing")}
                        icon={RotateCcw}
                        label="Reopen"
                      />
                    )}
                    <RowButton
                      disabled={busy}
                      onClick={() => remove(report.id)}
                      icon={Trash2}
                      label="Delete"
                      danger
                    />
                  </div>
                </div>

                {expanded && (
                  <div style={{ borderTop: "1px solid rgba(99, 102, 241, 0.12)", paddingTop: "1rem" }}>
                    {rows === "error" ? (
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#b91c1c", fontFamily: "var(--font-sans)" }}>
                        The copied messages could not be loaded.
                      </p>
                    ) : !rows ? (
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)" }}>
                        Loading…
                      </p>
                    ) : (
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {rows.map((row) => (
                          <li key={row.id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            <span style={{
                              fontSize: "0.62rem", fontWeight: 700, color: "var(--text-tertiary)",
                              fontFamily: "var(--font-sans, monospace)", letterSpacing: "0.06em", textTransform: "uppercase",
                            }}>
                              {row.sender_label ?? "Unknown participant"}
                              {row.sender_role ? ` · ${row.sender_role}` : ""} ·{" "}
                              <span suppressHydrationWarning>{stamp(row.sent_at)}</span>
                            </span>
                            <span style={{
                              fontSize: "0.8rem", lineHeight: 1.65, color: "var(--text-primary)",
                              padding: "0.6rem 0.8rem", borderRadius: "var(--radius-inset)",
                              background: "rgba(79, 70, 229, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)",
                              whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)",
                            }}>
                              {row.content}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * One row action.
 *
 * The feedback queue's row button, kept identical here down to the type scale
 * and the danger tone: both queues are worked through in the same sitting, and a
 * button that changes shape between them is the kind of difference that reads as
 * a different product rather than a different page.
 */
function RowButton({
  onClick,
  icon: Icon,
  label,
  disabled,
  danger,
  spinning,
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.35rem",
        padding: "0.4rem 0.8rem", borderRadius: "var(--radius-control)",
        border: danger ? "1px solid rgba(220, 38, 38, 0.25)" : "1px solid var(--border)",
        background: "transparent",
        color: danger ? "#b91c1c" : "var(--text-secondary)",
        fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-sans)",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <Icon size={12} className={spinning ? "animate-spin" : undefined} />
      {label}
    </button>
  );
}
