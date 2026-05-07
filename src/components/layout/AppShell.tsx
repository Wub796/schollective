"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
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
      <header className="app-nav">
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

        {/* Wordmark */}
        <a href="/dashboard" className="flex items-center gap-2.5 no-underline group">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8e8e6] text-[#0d0d0d] text-xs font-bold tracking-tight transition-opacity group-hover:opacity-80">
            S
          </span>
          <span className="text-sm font-semibold tracking-tight text-[#f2f2f0]">
            Schollective
          </span>
        </a>

        {/* Desktop nav links */}
        <nav className="app-nav-links hidden lg:flex items-center gap-7" aria-label="Main navigation">
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/professors", label: "Browse Professors" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-xs font-medium text-[#6a6a6a] hover:text-[#f2f2f0] transition-colors no-underline tracking-wide uppercase"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* User area */}
        <div className="flex items-center gap-2.5">
          <button
            className="relative p-1.5 text-[#6a6a6a] hover:text-[#f2f2f0] transition-colors rounded-lg hover:bg-white/[0.05]"
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#e8e8e6]" aria-hidden="true" />
          </button>
          <div
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-[0.65rem] font-semibold text-[#c8c8c6] hover:border-[rgba(255,255,255,0.16)] transition-colors"
            role="button"
            tabIndex={0}
            aria-label="User menu"
          >
            MS
          </div>
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
          className="app-sidebar border-r border-[rgba(255,255,255,0.05)]"
          data-open={sidebarOpen ? "true" : "false"}
          aria-label="Sidebar navigation"
          style={{ background: "#0f0f0f" }}
        >
          <Sidebar onClose={closeSidebar} />
        </aside>

        <main className="app-main">
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