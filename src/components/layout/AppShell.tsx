"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/features/NotificationBell";
import { BetaTicker } from "./BetaTicker";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  role?: string;
}

export function AppShell({ children, role = "student" }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const handleTourStatus = (e: Event) => {
      const ce = e as CustomEvent<{ active: boolean }>;
      setIsTourActive(Boolean(ce.detail?.active));
    };
    window.addEventListener("schollective:tour-status", handleTourStatus);
    return () => window.removeEventListener("schollective:tour-status", handleTourStatus);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setScrolled(scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
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
          background: isTourActive
            ? "rgba(255, 255, 255, 0.95)"
            : scrolled
            ? "rgba(255, 255, 255, 0.65)"
            : "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(24px) saturate(190%)",
          WebkitBackdropFilter: "blur(24px) saturate(190%)",
          borderBottom: isTourActive || scrolled
            ? "1px solid rgba(15, 23, 42, 0.08)"
            : "1px solid rgba(15, 23, 42, 0.05)",
          boxShadow: isTourActive || scrolled
            ? "0 4px 30px -10px rgba(15, 23, 42, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)"
            : "none",
          zIndex: isTourActive ? 10001 : undefined,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
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

        {/* Wordmark — only visible on mobile; sidebar has it on desktop */}
        <Link href={role === "professor" ? "/prof/dashboard" : "/dashboard"} className="lg:hidden" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span
            className="font-display"
            style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}
          >
            Schollective
          </span>
        </Link>

        {/*
          Right: notifications.

          An "Account" button used to sit here, linking to /profile for every role
          — the student settings URL, so for a professor it did not lead to the
          faculty settings the sidebar links to. The sidebar's own Account
          section already resolves that per role, so the top bar carries the
          notification bell alone rather than a second, wrong door.
        */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <NotificationBell />
        </div>

        {/*
          The rest of the bar. On desktop the two items above are the whole of
          it, so this fills what was empty space with the one thing a beta build
          owes its users: that it is one. Hidden below 1024px, where the nav is
          the hamburger, the wordmark and the bell and none of them can move.
        */}
        <BetaTicker />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="content-container py-10 sm:py-14"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </>
  );
}