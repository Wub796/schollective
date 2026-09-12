"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Bug,
  Lightbulb,
  MessageCircleQuestion,
  CheckCheck,
  RotateCcw,
  Trash2,
  Loader2,
  Inbox,
  Paperclip,
} from "lucide-react";
import {
  FEEDBACK_CATEGORY_LABELS,
  feedbackStatusLabel,
  type FeedbackCategory,
  type FeedbackStatus,
} from "@/lib/feedback";
import type { AdminFeedbackRow, FeedbackCounts } from "@/lib/neon/feedback";
import { removeFeedbackReport, updateFeedbackStatus } from "@/app/admin/feedback/actions";

/**
 * The queue an admin actually works through.
 *
 * Filtering happens here rather than in the URL because the page already holds
 * every report it is willing to show in one query, and a filter that needs a
 * server round trip is a filter nobody uses while triaging. Status changes do go
 * to the server: the report's state is what the reporter sees, so it must be the
 * stored one, not a optimistic local guess that a failed write would leave
 * behind. Each row keeps its own busy flag so one slow write cannot lock the
 * whole queue.
 */

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  bug: Bug,
  idea: Lightbulb,
  other: MessageCircleQuestion,
};

const STATUS_TONES: Record<string, { color: string; background: string; border: string }> = {
  new:      { color: "#4f46e5", background: "rgba(99, 102, 241, 0.1)",  border: "rgba(99, 102, 241, 0.25)" },
  reviewed: { color: "#b45309", background: "rgba(217, 119, 6, 0.1)",   border: "rgba(217, 119, 6, 0.25)" },
  closed:   { color: "#15803d", background: "rgba(22, 163, 74, 0.1)",   border: "rgba(22, 163, 74, 0.25)" },
};

type Filter = "all" | FeedbackStatus;

const TABS: Array<{ value: Filter; label: string }> = [
  { value: "all",      label: "All" },
  { value: "new",      label: "Unread" },
  { value: "reviewed", label: "Reviewed" },
  { value: "closed",   label: "Closed" },
];

function reporterName(report: AdminFeedbackRow): string {
  const name = [report.first_name, report.last_name].filter(Boolean).join(" ").trim();
  return name || report.email || "Unknown account";
}

export function AdminFeedbackQueue({
  reports,
  counts,
}: {
  reports: AdminFeedbackRow[];
  counts: FeedbackCounts;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = filter === "all" ? reports : reports.filter((report) => report.status === filter);

  async function move(id: string, status: FeedbackStatus) {
    setBusyId(id);
    try {
      const result = await updateFeedbackStatus(id, status);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(status === "reviewed" ? "Marked as reviewed." : status === "closed" ? "Closed." : "Reopened.");
    } catch {
      toast.error("That report could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    // A report is the only copy of what someone told us, so deleting is a
    // deliberate two-step rather than a single misclick in a dense table.
    if (!window.confirm("Delete this report permanently? The reporter loses it from their settings page too.")) {
      return;
    }
    setBusyId(id);
    try {
      const result = await removeFeedbackReport(id);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const active = filter === tab.value;
          const count =
            tab.value === "all"
              ? counts.total
              : tab.value === "new"
              ? counts.new
              : tab.value === "reviewed"
              ? counts.reviewed
              : counts.closed;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              aria-pressed={active}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.45rem",
                padding: "0.45rem 0.9rem", borderRadius: "100px",
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
          padding: "3rem 2rem", borderRadius: "16px",
          border: "1px dashed rgba(99, 102, 241, 0.4)",
          background: "rgba(255, 255, 255, 0.7)", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem",
        }}>
          <Inbox size={22} color="#6366f1" />
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", opacity: 0.8 }}>
            {filter === "all"
              ? "No reports yet. The beta is quiet."
              : `Nothing in ${filter === "new" ? "the unread" : filter} pile.`}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {visible.map((report) => {
            const Icon = CATEGORY_ICONS[report.category as string] ?? MessageCircleQuestion;
            const tone = STATUS_TONES[report.status] ?? STATUS_TONES.new;
            const busy = busyId === report.id;

            return (
              <article
                key={report.id}
                style={{
                  padding: "1.5rem 1.6rem", borderRadius: "16px",
                  background: "#ffffff",
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                  boxShadow: "0 4px 18px rgba(99, 102, 241, 0.04)",
                  display: "flex", flexDirection: "column", gap: "1rem",
                  opacity: busy ? 0.6 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <Icon size={15} color="#4f46e5" />
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "var(--accent)",
                    fontFamily: "var(--font-sans, monospace)",
                  }}>
                    {FEEDBACK_CATEGORY_LABELS[report.category as FeedbackCategory] ?? "Report"}
                  </span>
                  <span style={{
                    fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: tone.color,
                    background: tone.background, border: `1px solid ${tone.border}`,
                    padding: "0.2rem 0.6rem", borderRadius: "100px",
                    fontFamily: "var(--font-sans, monospace)",
                  }}>
                    {feedbackStatusLabel(report.status)}
                  </span>
                  <span
                    suppressHydrationWarning
                    style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-tertiary)" }}
                  >
                    {new Date(report.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {report.subject && (
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                    {report.subject}
                  </h3>
                )}

                <p style={{
                  margin: 0, fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {report.message}
                </p>

                <div style={{
                  display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
                  fontSize: "0.72rem", color: "var(--text-tertiary)",
                  paddingTop: "0.85rem", borderTop: "1px solid rgba(99, 102, 241, 0.12)",
                }}>
                  <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>
                    {reporterName(report)}
                  </span>
                  {report.email && <span>{report.email}</span>}
                  {report.role && (
                    <span style={{
                      fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.12em",
                      textTransform: "uppercase", color: "var(--text-tertiary)",
                      border: "1px solid var(--border)", padding: "0.15rem 0.5rem", borderRadius: "100px",
                    }}>
                      {report.role}
                    </span>
                  )}
                  {report.page_path && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <Paperclip size={11} />
                      {report.page_path}
                    </span>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
                    {report.status !== "reviewed" && (
                      <RowButton
                        disabled={busy}
                        onClick={() => move(report.id, "reviewed")}
                        icon={busy ? Loader2 : CheckCheck}
                        spinning={busy}
                        label="Reviewed"
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
                    {report.status !== "new" && (
                      <RowButton
                        disabled={busy}
                        onClick={() => move(report.id, "new")}
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
        padding: "0.4rem 0.8rem", borderRadius: "100px",
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
