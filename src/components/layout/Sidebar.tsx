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
          ? "1px solid rgba(37, 99, 235, 0.15)"
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
      {/* Active indicator dot */}
      {active && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: "2px", height: "60%", minHeight: "16px", maxHeight: "28px",
          background: "var(--accent)", borderRadius: "0 2px 2px 0",
        }} />
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <div>
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
          {sub && (
            <span style={{
              display: "block",
              fontSize: "0.5rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: active ? "rgba(37, 99, 235, 0.6)" : "var(--text-tertiary)",
              fontFamily: "var(--font-sans, monospace)",
              lineHeight: 1,
              marginTop: "0.2rem",
            }}>
              {sub}
            </span>
          )}
        </div>
        {badge && badge > 0 ? (
          <span style={{
            background: "rgba(99, 102, 241, 0.15)",
            color: "#6366f1",
            fontSize: "0.62rem",
            fontWeight: 700,
            padding: "0.15rem 0.45rem",
            borderRadius: "100px",
            fontFamily: "var(--font-sans)",
            flexShrink: 0,
          }}>
            {badge}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function Sidebar({ onClose, role = "student" }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    let active = true;

    async function fetchUnreadCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data: requests } = await supabase
        .from("requests")
        .select("id")
        .or(`student_id.eq.${user.id},professor_id.eq.${user.id}`);

      if (!requests || requests.length === 0 || !active) {
        setUnreadCount(0);
        return;
      }

      const requestIds = requests.map((r) => r.id);

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("request_id", requestIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      if (active) {
        setUnreadCount(count || 0);
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