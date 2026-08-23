"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { setAdminViewAs } from "@/app/admin/dashboard/admin-actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/* ─── Nav items ──────────────────────────────────────────────────────────── */
const NAV = [
  { href: "/admin/dashboard",  icon: LayoutDashboard, label: "Overview",  sub: "Platform health" },
  { href: "/admin/users",      icon: Users,           label: "Users",     sub: "All accounts"    },
  { href: "/admin/professors", icon: GraduationCap,   label: "Faculty",   sub: "Roster"          },
  { href: "/admin/threads",    icon: MessageSquare,   label: "Threads",   sub: "Activity"        },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const itemVariant = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

/* ─── Sidebar nav link ────────────────────────────────────────────────────── */
function NavLink({
  href, icon: Icon, label, sub, active, onClick,
}: {
  href: string; icon: React.ElementType; label: string; sub: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
        active
          ? "bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400"
          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {/* Active indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-md" />
      )}

      <Icon
        size={15}
        className={`shrink-0 transition-colors ${
          active
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200"
        }`}
      />

      <div className="flex-1 min-w-0">
        <span className={`block text-[0.82rem] leading-snug transition-colors ${
          active ? "font-semibold text-indigo-600 dark:text-indigo-400" : "font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        }`}>
          {label}
        </span>
        <span className={`block text-[0.5rem] font-bold tracking-widest uppercase font-mono mt-0.5 leading-none transition-colors ${
          active ? "text-indigo-600/70 dark:text-indigo-400/70" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400"
        }`}>
          {sub}
        </span>
      </div>

      {active && (
        <ChevronRight size={10} className="text-indigo-600 dark:text-indigo-400 opacity-60 shrink-0" />
      )}
    </Link>
  );
}

/* ─── Sidebar content ────────────────────────────────────────────────────── */
function AdminSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        fontFamily: "var(--font-sans)",
      }}
      aria-label="Admin navigation"
    >
      {/* ── Brand header ── */}
      <div style={{
        padding: "2rem 1.5rem 1.75rem",
        borderBottom: "1px solid var(--border)",
        marginBottom: "0.5rem",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="font-display" style={{
            fontSize: "1.1rem", fontWeight: 800,
            color: "var(--text-primary)", letterSpacing: "-0.025em",
          }}>
            Schollective
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.3rem" }}>
          <span style={{
            width: "5px", height: "5px",
            background: "#ef4444",
            borderRadius: "50%", flexShrink: 0,
          }} />
          <span style={{
            fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", color: "rgba(239, 68, 68, 0.7)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            Admin Environment
          </span>
        </div>
      </div>

      {/* ── Main nav ── */}
      <div style={{ padding: "0.5rem 0.85rem", flex: 1 }}>
        <p style={{
          fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "var(--text-tertiary)",
          marginBottom: "0.6rem", paddingLeft: "0.85rem",
          fontFamily: "var(--font-sans, monospace)",
        }}>
          Navigate
        </p>
        <motion.ul
          variants={stagger} initial="hidden" animate="show"
          style={{
            listStyle: "none", display: "flex", flexDirection: "column",
            gap: "0.25rem", marginBottom: "2rem",
          }}
        >
          {NAV.map(({ href, icon, label, sub }) => (
            <motion.li key={href} variants={itemVariant}>
              <NavLink
                href={href} icon={icon} label={label} sub={sub}
                active={isActive(href)} onClick={onClose}
              />
            </motion.li>
          ))}
        </motion.ul>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border)", marginBottom: "1.5rem", marginLeft: "0.85rem", marginRight: "0.85rem" }} />

        {/* ── Tour Sandbox ── */}
        <p style={{
          fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "var(--text-tertiary)",
          marginBottom: "0.6rem", paddingLeft: "0.85rem",
          fontFamily: "var(--font-sans, monospace)",
        }}>
          Tour Sandbox
        </p>
        <motion.ul
          variants={stagger} initial="hidden" animate="show"
          style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "2rem" }}
        >
          <motion.li variants={itemVariant}>
            <button
              onClick={() => {
                if (onClose) onClose();
                setAdminViewAs("student", true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "rgba(79, 70, 229, 0.05)",
                border: "1px solid rgba(79, 70, 229, 0.15)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(79, 70, 229, 0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(79, 70, 229, 0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(79, 70, 229, 0.05)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(79, 70, 229, 0.15)";
              }}
            >
              <Sparkles size={14} color="#4f46e5" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", lineHeight: 1.3 }}>
                  Test Student Tour
                </span>
                <span style={{ display: "block", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(79, 70, 229, 0.6)", fontFamily: "var(--font-sans, monospace)", lineHeight: 1, marginTop: "0.15rem" }}>
                  Scholar Walkthrough
                </span>
              </div>
            </button>
          </motion.li>

          <motion.li variants={itemVariant}>
            <button
              onClick={() => {
                if (onClose) onClose();
                setAdminViewAs("professor", true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(99, 102, 241, 0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99, 102, 241, 0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(99, 102, 241, 0.05)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(99, 102, 241, 0.15)";
              }}
            >
              <Sparkles size={14} color="#6366f1" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", lineHeight: 1.3 }}>
                  Test Faculty Tour
                </span>
                <span style={{ display: "block", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(99, 102, 241, 0.6)", fontFamily: "var(--font-sans, monospace)", lineHeight: 1, marginTop: "0.15rem" }}>
                  Professor Walkthrough
                </span>
              </div>
            </button>
          </motion.li>
        </motion.ul>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border)", marginBottom: "1.5rem", marginLeft: "0.85rem", marginRight: "0.85rem" }} />

        {/* Account Settings */}
        <p style={{
          fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "var(--text-tertiary)",
          marginBottom: "0.6rem", paddingLeft: "0.85rem",
          fontFamily: "var(--font-sans, monospace)",
        }}>
          Account
        </p>
        <motion.ul
          variants={stagger} initial="hidden" animate="show"
          style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          {[
            { href: "/profile",   icon: Settings,  label: "Settings",      sub: "Account"     },
          ].map(({ href, icon, label, sub }) => (
            <motion.li key={href} variants={itemVariant}>
              <NavLink
                href={href} icon={icon} label={label} sub={sub}
                active={false} onClick={onClose}
              />
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* ── Sign out ── */}
      <div style={{
        padding: "1.25rem 1rem 2rem",
        borderTop: "1px solid var(--border)",
      }}>
        <button
          onClick={handleSignOut}
          style={{
            display: "flex", alignItems: "center", gap: "0.85rem",
            width: "100%", padding: "0.8rem 1rem",
            borderRadius: "10px", background: "transparent",
            border: "1px solid transparent", cursor: "pointer",
            textAlign: "left", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220, 38, 38, 0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <div>
            <span style={{
              display: "block", fontSize: "0.82rem", fontWeight: 500,
              color: "var(--text-secondary)", fontFamily: "var(--font-sans)",
              transition: "color 0.2s", lineHeight: 1.3,
            }}>
              Sign Out
            </span>
            <span style={{
              display: "block", fontSize: "0.5rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(220, 38, 38, 0.5)",
              fontFamily: "var(--font-sans, monospace)", lineHeight: 1, marginTop: "0.2rem",
            }}>
              Session
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
}

/* ─── Shell ──────────────────────────────────────────────────────────────── */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const main = document.querySelector(".app-main");
    if (!main) return;
    const handleScroll = () => setScrolled(main.scrollTop > 12);
    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const openSidebar  = useCallback(() => setMobileOpen(true),  []);
  const closeSidebar = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      {/* ── Top nav bar (matches AppShell) ──────────────────────────── */}
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
          aria-expanded={mobileOpen}
          aria-controls="admin-sidebar"
        >
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M1 1h14M1 6h14M1 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Wordmark */}
        <Link href="/admin/dashboard" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span
            className="font-display font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            style={{ fontSize: "1.1rem", letterSpacing: "-0.025em" }}
          >
            Schollective
          </span>
        </Link>

        {/* Quick Tour Testing Buttons in Header */}
        <div className="hidden sm:flex" style={{ alignItems: "center", gap: "0.5rem", marginLeft: "auto", marginRight: "0.5rem" }}>
          <button
            onClick={() => setAdminViewAs("student", true)}
            className="hover:scale-105 active:scale-95 transition-all"
            style={{
              height: "28px",
              padding: "0 0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              borderRadius: "100px",
              border: "1px solid rgba(79, 70, 229, 0.3)",
              background: "linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(99, 102, 241, 0.15))",
              fontSize: "0.55rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent)",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            <Sparkles size={11} className="text-indigo-600 dark:text-indigo-400" />
            Test Student Tour
          </button>

          <button
            onClick={() => setAdminViewAs("professor", true)}
            className="hover:scale-105 active:scale-95 transition-all"
            style={{
              height: "28px",
              padding: "0 0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              borderRadius: "100px",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(129, 140, 248, 0.15))",
              fontSize: "0.55rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent-blue)",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            <Sparkles size={11} className="text-indigo-600 dark:text-indigo-400" />
            Test Faculty Tour
          </button>
        </div>

        {/* Right: theme toggle + back to site */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <ThemeToggle />
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
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
            >
              Exit Admin
            </div>
          </Link>
        </div>
      </header>

      {/* ── Mobile backdrop ──────────────────────────────────────────── */}
      <div
        className="sidebar-backdrop lg:hidden"
        data-open={mobileOpen ? "true" : "false"}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── App Shell grid ───────────────────────────────────────────── */}
      <div className="app-shell">
        <aside
          id="admin-sidebar"
          className="app-sidebar"
          data-open={mobileOpen ? "true" : "false"}
          aria-label="Admin sidebar navigation"
          style={{
            background: "var(--bg-surface-1)",
            borderRight: "1px solid var(--border)",
          }}
        >
          <AdminSidebarContent onClose={closeSidebar} />
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
