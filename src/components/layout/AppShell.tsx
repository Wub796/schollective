"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationBell } from "@/components/features/NotificationBell";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  role?: string;
}

export function AppShell({ children, role = "student" }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

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

  return (
    <>
      {/* ── Top nav bar ─────────────────────────────────────────── */}
      <header className="app-nav" style={{ background: "rgba(9, 9, 11, 0.94)" }}>
        {/* Hamburger */}
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

        {/* Wordmark — matches landing page nav exactly */}
        <a href="/dashboard" className="flex items-center gap-2.5 no-underline group">
          <span
            className="font-display font-bold text-[#fafaf9]"
            style={{ fontSize: "1.05rem", letterSpacing: "-0.02em" }}
          >
            Schollective
          </span>
          <span
            className="font-mono uppercase hidden sm:block"
            style={{ fontSize: "0.42rem", letterSpacing: "0.38em", color: "rgba(250, 250, 249, 0.35)", paddingTop: "2px" }}
          >
            Academic Mentorship
          </span>
        </a>

        <nav className="app-nav-links hidden lg:flex items-center gap-8" aria-label="Main navigation">
          {(role === "professor"
            ? [
                { href: "/prof/dashboard", label: "Dashboard"      },
                { href: "/prof/students",  label: "My Students"    },
                { href: "/prof/profile",   label: "Profile Preview"},
              ]
            : [
                { href: "/dashboard",  label: "Dashboard"     },
                { href: "/professors", label: "Browse Mentors"},
                { href: "/threads",    label: "My Threads"    },
              ]
          ).map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="no-underline"
              style={{ fontSize: "0.48rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.45)", fontFamily: "var(--font-mono, 'DM Mono', monospace)", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(250, 250, 249, 0.9)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(250, 250, 249, 0.45)")}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* User area — matches landing page button style */}
        <div className="flex items-center gap-2.5">
          <NotificationBell />
          {/* Avatar capsule — same border style as landing page SIGN UP button */}
          <Link href="/profile" style={{ textDecoration: "none" }}>
            <div
              className="flex h-7 px-3 cursor-pointer items-center justify-center rounded-full border text-[0.58rem] font-semibold tracking-widest uppercase transition-all"
              style={{ borderColor: "rgba(250, 250, 249, 0.2)", color: "rgba(250, 250, 249, 0.7)", background: "transparent" }}
              role="button"
              tabIndex={0}
              aria-label="User menu"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(250, 250, 249, 0.5)"; (e.currentTarget as HTMLElement).style.color = "#fafaf9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(250, 250, 249, 0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(250, 250, 249, 0.7)"; }}
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
          className="app-sidebar border-r border-[rgba(129, 140, 248, 0.08)]"
          data-open={sidebarOpen ? "true" : "false"}
          aria-label="Sidebar navigation"
          style={{ background: "var(--bg-base)" }}
        >
          <Sidebar onClose={closeSidebar} role={role} />
        </aside>

        <main className="app-main" style={{ background: "var(--bg-base)" }}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="content-container py-8 sm:py-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </>
  );
}