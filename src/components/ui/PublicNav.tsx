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
      data-nav-item="true"
      className="group relative inline-flex items-center justify-center overflow-hidden"
      style={{
        textDecoration: "none",
        height: "2.6rem",
        minWidth: "7.2rem",
        borderRadius: "9999px",
      }}
    >
      {/* Layer 1 — sans-serif, slides UP out on hover */}
      <span
        className="flex items-center justify-center transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full"
        style={{ gap: 0 }}
        aria-label={label}
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: active ? "var(--accent)" : "rgba(15, 23, 42, 0.6)",
              transition: "color 0.2s ease",
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>

      {/* Layer 2 — serif italic, slides UP in from 100% on hover */}
      <span
        className="absolute inset-0 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-[450ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
        aria-hidden
        style={{ gap: 0 }}
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              fontSize: "0.95rem",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontStyle: "italic",
              letterSpacing: "-0.01em",
              color: "var(--accent)",
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] w-[calc(100%-2.5rem)] max-w-[76rem] transition-all duration-300"
    >
      <div
        data-menu-bar="true"
        className="w-full h-[4.25rem] px-8 rounded-full border flex items-center justify-between transition-all duration-300 bg-[#fdfdfd]/85 backdrop-blur-md border-indigo-600/15 shadow-sm"
      >
        {/* LEFT: Logo */}
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

        {/* RIGHT: Sparse Nav links + Primary CTA */}
        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-2">
            {NAV_LINKS.map(({ label, href }) => (
              <NavItem key={href} label={label} href={href} active={pathname === href} />
            ))}
          </nav>

          <Button
            href="/signup"
            variant="primary"
            size="sm"
            data-nav-item="true"
            className="uppercase tracking-wider text-[0.65rem] shadow-sm"
          >
            Get Started →
          </Button>
        </div>
      </div>
    </header>
  );
}