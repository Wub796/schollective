"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  SAFETY_CONCERN_CATEGORIES,
  SAFETY_CONCERN_HINTS,
  SAFETY_CONCERN_LABELS,
  SAFETY_REPORT_EMAIL,
  SAFETY_REPORT_MESSAGE_MAX,
  isUrgentConcern,
  type SafetyConcernCategory,
} from "@/lib/youth-protection";

/**
 * "Report a concern", from inside the thread it is about.
 *
 * Placed here rather than only on a settings page because of who uses it: a
 * student who has just read something that frightened them is on this screen,
 * and a report that takes four navigations is a report that does not happen. The
 * panel names the two facts a reporter actually wants to know — that a person
 * will read this, and that the messages are copied so deleting them later does
 * not erase what happened.
 *
 * The copy is careful in three specific ways:
 *   - It never asks anyone to judge whether what happened is "serious enough".
 *     That question is why reports do not get made.
 *   - It says plainly that the thread's messages are copied, so nobody is
 *     surprised that a private conversation was preserved, and so somebody
 *     being pressured to delete it knows it is too late for that to work.
 *   - It says what this form cannot do: it is not monitored around the clock and
 *     cannot help in an emergency.
 *
 * A report is submitted under the reporter's own session and, when it names a
 * thread, the server re-checks that the reporter is on it (`requireParticipant`)
 * before copying anything.
 *
 * Styled from the surfaces around it rather than from its own palette: the
 * trigger is the same pill geometry and micro-type as the status chip it sits
 * beside in the thread header, and the panel uses the site's radius grammar
 * (`--radius-surface` / `--radius-inset` / `--radius-control`) and the settings
 * label-and-field scale. Red is the one departure, and it is deliberate — this
 * is the only control in that row that is about somebody being hurt.
 */

/** The trigger: shaped like the status chip and CloseThreadButton next to it. */
const TRIGGER: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.4rem",
  padding: "0.3rem 0.85rem",
  borderRadius: "var(--radius-control)",
  border: "1px solid rgba(220, 38, 38, 0.35)",
  background: "transparent",
  color: "#b91c1c",
  fontSize: "0.58rem", fontWeight: 800,
  letterSpacing: "0.18em", textTransform: "uppercase",
  fontFamily: "var(--font-sans, monospace)",
  cursor: "pointer",
};

/** The panel: a card, so a surface radius, not a control radius. */
const PANEL: React.CSSProperties = {
  position: "absolute", right: 0, top: "calc(100% + 0.6rem)",
  width: "min(28rem, calc(100vw - 2rem))",
  zIndex: 60,
  padding: "1.25rem 1.35rem",
  borderRadius: "var(--radius-surface)",
  border: "1px solid rgba(220, 38, 38, 0.25)",
  background: "rgba(255, 255, 255, 0.99)",
  boxShadow: "0 18px 50px -12px rgba(15, 23, 42, 0.28)",
  fontFamily: "var(--font-sans)",
};

/** The settings surface's label: 0.65rem, 800, 0.15em. */
const FIELD_LABEL: React.CSSProperties = {
  fontSize: "0.65rem", fontWeight: 800, color: "var(--text-secondary)",
  letterSpacing: "0.15em", textTransform: "uppercase",
};

export function ReportSafetyConcern({
  requestId,
  reportedName,
}: {
  requestId: string;
  /** Who the report will be about by default: the other participant. */
  reportedName: string;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<SafetyConcernCategory>("boundaries");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filed, setFiled] = useState<{ evidenceCopied: number; emailed: boolean } | null>(null);
  const [writing, setWriting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus the text box on open so the keyboard lands where the writing goes; a
  // panel that opens with focus left on the button makes somebody tab twice to
  // start describing something upsetting.
  useEffect(() => {
    if (open && !filed) textareaRef.current?.focus();
  }, [open, filed]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/safety", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, requestId }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "We could not save that. Please try again, or email us.");
        return;
      }

      setFiled({ evidenceCopied: Number(data?.evidenceCopied ?? 0), emailed: data?.emailed === true });
    } catch {
      setError("We could not reach the server. Please try again, or email us.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{
          ...TRIGGER,
          borderColor: open ? "rgba(220, 38, 38, 0.6)" : "rgba(220, 38, 38, 0.35)",
          background: open ? "rgba(220, 38, 38, 0.08)" : "transparent",
        }}
      >
        <ShieldAlert size={11} aria-hidden="true" />
        Report
      </button>

      {open && (
        <div role="dialog" aria-label="Report a safety concern" style={PANEL}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
            <div>
              <div className="font-display" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {filed ? "Report sent" : "Report a safety concern"}
              </div>
              {!filed && (
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.72rem", lineHeight: 1.6, color: "var(--text-secondary)", opacity: 0.85 }}>
                  A person will read this. If you are worried about {reportedName}, you do not have to be sure
                  anything is wrong to send it.
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setOpen(false)}
              aria-label="Close"
              disabled={submitting}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>

          {filed ? (
            <div style={{ marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.76rem", color: "var(--text-primary)" }}>
                <Check size={13} style={{ color: "var(--accent)" }} aria-hidden="true" />
                {filed.evidenceCopied > 0
                  ? `The ${filed.evidenceCopied === 1 ? "message" : `${filed.evidenceCopied} messages`} on this thread were copied with it, so deleting the account later will not remove them.`
                  : "It is stored and will be read."}
              </div>
              <p style={{ margin: 0, fontSize: "0.7rem", lineHeight: 1.6, color: "var(--text-secondary)", opacity: 0.85 }}>
                {filed.emailed
                  ? "The team has also been emailed. "
                  : ""}
                Tell a parent, guardian or teacher as well, and if anyone is in immediate danger call local
                emergency services — this form is not monitored around the clock.
              </p>
            </div>
          ) : (
            <div style={{ marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {SAFETY_CONCERN_CATEGORIES.map((value) => {
                  const selected = category === value;
                  return (
                    <label
                      key={value}
                      style={{
                        display: "flex", gap: "0.6rem", alignItems: "flex-start",
                        padding: "0.5rem 0.65rem",
                        borderRadius: "var(--radius-inset)",
                        border: `1px solid ${selected ? "rgba(220, 38, 38, 0.4)" : "var(--border)"}`,
                        background: selected ? "rgba(220, 38, 38, 0.05)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="safety-category"
                        value={value}
                        checked={selected}
                        onChange={() => setCategory(value)}
                        style={{ marginTop: "0.2rem", accentColor: "#b91c1c" }}
                      />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {SAFETY_CONCERN_LABELS[value]}
                        </span>
                        <span style={{ display: "block", fontSize: "0.66rem", lineHeight: 1.5, color: "var(--text-secondary)", opacity: 0.8 }}>
                          {SAFETY_CONCERN_HINTS[value]}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <label htmlFor="safety-message" style={FIELD_LABEL}>
                What happened
              </label>
              <textarea
                id="safety-message"
                ref={textareaRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onFocus={() => setWriting(true)}
                onBlur={() => setWriting(false)}
                rows={4}
                maxLength={SAFETY_REPORT_MESSAGE_MAX}
                placeholder="In your own words. Short is fine."
                style={{
                  width: "100%", resize: "vertical", minHeight: "5.5rem",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "var(--radius-inset)",
                  border: `1.5px solid ${writing ? "rgba(220, 38, 38, 0.5)" : "var(--border)"}`,
                  boxShadow: writing ? "0 0 0 3px rgba(220, 38, 38, 0.12)" : "none",
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "var(--font-sans)", fontSize: "0.82rem", lineHeight: 1.6,
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
              />

              {isUrgentConcern(category) && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.7rem", lineHeight: 1.55, color: "#b91c1c" }}>
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "0.1rem" }} aria-hidden="true" />
                  <span>
                    Send this, and tell a trusted adult now. If someone is in immediate danger, call local
                    emergency services rather than waiting for us.
                  </span>
                </div>
              )}

              {error && (
                <p style={{ margin: 0, fontSize: "0.74rem", lineHeight: 1.6, color: "#b91c1c" }}>{error}</p>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.66rem", lineHeight: 1.5, color: "var(--text-tertiary)" }}>
                  Or email{" "}
                  <a
                    href={`mailto:${SAFETY_REPORT_EMAIL}`}
                    className="link-underline"
                    style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
                  >
                    {SAFETY_REPORT_EMAIL}
                  </a>
                </span>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={submitting || message.trim().length < 10}
                  variant="primary"
                  size="sm"
                >
                  {submitting ? "Sending…" : "Send report"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
