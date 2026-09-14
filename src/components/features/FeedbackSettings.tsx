"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Bug,
  Lightbulb,
  MessageCircleQuestion,
  CheckCircle2,
  AlertTriangle,
  Inbox,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_HINTS,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_MESSAGE_MIN,
  FEEDBACK_SUBJECT_MAX,
  feedbackStatusLabel,
  type FeedbackCategory,
} from "@/lib/feedback";

/**
 * The beta feedback form: what broke, what would help, or neither.
 *
 * Two design choices worth naming. It is one form rather than a bug tracker, so
 * the category is a three-way pick with a sentence of help under it — the
 * question a reporter can answer is "which of these is closest?", not "is this
 * a defect or an enhancement?". And it shows the reporter their own recent
 * reports afterwards: the reason people send the same problem twice is that
 * nothing told them the first one arrived.
 */

const CATEGORY_ICONS = {
  bug: Bug,
  idea: Lightbulb,
  other: MessageCircleQuestion,
} as const;

interface OwnReport {
  id: string;
  category: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, { color: string; background: string; border: string }> = {
  received: { color: "#4f46e5", background: "rgba(99, 102, 241, 0.08)", border: "rgba(99, 102, 241, 0.25)" },
  reviewed: { color: "#b45309", background: "rgba(217, 119, 6, 0.08)", border: "rgba(217, 119, 6, 0.25)" },
  closed:   { color: "#15803d", background: "rgba(22, 163, 74, 0.08)", border: "rgba(22, 163, 74, 0.25)" },
};

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.received;
  return (
    <span
      style={{
        fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase",
        color: style.color, background: style.background, border: `1px solid ${style.border}`,
        padding: "0.2rem 0.6rem", borderRadius: "100px", flexShrink: 0,
        fontFamily: "var(--font-sans, monospace)",
      }}
    >
      {feedbackStatusLabel(status)}
    </span>
  );
}

export function FeedbackSettings() {
  const pathname = usePathname();

  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [reports, setReports] = useState<OwnReport[]>([]);

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch {
      // The list is a courtesy, not the form: a failed fetch leaves the form
      // usable and says nothing, rather than blocking feedback on a read.
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  // Counted in code points, like the server and the CHECK constraint behind it,
  // so the counter cannot disagree with what the API accepts.
  const trimmedLength = [...message.trim()].length;
  const canSend = trimmedLength >= FEEDBACK_MESSAGE_MIN && !sending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message, page: pathname }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const text = data?.error || "We could not save that. Please try again.";
        setError(text);
        toast.error(text);
        return;
      }

      setSent(data?.report?.id ?? "sent");
      setSubject("");
      setMessage("");
      setCategory("bug");
      toast.success("Thanks — your report reached the team.");
      void loadReports();
    } catch {
      const text = "We could not reach the server. Check your connection and try again.";
      setError(text);
      toast.error(text);
    } finally {
      setSending(false);
    }
  }

  const card: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "16px",
    padding: "2rem",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.65rem", fontWeight: 800, color: "var(--text-secondary)",
    textTransform: "uppercase", display: "block", marginBottom: "0.45rem",
    letterSpacing: "0.15em",
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "0.8rem 1rem", borderRadius: "100px",
    border: "1.5px solid rgba(99, 102, 241, 0.4)",
    background: "rgba(255, 255, 255, 0.95)", fontSize: "0.9rem",
    color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-sans)",
  };

  return (
    <div style={card} id="feedback">
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
        <Inbox size={20} color="#4f46e5" />
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Feedback &amp; Bug Reports
        </h3>
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
        Schollective is in open beta, and this goes straight to the people building it.
        Tell us what broke, what confused you, or what you would rather it did.
      </p>

      {sent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "0.85rem",
            padding: "1.25rem 1.5rem", borderRadius: "14px",
            background: "rgba(22, 163, 74, 0.05)", border: "1px solid rgba(22, 163, 74, 0.25)",
          }}>
            <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
            <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-primary)" }}>Received — thank you.</strong> It is in the
              team&apos;s queue and you will see it below with whatever happens to it next.
            </div>
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSent(null)} icon={<Send size={14} />}>
              Send another
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.6rem",
              background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#dc2626", borderRadius: "10px", padding: "0.75rem 1rem",
              fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.5,
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "0.05rem" }} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span style={labelStyle}>What is this?</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
              {FEEDBACK_CATEGORIES.map((value) => {
                const Icon = CATEGORY_ICONS[value];
                const selected = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    aria-pressed={selected}
                    style={{
                      display: "flex", flexDirection: "column", gap: "0.4rem",
                      textAlign: "left", padding: "1rem 1.1rem", borderRadius: "14px",
                      border: selected
                        ? "1.5px solid rgba(99, 102, 241, 0.55)"
                        : "1.5px solid rgba(99, 102, 241, 0.18)",
                      background: selected ? "rgba(99, 102, 241, 0.07)" : "rgba(255, 255, 255, 0.6)",
                      cursor: "pointer", transition: "all 0.2s ease",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <span style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      fontSize: "0.85rem", fontWeight: 800,
                      color: selected ? "var(--accent)" : "var(--text-primary)",
                    }}>
                      <Icon size={15} />
                      {FEEDBACK_CATEGORY_LABELS[value]}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
                      {FEEDBACK_CATEGORY_HINTS[value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-subject" style={labelStyle}>Summary (optional)</label>
            <input
              id="feedback-subject"
              type="text"
              value={subject}
              maxLength={FEEDBACK_SUBJECT_MAX}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Notifications never clear"
              style={fieldStyle}
            />
          </div>

          <div>
            <label htmlFor="feedback-message" style={labelStyle}>What happened?</label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, FEEDBACK_MESSAGE_MAX))}
              rows={6}
              placeholder={"What you did, what you expected, and what happened instead.\n\nIf it is about one professor or thread, a link or a name helps."}
              style={{
                ...fieldStyle,
                borderRadius: "14px",
                resize: "vertical",
                minHeight: "8rem",
                lineHeight: 1.6,
              }}
            />
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap",
              marginTop: "0.5rem", fontSize: "0.72rem", color: "var(--text-tertiary)",
            }}>
              <span>
                {trimmedLength < FEEDBACK_MESSAGE_MIN
                  ? `${FEEDBACK_MESSAGE_MIN - trimmedLength} more character${FEEDBACK_MESSAGE_MIN - trimmedLength === 1 ? "" : "s"} needed`
                  : `${trimmedLength} / ${FEEDBACK_MESSAGE_MAX}`}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginLeft: "auto" }}>
                <Paperclip size={12} />
                We attach the page you are on ({pathname})
              </span>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={!canSend}
              size="md"
              icon={sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            >
              {sending ? "Sending…" : "Send feedback"}
            </Button>
          </div>
        </form>
      )}

      {reports.length > 0 && (
        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(99, 102, 241, 0.15)" }}>
          <span style={{ ...labelStyle, marginBottom: "0.9rem" }}>Your recent reports</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "0.85rem",
                  padding: "0.9rem 1.1rem", borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.03)",
                  border: "1px solid rgba(99, 102, 241, 0.12)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {report.subject || FEEDBACK_CATEGORY_LABELS[(report.category as FeedbackCategory)] || "Report"}
                  </div>
                  <div style={{
                    fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: "0.25rem",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {report.message}
                  </div>
                </div>
                <StatusPill status={report.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
