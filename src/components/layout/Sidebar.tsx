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
const itemVariant = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

/* ── Shared NavLink — stacks label + sub vertically ──────── */
function NavLink({
  href,
  label,
  sub,
  active,
  onClose,
}: {
  href: string;
  label: string;
  sub?: string;
  active: boolean;
  onClose?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
        padding: "0.6rem 0.75rem",
        borderRadius: "8px",
        textDecoration: "none",
        background: active ? "rgba(129, 140, 248, 0.08)" : "transparent",
        border: active
          ? "1px solid rgba(129, 140, 248, 0.22)"
          : "1px solid transparent",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background =
            "rgba(129, 140, 248, 0.04)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
      aria-current={active ? "page" : undefined}
    >
      <span
        style={{
          fontSize: "0.78rem",
          fontWeight: active ? 600 : 400,
          color: active
            ? "rgba(250, 250, 249, 0.95)"
            : "rgba(168, 179, 207, 0.7)",
          letterSpacing: "0.01em",
          transition: "color 0.2s",
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
      {sub && (
        <span
          style={{
            fontSize: "0.55rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: active
              ? "rgba(129, 140, 248, 0.6)"
              : "rgba(129, 140, 248, 0.25)",
            fontFamily: "var(--font-mono, monospace)",
            lineHeight: 1,
          }}
        >
          {sub}
        </span>
      )}
    </Link>
  );
}

/* ── Sidebar ──────────────────────────────────────────────── */
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

  const SectionLabel = ({ text }: { text: string }) => (
    <p
      style={{
        fontSize: "0.6rem",
        fontWeight: 700,
        letterSpacing: "0.38em",
        textTransform: "uppercase",
        color: "rgba(129, 140, 248, 0.4)",
        marginBottom: "0.75rem",
        paddingLeft: "0.5rem",
        fontFamily: "var(--font-mono, monospace)",
      }}
    >
      {text}
    </p>
  );

  const Divider = () => (
    <div
      style={{
        height: "1px",
        background: "rgba(129, 140, 248, 0.08)",
        marginBottom: "2rem",
        marginLeft: "0.5rem",
        marginRight: "0.5rem",
      }}
    />
  );

  return (
    <nav
      className="flex h-full flex-col"
      style={{ padding: "2rem 1.25rem", fontFamily: "var(--font-sans)" }}
      aria-label="Sidebar navigation"
    >
      {/* Main nav */}
      <SectionLabel text="Navigate" />
      <motion.ul
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "0.15rem",
          marginBottom: "2.5rem",
        }}
      >
        {navItems.map((navItem) => (
          <motion.li key={navItem.href} variants={itemVariant}>
            <NavLink
              href={navItem.href}
              label={navItem.label}
              sub={navItem.sub}
              active={isActive(navItem.href)}
              onClose={onClose}
            />
          </motion.li>
        ))}
      </motion.ul>

      <Divider />

      {/* Account section */}
      <SectionLabel text="Account" />
      <motion.ul
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "0.15rem",
        }}
      >
        {accountNav.map((navItem) => (
          <motion.li key={navItem.href} variants={itemVariant}>
            <NavLink
              href={navItem.href}
              label={navItem.label}
              sub={navItem.sub}
              active={isActive(navItem.href)}
              onClose={onClose}
            />
          </motion.li>
        ))}
      </motion.ul>

      {/* Sign out — pinned to bottom */}
      <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
        <div
          style={{
            height: "1px",
            background: "rgba(129, 140, 248, 0.08)",
            marginBottom: "1.25rem",
            marginLeft: "0.5rem",
            marginRight: "0.5rem",
          }}
        />
        <button
          onClick={handleSignOut}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            width: "100%",
            padding: "0.6rem 0.75rem",
            borderRadius: "8px",
            background: "transparent",
            border: "1px solid transparent",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(129, 140, 248, 0.04)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 400,
              color: "rgba(168, 179, 207, 0.5)",
              fontFamily: "var(--font-sans)",
              transition: "color 0.2s",
              lineHeight: 1.3,
            }}
          >
            Sign Out
          </span>
          <span
            style={{
              fontSize: "0.55rem",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(129, 140, 248, 0.2)",
              fontFamily: "var(--font-mono, monospace)",
              lineHeight: 1,
            }}
          >
            Session
          </span>
        </button>
      </div>
    </nav>
  );
}