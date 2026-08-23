"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/features/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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

  return (
    <>
      {/* ── Top nav bar ─────────────────────────────────────────── */}
      <header
        className="app-nav"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(24px) saturate(190%)",
          WebkitBackdropFilter: "blur(24px) saturate(190%)",
          borderBottom: "1px solid var(--border)",
          boxShadow: scrolled
            ? "0 4px 30px -10px rgba(0, 0, 0, 0.08)"
            : "none",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Hamburger — mobile only */}
        <button
          className="nav-hamburger text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
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
            className="font-display font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            style={{ fontSize: "1.1rem", letterSpacing: "-0.025em" }}
          >
            Schollective
          </span>
        </Link>

        {/* Right: theme toggle + notification + account */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <ThemeToggle />
          <NotificationBell />
          <Link href={role === "professor" ? "/prof/profile" : "/profile"} style={{ textDecoration: "none" }}>
            <div
              className="hover:bg-slate-900/5 dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
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
            background: "var(--bg-surface-1)",
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
            className="content-container py-10 sm:py-14"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </>
  );
}