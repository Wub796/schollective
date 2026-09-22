import React from "react";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import {
  DEACTIVATION_GRACE_DAYS,
  RESTORE_PATH,
  daysUntilPurge,
  isDeactivated,
  purgeAfter,
} from "@/lib/account-deletion";
import { AccountDisabledActions } from "./AccountDisabledActions";

export const dynamic = "force-dynamic";

/**
 * Where a disabled account lands — reachable only while signed in, and only
 * while actually disabled.
 *
 * It lives outside the `(dashboard)` group on purpose: that layout redirects
 * disabled accounts here, so a page inside it would be a redirect loop. It also
 * lives outside `(auth)`, whose pages are for visitors who are not signed in.
 */
export default async function DeactivatedPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect(`/login?next=${encodeURIComponent(RESTORE_PATH)}`);
  if (!isDeactivated(profile)) redirect("/dashboard");

  const deadline = purgeAfter(profile?.deactivated_at);
  const daysLeft = daysUntilPurge(profile);
  const dateLabel = (value: Date | null) =>
    (value ?? new Date()).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div style={{
      background: "var(--bg-base)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem",
    }}>
      <div style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(79, 70, 229, 0.07) 0%, transparent 65%)",
        zIndex: 0,
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "520px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rem",
      }}>
        <div style={{
          width: "4.5rem",
          height: "4.5rem",
          borderRadius: "50%",
          background: "rgba(79, 70, 229, 0.08)",
          border: "1px solid rgba(79, 70, 229, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Clock size={30} color="#4f46e5" />
        </div>

        <span className="font-display" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
          Schollective
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <h1 className="font-display" style={{
            fontSize: "2.2rem",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            margin: 0,
          }}>
            Account <em style={{ color: "var(--accent)" }}>disabled.</em>
          </h1>
          <p style={{
            fontSize: "0.88rem",
            color: "rgba(15, 23, 42, 0.55)",
            lineHeight: 1.7,
            margin: 0,
            fontFamily: "var(--font-sans)",
          }}>
            This account was disabled from its owner&apos;s Settings page. Nothing has been deleted —
            your profile is hidden, your sessions were revoked and your open mentorship threads were
            closed. Restoring brings your profile, role and faculty listing back exactly as they were.
          </p>
        </div>

        <div style={{
          width: "100%",
          padding: "1.5rem 1.75rem",
          background: "rgba(15, 23, 42, 0.02)",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans, monospace)" }}>
            Deletion Schedule
          </span>
          <p style={{ fontSize: "0.82rem", color: "rgba(15, 23, 42, 0.5)", lineHeight: 1.65, margin: 0, fontFamily: "var(--font-sans)" }}>
            This account and everything in it — threads, messages, the profile itself — are permanently
            deleted after <strong style={{ color: "rgba(15, 23, 42, 0.7)" }}>{dateLabel(deadline)}</strong>
            {daysLeft !== null && (
              <> ({daysLeft === 1 ? "1 day" : `${daysLeft} days`} left of a {DEACTIVATION_GRACE_DAYS}-day window)</>
            )}
            . Threads that were closed when the account was disabled stay closed either way.
          </p>
        </div>

        <AccountDisabledActions />
      </div>
    </div>
  );
}
