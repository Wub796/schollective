"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

interface NavItem {
  href: string;
  label: string;
  sub?: string;
}

interface SidebarProps {
  onClose?: () => void;
  role?: string;
}

const accountNav: NavItem[] = [
  { href: "/profile", label: "Profile", sub: "Settings" },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

export function Sidebar({ onClose, role = "student" }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const isActive = (href: string) => {
    const exactRoutes = ["/dashboard", "/prof/dashboard"];
    if (exactRoutes.includes(href)) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems =
    role === "professor"
      ? [
          { href: "/prof/dashboard",  label: "Dashboard",      sub: "Overview"     },
          { href: "/prof/students",   label: "My Students",    sub: "All Time"     },
          { href: "/prof/profile",    label: "Profile Preview",sub: "Student View" },
        ]
      : [
          { href: "/dashboard",   label: "Dashboard",    sub: "Overview"  },
          { href: "/professors",  label: "Browse Mentors",sub: "Directory" },
          { href: "/threads",     label: "My Threads",   sub: "All Sessions" },
        ];

  return (
    <nav
      className="flex h-full flex-col"
      style={{ padding: "2rem 1.25rem", fontFamily: "var(--font-sans)" }}
      aria-label="Sidebar navigation"
    >
      {/* Section label */}
      <p style={{
        fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.38em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
        marginBottom: "0.75rem", paddingLeft: "0.5rem",
        fontFamily: "var(--font-mono, monospace)",
      }}>
        Navigate
      </p>

      {/* Main nav */}
      <motion.ul
        variants={stagger} initial="hidden" animate="show"
        style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.15rem", marginBottom: "2.5rem" }}
      >
        {navItems.map((navItem) => {
          const active = isActive(navItem.href);
          return (
            <motion.li key={navItem.href} variants={item}>
              <Link
                href={navItem.href}
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
                aria-current={active ? "page" : undefined}
              >
                <span style={{
                  fontSize: "0.78rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)",
                  letterSpacing: "0.01em",
                  transition: "color 0.2s",
                }}>
                  {navItem.label}
                </span>
                <span style={{
                  fontSize: "0.48rem",
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)",
                  fontFamily: "var(--font-mono, monospace)",
                }}>
                  {navItem.sub}
                </span>
              </Link>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Hairline divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "2rem", marginLeft: "0.5rem", marginRight: "0.5rem" }} />

      {/* Account section */}
      <p style={{
        fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.38em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
        marginBottom: "0.75rem", paddingLeft: "0.5rem",
        fontFamily: "var(--font-mono, monospace)",
      }}>
        Account
      </p>
      <motion.ul
        variants={stagger} initial="hidden" animate="show"
        style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.15rem" }}
      >
        {accountNav.map((navItem) => {
          const active = isActive(navItem.href);
          return (
            <motion.li key={navItem.href} variants={item}>
              <Link
                href={navItem.href}
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.6rem 0.75rem", borderRadius: "8px", textDecoration: "none",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ fontSize: "0.78rem", fontWeight: active ? 600 : 400, color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)", transition: "color 0.2s" }}>
                  {navItem.label}
                </span>
                <span style={{ fontSize: "0.48rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)", fontFamily: "var(--font-mono, monospace)" }}>
                  {navItem.sub}
                </span>
              </Link>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Sign out — pinned to bottom */}
      <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "1.25rem", marginLeft: "0.5rem", marginRight: "0.5rem" }} />
        <button
          onClick={handleSignOut}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px",
            background: "transparent", border: "none", cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-sans)", transition: "color 0.2s" }}>
            Sign Out
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </nav>
  );
}