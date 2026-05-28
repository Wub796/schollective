"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/features/NotificationBell";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  role?: string;
}

export function AppShell({ children, role = "student" }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const pathname = usePathname();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const main = document.querySelector(".app-main");
    if (!main) return;
    const handleScroll = () => setScrolled(main.scrollTop > 12);
    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const openSidebar  = useCallback(() => setSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const navItems = role === "professor"
    ? [
        { href: "/prof/dashboard", label: "Dashboard"       },
        { href: "/prof/students",  label: "My Students"     },
        { href: "/prof/profile",   label: "Profile Preview" },
      ]
    : [
        { href: "/dashboard",  label: "Dashboard"      },
        { href: "/professors", label: "Browse Mentors" },
        { href: "/threads",    label: "My Threads"     },
      ];

  const isActive = (href: string) => {
    const exact = ["/dashboard", "/prof/dashboard"];
    if (exact.includes(href)) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Top nav bar ─────────────────────────────────────────── */}
      <header
        className="app-nav"
        style={{
          background: scrolled ? "rgba(255, 255, 255, 0.97)" : "rgba(255, 255, 255, 0.92)",
          borderBottom: scrolled
            ? "1px solid var(--border-hover)"
            : "1px solid var(--border)",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* Hamburger — mobile only */}
        <button
          className="nav-hamburger"
          onClick={openSidebar}
          aria-label="Open navigation"
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
        >
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M1 1h14M1 6h14M1 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Wordmark */}
        <Link href={role === "professor" ? "/prof/dashboard" : "/dashboard"} style={{ textDecoration: "none", flexShrink: 0 }}>
          <span
            className="font-display"
            style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}
          >
            Schollective
          </span>
        </Link>

        {/* Desktop nav links — pill-style */}
        <nav
          className="hidden lg:flex"
          style={{
            display: "flex", alignItems: "center", gap: "0.15rem",
            padding: "0.3rem",
            background: "rgba(15, 23, 42, 0.03)",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: "100px",
          }}
          aria-label="Main navigation"
        >
          {navItems.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "block",
                  padding: "0.4rem 1rem",
                  borderRadius: "100px",
                  textDecoration: "none",
                  fontSize: "0.58rem",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-sans)",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-dim)" : "transparent",
                  border: active ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid transparent",
                  transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: notification + account */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <NotificationBell />
          <Link href="/profile" style={{ textDecoration: "none" }}>
            <div
              style={{
                height: "28px", padding: "0 0.9rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "100px",
                border: "1px solid var(--border)",
                background: "transparent",
                fontSize: "0.52rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-focus)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
              role="button"
              tabIndex={0}
              aria-label="Account settings"
            >
              Account
            </div>
          </Link>
        </div>
      </header>

      {/* ── Mobile backdrop ─────────────────────────────────────── */}
      <div
        className="sidebar-backdrop lg:hidden"
        data-open={sidebarOpen ? "true" : "false"}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── App Shell grid ──────────────────────────────────────── */}
      <div className="app-shell">
        <aside
          id="app-sidebar"
          className="app-sidebar"
          data-open={sidebarOpen ? "true" : "false"}
          aria-label="Sidebar navigation"
          style={{
            background: "var(--bg-surface-2)",
            borderRight: "1px solid var(--border)",
          }}
        >
          <Sidebar onClose={closeSidebar} role={role} />
        </aside>

        <main className="app-main" style={{ background: "var(--bg-base)" }}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="content-container py-12 sm:py-16"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </>
  );
}