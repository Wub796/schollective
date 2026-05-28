"use client";

import React from "react";
import { setAdminViewAs } from "@/app/admin/dashboard/admin-actions";
import { Eye, ArrowLeft } from "lucide-react";

interface AdminViewBannerProps {
  role: "student" | "professor";
}

export function AdminViewBanner({ role }: AdminViewBannerProps) {
  const exitPreview = setAdminViewAs.bind(null, null);
  const label = role === "student" ? "Student" : "Professor";

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
        background: "rgba(251, 146, 60, 0.12)",
        borderBottom: "1px solid rgba(251, 146, 60, 0.3)",
        backdropFilter: "blur(8px)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
        <Eye size={13} style={{ color: "rgba(251, 146, 60, 0.85)", flexShrink: 0 }} />
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(251, 146, 60, 0.85)",
          }}
        >
          Admin Preview
        </span>
        <span
          style={{
            width: "3px",
            height: "3px",
            borderRadius: "50%",
            background: "rgba(251, 146, 60, 0.4)",
          }}
        />
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 500,
            color: "rgba(15, 23, 42, 0.45)",
            letterSpacing: "0.05em",
          }}
        >
          Viewing as {label}
        </span>
      </div>

      <form action={exitPreview}>
        <button
          type="submit"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.3rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid rgba(251, 146, 60, 0.3)",
            background: "rgba(251, 146, 60, 0.08)",
            color: "rgba(251, 146, 60, 0.8)",
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(251, 146, 60, 0.15)";
            e.currentTarget.style.borderColor = "rgba(251, 146, 60, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(251, 146, 60, 0.08)";
            e.currentTarget.style.borderColor = "rgba(251, 146, 60, 0.3)";
          }}
        >
          <ArrowLeft size={10} />
          Exit Preview
        </button>
      </form>
    </div>
  );
}
