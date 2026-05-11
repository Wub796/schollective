"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "About",         href: "/about" },
  { label: "For Students",  href: "/for-students" },
  { label: "For Professors",href: "/for-professors" },
];

export function PublicNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.1rem 2.5rem",
        background: "rgba(9, 9, 11, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(129, 140, 248, 0.1)",
      }}
    >
      {/* Wordmark */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <span
          className="font-display"
          style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em" }}
        >
          Schollective
        </span>
      </Link>

      {/* Page links */}
      <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
        {NAV_LINKS.map(({ label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                textDecoration: "none",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: active ? "#818cf8" : "rgba(168, 179, 207, 0.65)",
                transition: "color 0.2s",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Auth CTAs */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link
          href="/login"
          style={{
            padding: "0.5rem 1.1rem",
            borderRadius: "100px",
            border: "1px solid rgba(129, 140, 248, 0.35)",
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#818cf8",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          Log In
        </Link>
        <Link
          href="/signup"
          style={{
            padding: "0.5rem 1.1rem",
            borderRadius: "100px",
            background: "#818cf8",
            fontSize: "0.58rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#09090b",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
