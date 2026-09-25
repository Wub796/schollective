"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { DynamicNotifications } from "@/components/features/notifications/DynamicIsland";
import { NotificationCenterProvider } from "@/components/features/notifications/NotificationCenter";
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
    /*
      The notification feed, and the island that reads it.

      `<DynamicNotifications />` is aligned to this bar and centres its chip in
      it, but is a sibling of the bar rather than a child: the bar has a
      `backdrop-filter`, and a nested card would blur the bar's own background
      instead of the page behind it. See the component.
    */
    <NotificationCenterProvider>
      {/* Suspended while the mobile drawer is open: the island's layer has to sit
          above this bar, so it would otherwise float over the drawer panel itself. */}
      <DynamicNotifications suspended={sidebarOpen} />

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
          The middle of the bar belongs to the notification island, which sits
          there always: it is the only door to the inbox, so it cannot be
          something that appears only when it has news. It is positioned against
          this bar by `.island-layer`, not laid out inside it, so the two can
          never push each other around — and that is what lets the beta ticker
          span the whole bar and scroll behind the chip rather than stopping
          short of it.

          The ticker is told where the chip actually ends — its measured width,
          and whether it is there at all — through the document root, the one
          node those two subtrees share. See DynamicIsland.tsx, and
          `.beta-ticker` in globals.css for the lane it draws from it.

          A bell icon used to sit opposite this, and an "Account" button before
          that, linking to /profile for every role — the student settings URL, so
          for a professor it did not lead to the faculty settings the sidebar
          links to. The sidebar's own Account section resolves that per role.
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

        {/* The root layout's <main id="main-content"> is this page's one main
            landmark; this is the layout box that sits inside it. */}
        <div className="app-main" style={{ background: "var(--bg-base)" }}>
          {/* Slides on route change rather than fading from `opacity: 0`:
              the server-rendered HTML would otherwise be an empty page until
              hydration runs. See src/components/ui/entrance.ts. */}
          <motion.div
            key={pathname}
            initial={{ y: 6 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="content-container py-10 sm:py-14"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </NotificationCenterProvider>
  );
}
