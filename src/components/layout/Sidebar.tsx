"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  onClose?: () => void;
}

const icons = {
  dashboard: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  professors: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  messages: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  request: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  profile: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  ),
  signout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const studentNav: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",        icon: icons.dashboard },
  { href: "/professors",  label: "Browse Professors", icon: icons.professors },
  { href: "/request/new", label: "New Request",       icon: icons.request },
];

const accountNav: NavItem[] = [
  { href: "/profile", label: "My Profile", icon: icons.profile },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};
const linkItem = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE } },
};

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav
      className="flex h-full flex-col px-3 py-5"
      aria-label="Sidebar navigation"
    >
      {/* Section: Main */}
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2e2e2e] select-none">
        Navigation
      </p>
      <motion.ul
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-0.5 list-none"
      >
        {studentNav.map((item) => (
          <motion.li key={item.href} variants={linkItem}>
            <SidebarLink item={item} active={isActive(item.href)} onClick={onClose} />
          </motion.li>
        ))}
      </motion.ul>

      {/* Section: Account */}
      <p className="mb-2 mt-6 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2e2e2e] select-none">
        Account
      </p>
      <motion.ul
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-0.5 list-none"
      >
        {accountNav.map((item) => (
          <motion.li key={item.href} variants={linkItem}>
            <SidebarLink item={item} active={isActive(item.href)} onClick={onClose} />
          </motion.li>
        ))}
      </motion.ul>

      {/* Sign out */}
      <div className="mt-auto border-t border-[rgba(255,255,255,0.05)] pt-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[#3a3a3a] hover:text-[#8a8a8a] transition-colors cursor-pointer"
        >
          <span className="flex-shrink-0">{icons.signout}</span>
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  active: boolean;
  muted?: boolean;
  onClick?: () => void;
}

function SidebarLink({ item, active, muted, onClick }: SidebarLinkProps) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 no-underline",
        active
          ? "bg-[rgba(255,255,255,0.07)] text-[#f2f2f0]"
          : muted
            ? "text-[#3a3a3a] hover:text-[#8a8a8a]"
            : "text-[#5a5a5a] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#c8c8c6]"
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className={cn("flex-shrink-0", active ? "text-[#f2f2f0]" : "text-[#3a3a3a]")}>
        {item.icon}
      </span>
      <span className="truncate tracking-wide">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] px-1 text-[9px] font-bold text-[#c8c8c6]">
          {item.badge}
        </span>
      )}
    </Link>
  );
}