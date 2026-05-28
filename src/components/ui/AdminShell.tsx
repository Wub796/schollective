"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  MessageSquare,
  Home,
  Settings,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

/* ─── Nav items ──────────────────────────────────────────────────────────── */
const NAV = [
  { href: "/admin/dashboard",  icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users",      icon: Users,           label: "Users" },
  { href: "/admin/professors", icon: GraduationCap,   label: "Faculty" },
  { href: "/admin/threads",    icon: MessageSquare,   label: "Threads" },
];

/* ─── Sidebar link ───────────────────────────────────────────────────────── */
function NavLink({
  href, icon: Icon, label, active, onClick,
}: {
  href: string; icon: React.ElementType; label: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        padding: "0.55rem 0.85rem",
        borderRadius: "9px",
        textDecoration: "none",
        background: active ? "rgba(37, 99, 235,0.1)" : "transparent",
        border: active ? "1px solid rgba(37, 99, 235,0.2)" : "1px solid transparent",
        color: active ? "var(--accent)" : "rgba(15, 23, 42,0.45)",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.03em",
        fontFamily: "var(--font-sans)",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "rgba(15, 23, 42,0.75)";
          e.currentTarget.style.background = "rgba(15, 23, 42,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "rgba(15, 23, 42,0.45)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon size={14} style={{ flexShrink: 0 }} />
      {label}
      {active && (
        <ChevronRight size={10} style={{ marginLeft: "auto", opacity: 0.5 }} />
      )}
    </Link>
  );
}

/* ─── Shell ──────────────────────────────────────────────────────────────── */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside
      style={{
        width: "220px",
        flexShrink: 0,
        borderRight: "1px solid rgba(15, 23, 42,0.05)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
        gap: "0.25rem",
        background: "rgba(8,12,20,0.6)",
        minHeight: "100vh",
      }}
    >
      {/* Brand */}
      <div style={{ marginBottom: "2rem", padding: "0 0.25rem" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            className="font-display"
            style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Schollective
          </span>
        </Link>
        <div
          style={{
            display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem",
          }}
        >
          <span style={{ width: "5px", height: "5px", background: "#ff4a4a", borderRadius: "50%", flexShrink: 0 }} />
          <span
            style={{
              fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase",
              color: "rgba(15, 23, 42,0.3)", fontFamily: "var(--font-sans, monospace)",
            }}
          >
            Admin Environment
          </span>
        </div>
      </div>

      {/* Section label */}
      <div
        style={{
          fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase",
          color: "rgba(15, 23, 42,0.2)", fontFamily: "var(--font-sans, monospace)",
          padding: "0 0.5rem", marginBottom: "0.35rem",
        }}
      >
        Navigation
      </div>

      {/* Nav links */}
      {NAV.map(({ href, icon, label }) => (
        <NavLink
          key={href}
          href={href}
          icon={icon}
          label={label}
          active={pathname === href}
          onClick={() => setMobileOpen(false)}
        />
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom links */}
      <div
        style={{
          borderTop: "1px solid rgba(15, 23, 42,0.05)",
          paddingTop: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <NavLink href="/"        icon={Home}     label="Back to Site"  active={false} />
        <NavLink href="/profile" icon={Settings}  label="Settings"      active={false} />
      </div>
    </aside>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex" }}>

      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex" style={{ flexShrink: 0 }}>
        {sidebar}
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          />
          {/* Panel */}
          <div style={{ position: "relative", zIndex: 1, width: "260px" }}>
            {sidebar}
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── Mobile top bar ── */}
        <header
          className="lg:hidden"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(15, 23, 42,0.05)",
            background: "rgba(8,12,20,0.95)",
            position: "sticky", top: 0, zIndex: 100,
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Schollective
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            style={{
              background: "rgba(37, 99, 235,0.08)",
              border: "1px solid rgba(37, 99, 235,0.18)",
              borderRadius: "8px",
              width: "2.2rem", height: "2.2rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(15, 23, 42,0.7)",
            }}
          >
            {mobileOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </header>

        {/* ── Page content ── */}
        <main style={{ flex: 1, padding: "2.5rem 3vw 4rem", maxWidth: "1100px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>

        {/* ── Footer ── */}
        <footer
          style={{
            borderTop: "1px solid rgba(15, 23, 42,0.04)",
            padding: "1.25rem 3vw",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase",
            color: "rgba(15, 23, 42,0.15)", fontFamily: "var(--font-sans, monospace)",
          }}
        >
          <span>Schollective Admin Engine v1.0</span>
          <span>Secure Environment · Academic Integrity First</span>
        </footer>
      </div>
    </div>
  );
}
