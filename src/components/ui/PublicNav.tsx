"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "For Students", href: "/for-students" },
  { label: "For Professors", href: "/for-professors" },
];

/* ─── Char-by-char nav item ──────────────────────────────────────────── */
function NavItem({ label, href, active }: {
  label: string; href: string; active: boolean;
}) {
  const chars = label.split("");
  return (
    <Link
      href={href}
      data-nav-item="true"
      className="group relative inline-flex items-center justify-center overflow-hidden"
      style={{
        textDecoration: "none",
        height: "2.6rem",
        borderRadius: "9999px",
        padding: "0 1.2rem",
      }}
    >
      {/* Invisible layout setter to enforce correct natural width */}
      <span
        className="invisible select-none opacity-0 pointer-events-none font-sans text-[0.8rem] font-bold tracking-widest uppercase"
        style={{ padding: "0 0.2rem" }}
      >
        {label}
      </span>

      {/* Layer 1 — sans-serif, slides UP out on hover */}
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ gap: 0 }}
        aria-label={label}
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-[250%]"
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: active ? "var(--accent)" : "rgba(15, 23, 42, 0.6)",
              transitionDelay: `${i * 12}ms`,
              willChange: "transform",
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>

      {/* Layer 2 — serif italic, slides UP in from 250% on hover */}
      <span
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden
        style={{ gap: 0 }}
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            className="inline-block translate-y-[250%] group-hover:translate-y-0 transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
            style={{
              fontSize: "1.08rem",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontStyle: "italic",
              letterSpacing: "-0.01em",
              color: "var(--accent)",
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

/* ─── Main nav ─────────────────────────────────────────────────────────── */
export function PublicNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (!mounted) return null;

  return (
    <>
      <header
        className={`fixed left-1/2 -translate-x-1/2 z-[999] w-[calc(100%-2.5rem)] max-w-[76rem] flex items-center gap-3 transition-all duration-500 ease-out ${
          scrolled ? "top-3" : "top-5"
        }`}
      >
        {/* Main Glass Nav Bar */}
        <div
          data-menu-bar="true"
          className={`flex-1 rounded-full border flex justify-between lg:grid lg:grid-cols-3 items-center transition-all duration-500 ease-out overflow-hidden hover:bg-white/70 ${
            scrolled
              ? "h-[3.8rem] bg-white/60 backdrop-blur-2xl backdrop-saturate-[190%] border-white/50 shadow-[0_12px_40px_rgba(15,23,42,0.08),_inset_0_1px_1px_rgba(255,255,255,0.9),_0_1px_3px_rgba(99,102,241,0.08)]"
              : "h-[4.4rem] bg-white/40 backdrop-blur-xl backdrop-saturate-[180%] border-white/30 shadow-[0_8px_32px_rgba(15,23,42,0.04),_inset_0_1px_1px_rgba(255,255,255,0.7),_0_1px_2px_rgba(99,102,241,0.03)]"
          }`}
        >
          {/* COLUMN 1: LEFT (Logo) */}
          <div className="flex items-center justify-start pl-6">
            <Link
              href="/"
              data-nav-item="true"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}
              className="group select-none"
            >
              <SchollectiveLogo size={30} />
              <span className="font-display font-bold text-slate-900 tracking-tight transition-colors group-hover:text-indigo-600" style={{ fontSize: "1.1rem" }}>
                Schollective
              </span>
            </Link>
          </div>

          {/* COLUMN 2: CENTER (Centered nav links) */}
          <div className="hidden lg:flex items-center justify-center">
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <NavItem key={href} label={label} href={href} active={pathname === href} />
              ))}
            </nav>
          </div>

          {/* COLUMN 3: RIGHT (Log In + Mobile Hamburger) */}
          <div className="flex items-center justify-end pr-6">
            <div className="hidden lg:flex items-center">
              <NavItem label="Log In" href="/login" active={pathname === "/login"} />
            </div>

            {/* Hamburger toggle button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-colors"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Separate "Get Started" Pill Button (Matches main bar height dynamically) */}
        <div className="hidden lg:block flex-shrink-0">
          <Button
            href="/signup"
            variant="primary"
            data-nav-item="true"
            className={`rounded-full px-8 flex items-center justify-center uppercase tracking-widest text-[0.65rem] font-bold border-none shadow-[0_8px_25px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_32px_rgba(79,70,229,0.4)] transition-all duration-500 ease-out ${
              scrolled ? "h-[3.8rem]" : "h-[4.4rem]"
            }`}
          >
            Get Started →
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(250, 249, 247, 0.98)",
              backdropFilter: "blur(20px)",
              zIndex: 998,
              padding: "7.5rem 2rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "2.5rem",
            }}
          >
            {/* Nav links */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    color: pathname === href ? "var(--accent)" : "var(--text-primary)",
                    textDecoration: "none",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border)" }} />

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "3.2rem",
                  borderRadius: "100px",
                  border: "1px solid var(--border)",
                  background: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  textDecoration: "none",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "3.2rem",
                  borderRadius: "100px",
                  background: "var(--accent)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  textDecoration: "none",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}