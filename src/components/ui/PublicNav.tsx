"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Students", href: "/for-students" },
  { label: "Professors", href: "/for-professors" },
];

const MENU_LINKS = [
  { num: "01", label: "About", href: "/about" },
  { num: "02", label: "Students", href: "/for-students" },
  { num: "03", label: "Professors", href: "/for-professors" },
  { num: "04", label: "Sign Up", href: "/signup" },
];

/* ─── Char-by-char nav item ──────────────────────────────────────────── */
function NavItem({ label, href, active }: {
  label: string; href: string; active: boolean;
}) {
  const chars = label.split("");
  return (
    <Link
      href={href}
      data-cursor-engulf="true"
      className="group relative inline-flex"
      style={{
        textDecoration: "none",
        padding: "0.3rem 0.75rem",
        lineHeight: 1.1,
        /* Clip both text layers so chars don't bleed outside */
        overflow: "hidden",
      }}
    >
      {/* Layer 1 — sans-serif, slides UP out on hover */}
      <span style={{ display: "flex", gap: 0, clipPath: "inset(0 -0.15em 0 0)" }} aria-label={label}>
        {chars.map((ch, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-[110%]"
            style={{
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: active ? "var(--text-primary)" : "rgba(15, 23, 42, 0.55)",
              transitionDelay: `${i * 12}ms`,
              willChange: "transform",
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>

      {/* Layer 2 — serif italic, slides UP in from 110% on hover */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "0.75rem",
          top: "0.3rem",
          display: "flex",
          gap: 0,
          clipPath: "inset(0 -0.15em 0 0)",
        }}
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            className="inline-block translate-y-[110%] group-hover:translate-y-0 transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
            style={{
              fontSize: "0.78rem",
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
              transitionDelay: `${i * 12}ms`,
              willChange: "transform",
            }}
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
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 997,
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(8px)",
            }}
          />
          <motion.div
            key="menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            style={{
              position: "fixed", top: 0, bottom: 0, right: 0,
              width: "min(100vw, 720px)", zIndex: 998,
              background: "var(--bg-base)",
              borderLeft: "1px solid rgba(37, 99, 235, 0.08)",
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "2.5rem",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                backgroundSize: "256px", mixBlendMode: "overlay",
              }}
            />
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
                      display: "flex", alignItems: "flex-start", gap: "1.5rem",
                      textDecoration: "none", marginBottom: "1rem",
                      padding: "0.2em 0",
                    }}
                  >
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1], delay: 0.1 + idx * 0.06 }}
                      style={{
                        fontFamily: "monospace", fontSize: "0.75rem",
                        color: "rgba(37, 99, 235,0.4)", letterSpacing: "0.1em",
                        marginTop: "0.6rem", minWidth: "2rem",
                      }}
                    >
                      {num}
                    </motion.span>
                    <span className="relative" style={{ display: "flex", overflow: "hidden", lineHeight: 1.1, paddingBottom: "0.1em", paddingTop: "0.1em", paddingRight: "0.15em" }}>
                      <span style={{ display: "flex" }}>
                        {chars.map((ch, i) => (
                          <motion.span
                            key={i}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.15 + idx * 0.07 + i * 0.03 }}
                            style={{ display: "inline-block", transformOrigin: "left center" }}
                          >
                            <span
                              className="inline-block transition-all duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-[110%] group-hover:text-slate-900"
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "clamp(3rem, 6vw, 6rem)", fontWeight: 400,
                                letterSpacing: "-0.03em",
                                color: isActive ? "var(--text-primary)" : "rgba(15, 23, 42, 0.65)",
                                transitionDelay: `${i * 15}ms`,
                              }}
                            >
                              {ch === " " ? "\u00A0" : ch}
                            </span>
                          </motion.span>
                        ))}
                      </span>
                      <span aria-hidden style={{ position: "absolute", left: 0, top: 0, display: "flex" }}>
                        {chars.map((ch, i) => (
                          <span
                            key={i}
                            className="inline-block translate-y-[110%] group-hover:translate-y-0 transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "clamp(3rem, 6vw, 6rem)", fontWeight: 400,
                              fontStyle: "italic", letterSpacing: "-0.03em",
                              color: "var(--accent)", transitionDelay: `${i * 15}ms`,
                            }}
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1], delay: 0.5 }}
              style={{
                position: "absolute", bottom: "2.5rem", left: "2.5rem", right: "2.5rem",
                display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                borderTop: "1px solid rgba(37, 99, 235,0.08)", paddingTop: "1.5rem",
              }}
            >
              <div>
                <p style={{ fontSize: "0.75rem", color: "rgba(15, 23, 42,0.4)", margin: 0, fontFamily: "monospace", letterSpacing: "0.05em" }}>
                  ACADEMIC MENTORSHIP PLATFORM
                </p>
                <p style={{ fontSize: "0.7rem", color: "rgba(15, 23, 42,0.5)", margin: "0.25rem 0 0", fontFamily: "monospace" }}>
                  © {new Date().getFullYear()} Schollective, Inc.
                </p>
              </div>
              <Button onClick={() => { onClose(); router.push("/signup"); }} variant="primary" size="lg">Get Started</Button>
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
  // Removed unused refs for hamburger menu

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);



  const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];
  const baseDelay = 0.5;

  return (
    <>
      <FullscreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />

      <nav
        style={{
          position: "fixed", inset: "0 0 auto 0", zIndex: 999,
          pointerEvents: "none", display: "grid",
          gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
          padding: "1.5rem 2rem",
        }}
      >
        {/* LEFT: Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE, delay: baseDelay }}
          style={{ pointerEvents: "all" }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <SchollectiveLogo size={32} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.02em", color: "rgba(15, 23, 42,0.7)" }}>
              Schollective
            </span>
          </Link>
        </motion.div>

        {/* CENTER: Nav links */}
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
                {NAV_LINKS.map(({ label, href }) => (
                  <NavItem key={href} label={label} href={href} active={pathname === href} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: CTAs + Hamburger */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: EASE, delay: baseDelay + 0.2 }}
          style={{
            pointerEvents: "all", display: "flex", alignItems: "center",
            justifyContent: "flex-end", gap: "0.5rem",
          }}
        >
          {/* Log In — split-underline wipe */}
          <Link
            href="/login"
            className="hidden md:inline-flex group relative overflow-hidden"
            style={{
              textDecoration: "none", padding: "0.2rem 0", marginRight: "1.5rem",
              fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "var(--text-primary)", lineHeight: 1,
            }}
          >
            <span style={{ position: "relative", zIndex: 2 }}>Log In</span>
            <span className="absolute bottom-0 left-0 h-[1px] bg-[var(--text-primary)] w-1/2 origin-left transition-transform duration-300 ease-out group-hover:-translate-x-full" />
            <span className="absolute bottom-0 right-0 h-[1px] bg-[var(--text-primary)] w-1/2 origin-right transition-transform duration-300 ease-out group-hover:translate-x-full" />
          </Link>

          {/* Sign Up */}
          <Button href="/signup" variant="ghost" size="sm" className="hidden md:inline-flex uppercase tracking-wider text-[0.65rem]">Sign Up</Button>

          {/* Hamburger */}
          <Button
            variant="ghost"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            style={{ width: "2.6rem", height: "2.6rem", padding: 0 }}
          >
            <AnimatePresence mode="wait">
              {menuOpen ? (
                <motion.span
                  key="x"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.25 }}
                  style={{ color: "var(--text-primary)", fontSize: "1rem", lineHeight: 1 }}
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
          </Button>
        </motion.div>
      </nav>
    </>
  );
}