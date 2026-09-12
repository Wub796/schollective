"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { Sparkles } from "lucide-react";

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
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const itemVariant = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

function NavLink({
  href, label, sub, active, onClose, badge,
}: {
  href: string; label: string; sub?: string; active: boolean; onClose?: () => void; badge?: number;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
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
        if (!active) {
          e.currentTarget.style.background = "var(--accent-dim)";
          e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.08rem", minWidth: 0, flex: 1 }}>
        <span
          className="font-display"
          style={{
            fontSize: "0.88rem",
            fontWeight: active ? 700 : 500,
            color: active ? "var(--accent)" : "var(--text-primary)",
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            style={{
              fontSize: "0.68rem",
              color: active ? "var(--accent)" : "var(--text-muted)",
              opacity: active ? 0.8 : 0.6,
              lineHeight: 1.2,
            }}
          >
            {sub}
          </span>
        )}
      </div>

      {badge !== undefined && badge > 0 && (
        <span
          style={{
            minWidth: "1.25rem",
            height: "1.25rem",
            padding: "0 0.35rem",
            borderRadius: "999px",
            background: "var(--accent-blue)",
            color: "#ffffff",
            fontSize: "0.65rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {active && (
        <motion.div
          layoutId="sidebar-active-indicator"
          style={{
            position: "absolute",
            left: 0,
            top: "20%",
            bottom: "20%",
            width: "3px",
            background: "var(--accent)",
            borderRadius: "0 2px 2px 0",
          }}
          transition={{ duration: 0.3, ease: EASE }}
        />
      )}
    </Link>
  );
}

export function Sidebar({ onClose, role = "student" }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/badges");
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setUnreadCount(data.unreadMessages || 0);
        }
      } catch (err) {
        console.error("Failed to fetch unread badge:", err);
      }
    }

    fetchUnreadCount();

    return () => {
      active = false;
    };
  }, [pathname]);

  const isActive = (href: string) => {
    const exactRoutes = ["/dashboard", "/prof/dashboard"];
    if (exactRoutes.includes(href)) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const navItems: NavItem[] =
    role === "professor"
      ? [
          { href: "/prof/dashboard",  label: "Dashboard",   sub: "Overview" },
          { href: "/prof/students",   label: "My Students", sub: "All Requests & Threads" },
        ]
      : [
          { href: "/dashboard",  label: "Dashboard",      sub: "Overview"     },
          { href: "/professors", label: "Browse Mentors", sub: "Directory"    },
          { href: "/threads",    label: "My Threads",     sub: "All Sessions" },
        ];

  return (
    <nav
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        padding: "0", fontFamily: "var(--font-sans)",
      }}
      aria-label="Sidebar navigation"
    >
      {/* ── Wordmark header ── */}
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
        <div style={{
          fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "var(--accent)",
          fontFamily: "var(--font-sans, monospace)", marginTop: "0.3rem",
        }}>
          {role === "professor" ? "Faculty Portal" : "Scholar Portal"}
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
          {navItems.map((navItem) => {
            const isTarget = role === "professor" ? navItem.href === "/prof/dashboard" : navItem.href === "/threads";
            const badgeValue = isTarget ? unreadCount : undefined;
            return (
              <motion.li key={navItem.href} variants={itemVariant}>
                <NavLink
                  href={navItem.href} label={navItem.label} sub={navItem.sub}
                  active={isActive(navItem.href)} onClose={onClose}
                  badge={badgeValue}
                />
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border)", marginBottom: "1.5rem", marginLeft: "0.85rem", marginRight: "0.85rem" }} />

        {/* Account section */}
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
          {accountNav.map((navItem) => {
            const profileHref = role === "professor" ? "/prof/profile" : navItem.href;
            return (
              <motion.li key={navItem.href} variants={itemVariant}>
                <NavLink
                  href={profileHref} label={navItem.label} sub={navItem.sub}
                  active={isActive(profileHref)} onClose={onClose}
                />
              </motion.li>
            );
          })}

          {/* On-demand Product Tour Trigger */}
          <motion.li variants={itemVariant}>
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                window.dispatchEvent(new CustomEvent("schollective:launch-tour"));
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "10px",
                textDecoration: "none",
                background: "transparent",
                border: "1px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-surface-3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "var(--accent)",
                    letterSpacing: "0.005em",
                    lineHeight: 1.3,
                  }}>
                    Product Tour
                  </span>
                  <span style={{
                    display: "block",
                    fontSize: "0.5rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(79, 70, 229, 0.6)",
                    fontFamily: "var(--font-sans, monospace)",
                    lineHeight: 1,
                    marginTop: "0.2rem",
                  }}>
                    Interactive Walkthrough
                  </span>
                </div>
                <Sparkles size={13} color="#4f46e5" style={{ opacity: 0.8 }} />
              </div>
            </button>
          </motion.li>
        </motion.ul>
      </div>

      {/* ── Sign out — pinned to bottom ── */}
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