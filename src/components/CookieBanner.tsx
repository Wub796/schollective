"use client";

import { useEffect, useState } from "react";

const CONSENT_COOKIE = "schollective-cookie-consent";
const MAX_AGE = 60 * 60 * 24 * 365;

function readConsent() {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readConsent());
  }, []);

  const choose = (value: "accepted" | "declined") => {
    document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="dialog"
      aria-label="Cookie preferences"
      style={{
        position: "fixed",
        left: "1rem",
        right: "1rem",
        bottom: "1rem",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        padding: "1rem 1.25rem",
        border: "1px solid rgba(99, 102, 241, 0.25)",
        borderRadius: "14px",
        background: "rgba(255, 255, 255, 0.96)",
        boxShadow: "0 12px 40px rgba(15, 23, 42, 0.16)",
      }}
    >
      <p style={{ margin: 0, maxWidth: "46rem", fontSize: "0.82rem", lineHeight: 1.5, color: "#334155" }}>
        We use essential cookies to keep you signed in and optional analytics cookies to improve Schollective. You can accept or decline optional analytics cookies.
      </p>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button type="button" onClick={() => choose("declined")} style={buttonStyle("secondary")}>
          Decline
        </button>
        <button type="button" onClick={() => choose("accepted")} style={buttonStyle("primary")}>
          Accept
        </button>
      </div>
    </aside>
  );
}

function buttonStyle(variant: "primary" | "secondary"): React.CSSProperties {
  return {
    border: variant === "primary" ? "none" : "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: "999px",
    padding: "0.55rem 1rem",
    background: variant === "primary" ? "#4f46e5" : "transparent",
    color: variant === "primary" ? "#fff" : "#4f46e5",
    fontSize: "0.72rem",
    fontWeight: 800,
    cursor: "pointer",
  };
}
