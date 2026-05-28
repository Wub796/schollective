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
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const itemVariant = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

function NavLink({
  href, label, sub, active, onClose,
}: {
  href: string; label: string; sub?: string; active: boolean; onClose?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        padding: "0.65rem 0.85rem",
        borderRadius: "10px",
        textDecoration: "none",
        background: active ? "rgba(129, 140, 248, 0.09)" : "transparent",
        border: active
          ? "1px solid rgba(129, 140, 248, 0.2)"
          : "1px solid transparent",
        transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(129, 140, 248, 0.04)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
      aria-current={active ? "page" : undefined}
    >
      {/* Active indicator dot */}
      {active && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: "2px", height: "60%", minHeight: "16px", maxHeight: "28px",
          background: "#818cf8", borderRadius: "0 2px 2px 0",
        }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: "block",
          fontSize: "0.82rem",
          fontWeight: active ? 600 : 400,
          color: active ? "rgba(250, 250, 249, 0.95)" : "rgba(168, 179, 207, 0.65)",
          letterSpacing: "0.005em",
          transition: "color 0.2s",
          lineHeight: 1.3,
        }}>
          {label}
        </span>
        {sub && (
          <span style={{
            display: "block",
            fontSize: "0.5rem",
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: active ? "rgba(129, 140, 248, 0.55)" : "rgba(129, 140, 248, 0.22)",
            fontFamily: "var(--font-mono, monospace)",
            lineHeight: 1,
            marginTop: "0.2rem",
          }}>
            {sub}
          </span>
        )}
      </div>
    </Link>
  );
}

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

  const navItems: NavItem[] =
    role === "professor"
      ? [
          { href: "/prof/dashboard",  label: "Dashboard",       sub: "Overview"     },
          { href: "/prof/students",   label: "My Students",     sub: "All Time"     },
          { href: "/prof/profile",    label: "Profile Preview", sub: "Student View" },
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
        padding: "1.75rem 1.5rem 1.5rem",
        borderBottom: "1px solid rgba(129, 140, 248, 0.07)",
        marginBottom: "0.5rem",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="font-display" style={{
            fontSize: "1.05rem", fontWeight: 800,
            color: "#fafaf9", letterSpacing: "-0.025em",
          }}>
            Schollective
          </span>
        </Link>
        <div style={{
          fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.32em",
          textTransform: "uppercase", color: "rgba(129, 140, 248, 0.35)",
          fontFamily: "var(--font-mono, monospace)", marginTop: "0.3rem",
        }}>
          {role === "professor" ? "Faculty Portal" : "Scholar Portal"}
        </div>
      </div>

      {/* ── Main nav ── */}
      <div style={{ padding: "0.5rem 0.85rem", flex: 1 }}>
        <p style={{
          fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.36em",
          textTransform: "uppercase", color: "rgba(129, 140, 248, 0.3)",
          marginBottom: "0.6rem", paddingLeft: "0.85rem",
          fontFamily: "var(--font-mono, monospace)",
        }}>
          Navigate
        </p>
        <motion.ul
          variants={stagger} initial="hidden" animate="show"
          style={{
            listStyle: "none", display: "flex", flexDirection: "column",
            gap: "0.1rem", marginBottom: "2rem",
          }}
        >
          {navItems.map((navItem) => (
            <motion.li key={navItem.href} variants={itemVariant}>
              <NavLink
                href={navItem.href} label={navItem.label} sub={navItem.sub}
                active={isActive(navItem.href)} onClose={onClose}
              />
            </motion.li>
          ))}
        </motion.ul>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(129, 140, 248, 0.07)", marginBottom: "1.5rem", marginLeft: "0.85rem", marginRight: "0.85rem" }} />

        {/* Account section */}
        <p style={{
          fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.36em",
          textTransform: "uppercase", color: "rgba(129, 140, 248, 0.3)",
          marginBottom: "0.6rem", paddingLeft: "0.85rem",
          fontFamily: "var(--font-mono, monospace)",
        }}>
          Account
        </p>
        <motion.ul
          variants={stagger} initial="hidden" animate="show"
          style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.1rem" }}
        >
          {accountNav.map((navItem) => (
            <motion.li key={navItem.href} variants={itemVariant}>
              <NavLink
                href={navItem.href} label={navItem.label} sub={navItem.sub}
                active={isActive(navItem.href)} onClose={onClose}
              />
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* ── Sign out — pinned to bottom ── */}
      <div style={{
        padding: "1rem 0.85rem 1.75rem",
        borderTop: "1px solid rgba(129, 140, 248, 0.07)",
      }}>
        <button
          onClick={handleSignOut}
          style={{
            display: "flex", alignItems: "center", gap: "0.85rem",
            width: "100%", padding: "0.65rem 0.85rem",
            borderRadius: "10px", background: "transparent",
            border: "1px solid transparent", cursor: "pointer",
            textAlign: "left", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250, 90, 90, 0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div>
            <span style={{
              display: "block", fontSize: "0.82rem", fontWeight: 400,
              color: "rgba(168, 179, 207, 0.45)", fontFamily: "var(--font-sans)",
              transition: "color 0.2s", lineHeight: 1.3,
            }}>
              Sign Out
            </span>
            <span style={{
              display: "block", fontSize: "0.5rem", fontWeight: 700,
              letterSpacing: "0.24em", textTransform: "uppercase",
              color: "rgba(129, 140, 248, 0.18)",
              fontFamily: "var(--font-mono, monospace)", lineHeight: 1, marginTop: "0.2rem",
            }}>
              Session
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
}