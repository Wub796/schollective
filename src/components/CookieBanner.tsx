"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { readConsent, startOptionalAnalytics, writeConsent, type ConsentValue } from "@/lib/consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setVisible(!readConsent());
  }, []);

  /**
   * The banner is fixed to the bottom of the viewport, so without reserving
   * space it sits on top of whatever is down there — on the signup form that
   * is the submit button, which cannot be clicked until the banner is
   * dismissed. Pad the page by the banner's real height instead of guessing,
   * and keep it in step with wrapping at narrow widths.
   */
  useLayoutEffect(() => {
    if (!visible) {
      document.body.style.removeProperty("padding-bottom");
      return;
    }
    const element = ref.current;
    if (!element) return;

    const apply = () => {
      document.body.style.paddingBottom = `${element.offsetHeight + 32}px`;
    };
    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(element);
    window.addEventListener("resize", apply);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
      document.body.style.removeProperty("padding-bottom");
    };
  }, [visible]);

  const choose = useCallback((value: ConsentValue) => {
    writeConsent(value);
    setVisible(false);
    if (value === "accepted") void startOptionalAnalytics();
  }, []);

  if (!visible) return null;

  return (
    <aside
      ref={ref}
      role="dialog"
      aria-label="Cookie preferences"
      style={{
        position: "fixed",
        left: "1rem",
        right: "1rem",
        bottom: "1rem",
        // Above the home page's mobile sticky bar (z-890), which would
        // otherwise cover these buttons and leave the banner undismissable.
        zIndex: 900,
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
