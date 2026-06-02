"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "About",          href: "/about" },
  { label: "For Students",   href: "/for-students" },
  { label: "For Professors", href: "/for-professors" },
];

const EASE = [0.25, 1, 0.35, 1] as [number, number, number, number];

export function PublicNav() {
  const pathname  = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Island grows slightly more opaque + blurred as user scrolls
  const isExpanded = hovered || !scrolled;

  return (
    <div
      style={{
        position: "fixed",
        top: "1.1rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          paddingLeft: isExpanded ? "1.5rem" : "1.1rem",
          paddingRight: isExpanded ? "1.5rem" : "1.1rem",
          paddingTop: isExpanded ? "0.65rem" : "0.55rem",
          paddingBottom: isExpanded ? "0.65rem" : "0.55rem",
        }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{
          pointerEvents: "all",
          display: "flex",
          alignItems: "center",
          gap: "0",
          background: "rgba(9, 9, 11, 0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: "100px",
          border: "1px solid rgba(129, 140, 248, 0.18)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(129,140,248,0.1) inset",
          cursor: "default",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {/* ── Wordmark ──────────────────────────────────── */}
        <Link
          href="/"
          style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.55rem" }}
        >
          {/* Mini logo pill */}
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "7px",
              background: "linear-gradient(135deg, #6366f1, #818cf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M17 8C17 5.79 14.76 4 12 4C9.24 4 7 5.79 7 8C7 10.21 9.24 12 12 12C14.76 12 17 13.79 17 16C17 18.21 14.76 20 12 20C9.24 20 7 18.21 7 16"
                stroke="#fafaf9" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span
            className="font-display"
            style={{ fontSize: "0.88rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em" }}
          >
            Schollective
          </span>
        </Link>

        {/* ── Separator ─────────────────────────────────── */}
        <div style={{ width: "1px", height: "16px", background: "rgba(129, 140, 248, 0.18)", margin: "0 1rem", flexShrink: 0 }} />

        {/* ── Nav links — animated in/out ────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}>
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{ textDecoration: "none", position: "relative", display: "inline-flex", alignItems: "center" }}
              >
                <motion.span
                  whileHover={{ color: "#fafaf9" }}
                  style={{
                    display: "inline-block",
                    padding: "0.3rem 0.7rem",
                    borderRadius: "100px",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: active ? "#fafaf9" : "rgba(168, 179, 207, 0.6)",
                    background: active ? "rgba(129, 140, 248, 0.15)" : "transparent",
                    transition: "color 0.2s",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {label}
                </motion.span>
              </Link>
            );
          })}
        </div>

        {/* ── Separator ─────────────────────────────────── */}
        <div style={{ width: "1px", height: "16px", background: "rgba(129, 140, 248, 0.18)", margin: "0 1rem", flexShrink: 0 }} />

        {/* ── Auth CTAs ─────────────────────────────────── */}
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              padding: "0.38rem 0.9rem",
              borderRadius: "100px",
              border: "1px solid rgba(129, 140, 248, 0.35)",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#818cf8",
              transition: "all 0.2s",
            }}
          >
            Log In
          </Link>
          <Link
            href="/signup"
            style={{
              textDecoration: "none",
              padding: "0.38rem 0.9rem",
              borderRadius: "100px",
              background: "#818cf8",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#09090b",
              transition: "all 0.2s",
            }}
          >
            Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
