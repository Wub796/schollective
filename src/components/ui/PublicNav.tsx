"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { Button } from "@/components/ui/Button";

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

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <header
      className={`fixed left-1/2 -translate-x-1/2 z-[999] w-[calc(100%-2.5rem)] max-w-[76rem] transition-all duration-500 ease-out ${
        scrolled ? "top-3" : "top-5"
      }`}
    >
      <div
        data-menu-bar="true"
        className={`w-full rounded-full border grid grid-cols-3 items-center transition-all duration-500 ease-out overflow-hidden hover:bg-white/70 ${
          scrolled
            ? "h-[3.8rem] bg-white/60 backdrop-blur-2xl backdrop-saturate-[190%] border-white/50 shadow-[0_12px_40px_rgba(15,23,42,0.08),_inset_0_1px_1px_rgba(255,255,255,0.9),_0_1px_3px_rgba(99,102,241,0.08)]"
            : "h-[4.4rem] bg-white/40 backdrop-blur-xl backdrop-saturate-[180%] border-white/30 shadow-[0_8px_32px_rgba(15,23,42,0.04),_inset_0_1px_1px_rgba(255,255,255,0.7),_0_1px_2px_rgba(99,102,241,0.03)]"
        }`}
      >
        {/* COLUMN 1: LEFT (Logo) */}
        <div className="flex items-center justify-start">
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
        <div className="flex items-center justify-center">
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <NavItem key={href} label={label} href={href} active={pathname === href} />
            ))}
          </nav>
        </div>

        {/* COLUMN 3: RIGHT (Log In + CTA Button) */}
        <div className="flex items-center justify-end gap-6 h-full">
          <NavItem label="Log In" href="/login" active={pathname === "/login"} />

          <Button
            href="/signup"
            variant="primary"
            data-nav-item="true"
            className="h-full !py-0 px-8 rounded-l-full rounded-r-none border-none flex items-center justify-center uppercase tracking-widest text-[0.65rem] transition-colors duration-200"
            style={{ borderRadius: "9999px 0 0 9999px" }}
          >
            Get Started →
          </Button>
        </div>
      </div>
    </header>
  );
}