"use client";

import React, { useState } from "react";
import { setAdminViewAs } from "@/app/admin/dashboard/admin-actions";
import { Eye, ArrowLeft, ArrowRightLeft, Loader2, Sparkles } from "lucide-react";

interface AdminViewBannerProps {
  role: "student" | "professor";
}

export function AdminViewBanner({ role }: AdminViewBannerProps) {
  const [switching, setSwitching] = useState(false);

  const label = role === "student" ? "Student" : "Professor";
  const otherRole = role === "student" ? "professor" : "student";
  const otherLabel = role === "student" ? "Professor" : "Student";

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
        top: "0.75rem",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem 1rem",
        padding: "0.65rem 1.25rem",
        marginBottom: "1.75rem",
        borderRadius: "14px",
        background: "rgba(255, 255, 255, 0.88)",
        border: "1px solid rgba(99, 102, 241, 0.18)",
        boxShadow: "0 4px 20px -2px rgba(99, 102, 241, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
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
        {/* Launch Tour button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("schollective:launch-tour"));
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.35rem 0.85rem",
            borderRadius: "100px",
            border: "1px solid rgba(79, 70, 229, 0.25)",
            background: "rgba(79, 70, 229, 0.08)",
            color: "#4f46e5",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(79, 70, 229, 0.16)";
            e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(79, 70, 229, 0.08)";
            e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.25)";
          }}
        >
          <Sparkles size={11} />
          Launch Tour
        </button>

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
