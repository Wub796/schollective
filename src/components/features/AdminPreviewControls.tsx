"use client";

import React, { useState } from "react";
import { setAdminViewAs } from "@/app/admin/dashboard/admin-actions";
import { Users, GraduationCap, Sparkles, Eye, Loader2, Play } from "lucide-react";

export function AdminPreviewControls() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (role: "student" | "professor", launchTour: boolean) => {
    const actionKey = `${role}-${launchTour ? "tour" : "preview"}`;
    setLoadingAction(actionKey);
    await setAdminViewAs(role, launchTour);
  };

  return (
    <div
      style={{
        marginTop: "1.5rem",
        padding: "1.5rem",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 243, 255, 0.95))",
        borderRadius: "16px",
        border: "1px solid rgba(99, 102, 241, 0.2)",
        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={16} color="#4f46e5" />
          <h3
            className="font-display"
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Portal Previews & Interactive Tour Testing
          </h3>
        </div>
        <span
          style={{
            fontSize: "0.58rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent)",
            background: "rgba(99, 102, 241, 0.1)",
            padding: "0.2rem 0.65rem",
            borderRadius: "100px",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            fontFamily: "var(--font-sans, monospace)",
          }}
        >
          Admin Sandbox
        </span>
      </div>

      <p
        style={{
          fontSize: "0.82rem",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          margin: 0,
          fontFamily: "var(--font-sans)",
        }}
      >
        Inspect dashboards as different user roles, or launch the interactive step-by-step onboarding tours to test first-time user walkthroughs.
      </p>

      {/* ── Action Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* ── Student Portal Card ── */}
        <div
          style={{
            padding: "1.25rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(79, 70, 229, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={15} color="#4f46e5" />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>Student Scholar Portal</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Profile management, AI reviewer, mentor browsing</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Preview Only */}
            <button
              onClick={() => handleAction("student", false)}
              disabled={loadingAction !== null}
              style={{
                flex: 1,
                minWidth: "120px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid rgba(15, 23, 42, 0.15)",
                background: "rgba(15, 23, 42, 0.03)",
                color: "#334155",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: loadingAction ? "wait" : "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (loadingAction) return;
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.08)";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                if (loadingAction) return;
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.03)";
                e.currentTarget.style.color = "#334155";
              }}
            >
              {loadingAction === "student-preview" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Eye size={13} />
              )}
              Preview
            </button>

            {/* Test Tour */}
            <button
              onClick={() => handleAction("student", true)}
              disabled={loadingAction !== null}
              style={{
                flex: 1.4,
                minWidth: "140px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.85rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--accent)",
                color: "#ffffff",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: loadingAction ? "wait" : "pointer",
                fontFamily: "var(--font-sans)",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
              }}
              onMouseEnter={(e) => {
                if (loadingAction) return;
                e.currentTarget.style.background = "#4338ca";
              }}
              onMouseLeave={(e) => {
                if (loadingAction) return;
                e.currentTarget.style.background = "#4f46e5";
              }}
            >
              {loadingAction === "student-tour" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={13} color="#ffffff" />
              )}
              Test Student Tour
            </button>
          </div>
        </div>

        {/* ── Faculty Portal Card ── */}
        <div
          style={{
            padding: "1.25rem",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={15} color="#4f46e5" />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>Faculty Professor Portal</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Availability toggle, request queue, faculty profile</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Preview Only */}
            <button
              onClick={() => handleAction("professor", false)}
              disabled={loadingAction !== null}
              style={{
                flex: 1,
                minWidth: "120px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid rgba(15, 23, 42, 0.15)",
                background: "rgba(15, 23, 42, 0.03)",
                color: "#334155",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: loadingAction ? "wait" : "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (loadingAction) return;
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.08)";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                if (loadingAction) return;
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.03)";
                e.currentTarget.style.color = "#334155";
              }}
            >
              {loadingAction === "professor-preview" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Eye size={13} />
              )}
              Preview
            </button>

            {/* Test Tour */}
            <button
              onClick={() => handleAction("professor", true)}
              disabled={loadingAction !== null}
              style={{
                flex: 1.4,
                minWidth: "140px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.85rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--accent)",
                color: "#ffffff",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: loadingAction ? "wait" : "pointer",
                fontFamily: "var(--font-sans)",
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
              }}
              onMouseEnter={(e) => {
                if (loadingAction) return;
                e.currentTarget.style.background = "#4338ca";
              }}
              onMouseLeave={(e) => {
                if (loadingAction) return;
                e.currentTarget.style.background = "#4f46e5";
              }}
            >
              {loadingAction === "professor-tour" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={13} color="#ffffff" />
              )}
              Test Faculty Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
