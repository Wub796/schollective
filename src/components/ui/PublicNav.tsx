"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "For Students", href: "/for-students" },
  { label: "For Professors", href: "/for-professors" },
  { label: "Log In", href: "/login" },
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
        padding: "0.4rem 0.85rem",
        lineHeight: 1.1,
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
              letterSpacing: "0.05em",
              textTransform: "uppercase",
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
          left: "0.85rem",
          top: "0.4rem",
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

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <header
      className={`sticky top-0 z-[999] w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#fdfdfd]/85 backdrop-blur-md border-b border-slate-200/40 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-[80rem] mx-auto px-6 md:px-12 lg:px-16 flex items-center justify-between">
        {/* LEFT: Logo */}
        <Link
          href="/"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}
          className="group select-none"
        >
          <SchollectiveLogo size={32} />
          <span className="font-display font-bold text-slate-900 tracking-tight transition-colors group-hover:text-indigo-600" style={{ fontSize: "1.1rem" }}>
            Schollective
          </span>
        </Link>

        {/* RIGHT: Sparse Nav links + Primary CTA */}
        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <NavItem key={href} label={label} href={href} active={pathname === href} />
            ))}
          </nav>

          <Button href="/signup" variant="primary" size="sm" className="uppercase tracking-wider text-[0.65rem] shadow-sm">
            Get Started →
          </Button>
        </div>
      </div>
    </header>
  );
}