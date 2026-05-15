"use client";

import React, { useState } from "react";
import { setAdminViewAs } from "@/app/admin/dashboard/admin-actions";
import { Eye, GraduationCap, Users } from "lucide-react";

export function AdminPreviewControls() {
  const [loading, setLoading] = useState<"student" | "professor" | null>(null);

  const handlePreview = async (role: "student" | "professor") => {
    setLoading(role);
    await setAdminViewAs(role);
    // Note: redirect happens in the server action, so we may stay loading until page unloads
  };

  return (
    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
      <button
        onClick={() => handlePreview("student")}
        disabled={loading !== null}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "1px solid rgba(129, 140, 248, 0.2)",
          background: "rgba(129, 140, 248, 0.05)",
          color: "rgba(129, 140, 248, 0.9)",
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          fontFamily: "var(--font-sans)",
          cursor: loading ? "wait" : "pointer",
          opacity: loading === "student" ? 0.7 : loading ? 0.4 : 1,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (loading) return;
          e.currentTarget.style.background = "rgba(129, 140, 248, 0.1)";
          e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.4)";
        }}
        onMouseLeave={(e) => {
          if (loading) return;
          e.currentTarget.style.background = "rgba(129, 140, 248, 0.05)";
          e.currentTarget.style.borderColor = "rgba(129, 140, 248, 0.2)";
        }}
      >
        <Users size={12} />
        {loading === "student" ? "Switching..." : "Preview as Student"}
      </button>

      <button
        onClick={() => handlePreview("professor")}
        disabled={loading !== null}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "1px solid rgba(96, 165, 250, 0.2)",
          background: "rgba(96, 165, 250, 0.05)",
          color: "rgba(96, 165, 250, 0.9)",
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          fontFamily: "var(--font-sans)",
          cursor: loading ? "wait" : "pointer",
          opacity: loading === "professor" ? 0.7 : loading ? 0.4 : 1,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (loading) return;
          e.currentTarget.style.background = "rgba(96, 165, 250, 0.1)";
          e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.4)";
        }}
        onMouseLeave={(e) => {
          if (loading) return;
          e.currentTarget.style.background = "rgba(96, 165, 250, 0.05)";
          e.currentTarget.style.borderColor = "rgba(96, 165, 250, 0.2)";
        }}
      >
        <GraduationCap size={12} />
        {loading === "professor" ? "Switching..." : "Preview as Professor"}
      </button>
    </div>
  );
}
