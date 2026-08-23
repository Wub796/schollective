"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
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
      className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
        active
          ? "bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400"
          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {/* Active indicator dot */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-md" />
      )}

      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <div>
          <span className={`block text-[0.82rem] leading-snug transition-colors ${
            active ? "font-semibold text-indigo-600 dark:text-indigo-400" : "font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
          }`}>
            {label}
          </span>
          {sub && (
            <span className={`block text-[0.5rem] font-bold tracking-widest uppercase font-mono mt-0.5 leading-none transition-colors ${
              active ? "text-indigo-600/70 dark:text-indigo-400/70" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400"
            }`}>
              {sub}
            </span>
          )}
        </div>
        {badge && badge > 0 ? (
          <span className="bg-indigo-100 dark:bg-indigo-950/90 text-indigo-600 dark:text-indigo-400 text-[0.62rem] font-bold px-2 py-0.5 rounded-full font-sans shrink-0">
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
      className="flex flex-col h-full font-sans"
      aria-label="Sidebar navigation"
    >
      {/* ── Wordmark header ── */}
      <div className="p-6 pb-5 border-b border-slate-200/80 dark:border-slate-800 mb-2">
        <Link href="/" className="no-underline">
          <span className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 tracking-tight transition-colors">
            Schollective
          </span>
        </Link>
        <div className="text-[0.52rem] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 font-mono mt-1">
          {role === "professor" ? "Faculty Portal" : "Scholar Portal"}
        </div>
      </div>

      {/* ── Main nav ── */}
      <div className="p-3 flex-1">
        <p className="text-[0.52rem] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2.5 pl-3 font-mono">
          Navigate
        </p>
        <motion.ul
          variants={stagger} initial="hidden" animate="show"
          className="list-none flex flex-col gap-1 mb-6"
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
        <div className="h-px bg-slate-200/80 dark:bg-slate-800 mb-6 mx-3" />

        {/* Account section */}
        <p className="text-[0.52rem] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2.5 pl-3 font-mono">
          Account
        </p>
        <motion.ul
          variants={stagger} initial="hidden" animate="show"
          className="list-none flex flex-col gap-1"
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
              className="group flex items-center gap-3.5 w-full px-4 py-3 rounded-xl transition-all duration-200 border border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/70 text-left cursor-pointer"
            >
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div>
                  <span className="block text-[0.82rem] font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 leading-snug">
                    Product Tour
                  </span>
                  <span className="block text-[0.5rem] font-bold tracking-widest uppercase text-indigo-500/70 dark:text-indigo-400/70 font-mono mt-0.5 leading-none">
                    Interactive Walkthrough
                  </span>
                </div>
                <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400 opacity-80 group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </motion.li>
        </motion.ul>
      </div>

      {/* ── Sign out — pinned to bottom ── */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800">
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-3.5 w-full px-4 py-3 rounded-xl transition-all duration-200 border border-transparent hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left cursor-pointer"
        >
          <div>
            <span className="block text-[0.82rem] font-medium text-slate-600 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 leading-snug transition-colors">
              Sign Out
            </span>
            <span className="block text-[0.5rem] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 group-hover:text-rose-500/70 dark:group-hover:text-rose-400/70 font-mono mt-0.5 leading-none transition-colors">
              Session
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
}