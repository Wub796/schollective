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
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

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
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        padding: "0.8rem 1rem",
        borderRadius: "10px",
        textDecoration: "none",
        background: active ? "var(--accent-dim)" : "transparent",
        border: active
          ? "1px solid rgba(79, 70, 229, 0.15)"
          : "1px solid transparent",
        transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-surface-3)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
      aria-current={active ? "page" : undefined}
    >
      {/* Active indicator */}
      {active && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: "2px", height: "60%", minHeight: "16px", maxHeight: "28px",
          background: "var(--accent)", borderRadius: "0 2px 2px 0",
        }} />
      )}

      <Icon
        size={15}
        style={{
          flexShrink: 0,
          color: active ? "var(--accent)" : "var(--text-tertiary)",
          transition: "color 0.2s",
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: "block",
          fontSize: "0.82rem",
          fontWeight: active ? 600 : 500,
          color: active ? "var(--accent)" : "var(--text-secondary)",
          letterSpacing: "0.005em",
          transition: "color 0.2s",
          lineHeight: 1.3,
        }}>
          {label}
        </span>
        <span style={{
          display: "block",
          fontSize: "0.5rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: active ? "rgba(79, 70, 229, 0.6)" : "var(--text-tertiary)",
          fontFamily: "var(--font-sans, monospace)",
          lineHeight: 1,
          marginTop: "0.2rem",
        }}>
          {sub}
        </span>
      </div>

      {active && (
        <ChevronRight size={10} style={{ color: "var(--accent)", opacity: 0.5, flexShrink: 0 }} />
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

        {/* Back to site */}
        <p style={{
          fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "var(--text-tertiary)",
          marginBottom: "0.6rem", paddingLeft: "0.85rem",
          fontFamily: "var(--font-sans, monospace)",
        }}>
          Site
        </p>
        <motion.ul
          variants={stagger} initial="hidden" animate="show"
          style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          {[
            { href: "/dashboard", icon: Home,     label: "Back to Site",  sub: "Student view" },
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
            className="font-display"
            style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)" }}
          >
            Schollective
          </span>
        </Link>

        {/* Admin badge — desktop */}
        <div
          className="hidden lg:flex"
          style={{ alignItems: "center", gap: "0.4rem" }}
        >
          <span style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "100px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            background: "rgba(239, 68, 68, 0.05)",
            fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", color: "rgba(239, 68, 68, 0.7)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            Admin Console
          </span>
        </div>

        {/* Desktop nav links — pill-style */}
        <nav
          className="hidden lg:flex"
          style={{
            alignItems: "center", gap: "0.15rem",
            padding: "0.3rem",
            background: "rgba(15, 23, 42, 0.03)",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: "100px",
          }}
          aria-label="Admin navigation"
        >
          {NAV.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
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
                  border: active ? "1px solid rgba(79, 70, 229, 0.2)" : "1px solid transparent",
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

        {/* Right: back to site */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
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
            background: "var(--bg-surface-2)",
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
            className="content-container py-12 sm:py-16"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </>
  );
}
