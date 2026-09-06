"use client";

import React, { useState } from "react";
import { setAdminViewAs } from "@/app/admin/dashboard/admin-actions";
import { Eye, ArrowLeft, Sparkles, ArrowRightLeft, Loader2 } from "lucide-react";

interface AdminViewBannerProps {
  role: "student" | "professor";
}

export function AdminViewBanner({ role }: AdminViewBannerProps) {
  const [switching, setSwitching] = useState(false);
  const [isTourActive, setIsTourActive] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return p.get("tour") === "true" || p.get("tour") === "1" || p.get("tour") === "open";
    }
    return false;
  });

  React.useEffect(() => {
    const handleTourStatus = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean }>;
      setIsTourActive(Boolean(customEvent.detail?.active));
    };

    window.addEventListener("schollective:tour-status", handleTourStatus);
    return () => {
      window.removeEventListener("schollective:tour-status", handleTourStatus);
    };
  }, []);

  const label = role === "student" ? "Student" : "Professor";
  const otherRole = role === "student" ? "professor" : "student";
  const otherLabel = role === "student" ? "Professor" : "Student";

  const handleLaunchTour = () => {
    setIsTourActive(true);
    // Clear localStorage key so it behaves as first time, then dispatch event
    try {
      localStorage.removeItem(`schollective-tour-${role}-v2`);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("schollective:launch-tour"));
  };

  const handleExitPreview = async () => {
    try {
      localStorage.removeItem("schollective-tour-student-v2");
      localStorage.removeItem("schollective-tour-professor-v2");
    } catch {
      // ignore
    }
    await setAdminViewAs(null);
  };

  const handleSwitchRole = async () => {
    setSwitching(true);
    await setAdminViewAs(otherRole);
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.6rem 1.5rem",
        background: "rgba(255, 255, 255, 0.92)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.06)",
        backdropFilter: "blur(12px)",
        fontFamily: "var(--font-sans)",
        flexWrap: "wrap",
      }}
    >
      {/* ── Role status indicator ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
        <Eye size={14} style={{ color: "#4f46e5", flexShrink: 0 }} />
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#4f46e5",
          }}
        >
          Admin Preview
        </span>
        <span
          style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.4)",
          }}
        />
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            color: "#334155",
            letterSpacing: "0.02em",
          }}
        >
          Viewing as <strong style={{ color: "#0f172a" }}>{label}</strong>
        </span>
      </div>

      {/* ── Actions cluster ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        {/* Test Tour button (hidden while tour is active) */}
        {!isTourActive && (
          <button
            type="button"
            onClick={handleLaunchTour}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "100px",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              background: "linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(99, 102, 241, 0.15))",
              color: "#4f46e5",
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(99, 102, 241, 0.25))";
              e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.5)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(99, 102, 241, 0.15))";
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            title="Launch the interactive onboarding tour for this role"
          >
            <Sparkles size={12} color="#4f46e5" />
            Test {label} Tour
          </button>
        )}

        {/* Switch Role button */}
        <button
          type="button"
          onClick={handleSwitchRole}
          disabled={switching}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.35rem 0.85rem",
            borderRadius: "100px",
            border: "1px solid rgba(15, 23, 42, 0.15)",
            background: "rgba(15, 23, 42, 0.04)",
            color: "#475569",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: switching ? "wait" : "pointer",
            fontFamily: "var(--font-sans)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (switching) return;
            e.currentTarget.style.background = "rgba(15, 23, 42, 0.08)";
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseLeave={(e) => {
            if (switching) return;
            e.currentTarget.style.background = "rgba(15, 23, 42, 0.04)";
            e.currentTarget.style.color = "#475569";
          }}
        >
          {switching ? <Loader2 size={11} className="animate-spin" /> : <ArrowRightLeft size={11} />}
          Switch to {otherLabel}
        </button>

        {/* Exit Preview button */}
        <button
          type="button"
          onClick={handleExitPreview}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.35rem 0.85rem",
            borderRadius: "100px",
            border: "1px solid rgba(220, 38, 38, 0.2)",
            background: "rgba(220, 38, 38, 0.05)",
            color: "#dc2626",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(220, 38, 38, 0.12)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(220, 38, 38, 0.05)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.2)";
          }}
        >
          <ArrowLeft size={11} />
          Exit Preview
        </button>
      </div>
    </div>
  );
}
