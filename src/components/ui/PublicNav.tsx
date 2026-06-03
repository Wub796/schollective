"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";

/* ─── Unseen Studio nav spec ───────────────────────────────────────────────
   1. Each nav link has TWO text layers stacked:
      - `.nav-item__text`: the normal sans-serif text
      - `.nav-item__text--hover`: a SERIF ITALIC clone, starts at translateY(150%)
   2. On hover, each char in the normal layer slides OUT (up), while
      each char in the hover layer slides IN (from 150% → 0), staggered
      by i * 30ms.
   3. The hamburger menu opens a fullscreen overlay with large numbered items
      (01, 02, 03) that enter with scaleX(0→1) per character.
   4. Page load: all nav elements fade in from y:-8, opacity:0, delay 0.6s.
─────────────────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "About",      href: "/about" },
  { label: "Students",   href: "/for-students" },
  { label: "Professors", href: "/for-professors" },
];

const MENU_LINKS = [
  { num: "01", label: "About",       href: "/about" },
  { num: "02", label: "Students",    href: "/for-students" },
  { num: "03", label: "Professors",  href: "/for-professors" },
  { num: "04", label: "Sign Up",     href: "/signup" },
];

/* ─── Char-by-char nav item — Unseen exact spec ──────────────────────── */
function NavItem({ label, href, active, delay = 0 }: {
  label: string; href: string; active: boolean; delay?: number;
}) {
  const chars = label.split("");

  return (
    <Link
      href={href}
      className="group relative inline-flex"
      style={{
        textDecoration: "none",
        padding: "0.3rem 0.75rem",
        overflow: "hidden",
        lineHeight: 1.1,
      }}
    >
      {/* Layer 1 — sans-serif, normal. Slides OUT on hover */}
      <span
        aria-label={label}
        style={{ display: "flex", gap: 0 }}
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: active ? "#fafaf9" : "rgba(168,179,207,0.55)",
              transition: `transform 0.4s cubic-bezier(0.19,1,0.22,1) ${i * 25}ms, opacity 0.25s ease ${i * 15}ms`,
              willChange: "transform",
            }}
            className="group-hover:[transform:translateY(-110%)] group-hover:opacity-0"
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>

      {/* Layer 2 — serif italic, starts at translateY(150%), slides IN on hover */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "0.75rem",
          top: "0.3rem",
          display: "flex",
          gap: 0,
        }}
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: "0.78rem", /* slightly larger — Unseen's hover serif is bigger */
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "-0.01em",
              color: "#fafaf9",
              transform: "translateY(150%)",
              transition: `transform 0.4s cubic-bezier(0.19,1,0.22,1) ${i * 25}ms`,
              willChange: "transform",
            }}
            className="group-hover:[transform:translateY(0%)]"
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    </Link>
  );
}

function FullscreenMenu({
  open, onClose, pathname,
}: { open: boolean; onClose: () => void; pathname: string }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 997,
              background: "rgba(9, 9, 11, 0.6)",
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Drawer */}
          <motion.div
            key="menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            style={{
              position: "fixed",
              top: 0,
              bottom: 0,
              right: 0,
              width: "min(100vw, 480px)",
              zIndex: 998,
              background: "#09090b",
              borderLeft: "1px solid rgba(129, 140, 248, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "2.5rem",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
            }}
          >
          {/* Grain overlay inside menu */}
          <div
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
              backgroundSize: "256px",
              mixBlendMode: "overlay",
            }}
          />

          {/* Numbered menu items */}
          <nav style={{ position: "relative", zIndex: 1 }}>
            {MENU_LINKS.map(({ num, label, href }, idx) => {
              const chars = label.split("");
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="group"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1.5rem",
                    textDecoration: "none",
                    marginBottom: "1rem",
                    overflow: "hidden",
                  }}
                >
                  {/* Number */}
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.19,1,0.22,1], delay: 0.1 + idx * 0.06 }}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "rgba(129,140,248,0.4)",
                      letterSpacing: "0.1em",
                      marginTop: "0.6rem",
                      minWidth: "2rem",
                    }}
                  >
                    {num}
                  </motion.span>

                  {/* Char-by-char large text */}
                  <span className="relative" style={{ display: "flex", overflow: "hidden", lineHeight: 0.9 }}>
                    {/* Normal text */}
                    <span style={{ display: "flex" }}>
                      {chars.map((ch, i) => (
                        <motion.span
                          key={i}
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          transition={{
                            duration: 0.5,
                            ease: [0.19, 1, 0.22, 1],
                            delay: 0.15 + idx * 0.07 + i * 0.03,
                          }}
                          style={{
                            display: "inline-block",
                            transformOrigin: "left center",
                            fontFamily: "var(--font-display)",
                            fontSize: "clamp(3rem, 6vw, 6rem)",
                            fontWeight: 400,
                            letterSpacing: "-0.03em",
                            color: isActive ? "#fafaf9" : "rgba(168,179,207,0.65)",
                            transition: "color 0.3s ease",
                          }}
                          className="group-hover:text-[#fafaf9]"
                        >
                          {ch === " " ? "\u00A0" : ch}
                        </motion.span>
                      ))}
                    </span>

                    {/* Serif italic hover overlay — slides up from 100% */}
                    <span
                      aria-hidden
                      style={{ position: "absolute", left: 0, top: 0, display: "flex" }}
                    >
                      {chars.map((ch, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-block",
                            fontFamily: "var(--font-display)",
                            fontSize: "clamp(3rem, 6vw, 6rem)",
                            fontWeight: 400,
                            fontStyle: "italic",
                            letterSpacing: "-0.03em",
                            color: "#818cf8",
                            transform: "translateY(105%)",
                            transition: `transform 0.4s cubic-bezier(0.19,1,0.22,1) ${i * 25}ms`,
                          }}
                          className="group-hover:[transform:translateY(0%)]"
                        >
                          {ch === " " ? "\u00A0" : ch}
                        </span>
                      ))}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.19,1,0.22,1], delay: 0.5 }}
            style={{
              position: "absolute",
              bottom: "2.5rem",
              left: "2.5rem",
              right: "2.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid rgba(129,140,248,0.08)",
              paddingTop: "1.5rem",
            }}
          >
            <div>
              <p style={{ fontSize: "0.75rem", color: "rgba(168,179,207,0.4)", margin: 0, fontFamily: "monospace", letterSpacing: "0.05em" }}>
                ACADEMIC MENTORSHIP PLATFORM
              </p>
              <p style={{ fontSize: "0.7rem", color: "rgba(82,82,91,0.5)", margin: "0.25rem 0 0", fontFamily: "monospace" }}>
                © {new Date().getFullYear()} Schollective, Inc.
              </p>
            </div>
            <Link
              href="/signup"
              onClick={onClose}
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#818cf8",
                textDecoration: "none",
                fontWeight: 600,
                border: "1px solid rgba(129,140,248,0.35)",
                padding: "0.6rem 1.4rem",
                borderRadius: "100px",
                transition: "background 0.4s ease, color 0.4s ease",
              }}
            >
              Get Started →
            </Link>
          </motion.div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Main nav ─────────────────────────────────────────────────────────── */
export function PublicNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Lock body scroll when menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const EASE: [number,number,number,number] = [0.19, 1, 0.22, 1];
  const baseDelay = 0.5;

  return (
    <>
      <FullscreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />

      <nav
        style={{
          position: "fixed",
          inset: "0 0 auto 0",
          zIndex: 999,
          pointerEvents: "none",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "1.5rem 2rem",
        }}
      >
        {/* ── LEFT: Logo ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE, delay: baseDelay }}
          style={{ pointerEvents: "all" }}
        >
          <Link
            href="/"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}
          >
            <SchollectiveLogo size={32} />
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: "rgba(168,179,207,0.7)",
              }}
            >
              Schollective
            </span>
          </Link>
        </motion.div>

        {/* ── CENTER: Nav links (desktop) — Unseen char-hover style ── */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AnimatePresence>
            {!menuOpen && mounted && (
              <motion.div
                key="center-nav"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.3, ease: EASE } }}
                transition={{ duration: 0.9, ease: EASE, delay: baseDelay + 0.1 }}
                className="hidden md:flex"
                style={{ pointerEvents: "all", alignItems: "center", gap: "0" }}
              >
                {NAV_LINKS.map(({ label, href }, i) => (
                  <NavItem
                    key={href}
                    label={label}
                    href={href}
                    active={pathname === href}
                    delay={baseDelay + 0.1 + i * 0.04}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Auth CTAs + Hamburger ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE, delay: baseDelay + 0.2 }}
          style={{
            pointerEvents: "all",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          {/* Log In — desktop only */}
          <Link
            href="/login"
            className="hidden md:inline-flex group relative overflow-hidden"
            style={{
              textDecoration: "none",
              padding: "0.45rem 1rem",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(168,179,207,0.55)",
              lineHeight: 1,
            }}
          >
            <span
              className="block group-hover:-translate-y-[150%] group-hover:opacity-0"
              style={{ transition: "all 0.35s cubic-bezier(0.19,1,0.22,1)" }}
            >
              Log In
            </span>
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center group-hover:translate-y-0"
              style={{
                color: "#fafaf9",
                transform: "translateY(105%)",
                transition: "transform 0.35s cubic-bezier(0.19,1,0.22,1)",
              }}
            >
              Log In
            </span>
          </Link>

          {/* Sign Up pill */}
          <Link
            href="/signup"
            className="hidden md:inline-flex group relative overflow-hidden"
            style={{
              textDecoration: "none",
              padding: "0.45rem 1.1rem",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#818cf8",
              border: "1px solid rgba(129,140,248,0.5)",
              borderRadius: "100px",
              transition: "color 0.5s ease",
            }}
          >
            {/* fill on hover */}
            <span
              className="absolute inset-0 bg-[#818cf8] translate-y-[102%] group-hover:translate-y-0 transition-transform duration-500"
              style={{ transitionTimingFunction: "cubic-bezier(0.19,1,0.22,1)", borderRadius: "inherit" }}
            />
            <span className="relative group-hover:text-[#09090b] transition-colors duration-300">Sign Up →</span>
          </Link>

          {/* Hamburger — Unseen two-dot style */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            style={{
              pointerEvents: "all",
              background: "rgba(129,140,248,0.08)",
              border: "1px solid rgba(129,140,248,0.18)",
              borderRadius: "100px",
              width: "2.6rem",
              height: "2.6rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.3s ease, border-color 0.3s ease",
              flexShrink: 0,
            }}
          >
            <AnimatePresence mode="wait">
              {menuOpen ? (
                <motion.span
                  key="x"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.25 }}
                  style={{ color: "#fafaf9", fontSize: "1rem", lineHeight: 1 }}
                >
                  ×
                </motion.span>
              ) : (
                <motion.svg
                  key="dots"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  viewBox="0 0 14 5" width={14} height={5} fill="none"
                >
                  <circle cx="2.4" cy="2.4" r="2.4" fill="rgba(168,179,207,0.7)" />
                  <circle cx="11.6" cy="2.4" r="2.4" fill="rgba(168,179,207,0.7)" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </nav>
    </>
  );
}
