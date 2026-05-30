"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SuspendedPage() {
  return (
    <div style={{
      background: "var(--bg-base)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(239, 68, 68, 0.08) 0%, transparent 65%)",
        zIndex: 0,
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "480px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2.25rem",
      }}>
        {/* Warning Icon */}
        <div style={{
          width: "4.5rem",
          height: "4.5rem",
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <ShieldAlert size={32} color="rgb(239, 68, 68)" />
        </div>

        {/* Wordmark */}
        <span className="font-display" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
          Schollective
        </span>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <h1 className="font-display" style={{
            fontSize: "2.2rem",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            margin: 0
          }}>
            Account <em style={{ fontStyle: "italic", color: "rgba(239, 68, 68, 0.75)" }}>Suspended.</em>
          </h1>
          <p style={{
            fontSize: "0.88rem",
            color: "rgba(15, 23, 42, 0.55)",
            lineHeight: 1.7,
            margin: 0,
            fontFamily: "var(--font-sans)"
          }}>
            Your account has been suspended for violating our community guidelines or terms of service. Mentorship outreach access has been restricted.
          </p>
        </div>

        {/* Support Section */}
        <div style={{
          width: "100%",
          padding: "1.5rem 1.75rem",
          background: "rgba(15, 23, 42, 0.02)",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans, monospace)" }}>
            Need Assistance?
          </span>
          <p style={{ fontSize: "0.8rem", color: "rgba(15, 23, 42, 0.45)", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-sans)" }}>
            If you believe this suspension is an error or want to appeal this decision, please reach out to our administration team.
          </p>
          <a
            href="mailto:support@schollective.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--accent)",
              textDecoration: "none",
              marginTop: "0.25rem",
              fontFamily: "var(--font-sans)"
            }}
          >
            <Mail size={12} />
            support@schollective.com
          </a>
        </div>

        <Button href="/login" variant="ghost" size="md">
          Back to Login
        </Button>
      </div>
    </div>
  );
}
