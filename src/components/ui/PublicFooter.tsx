import Link from "next/link";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";

const QUICK_LINKS = [
  { label: "Home",            href: "/" },
  { label: "About",           href: "/about" },
  { label: "For Students",    href: "/for-students" },
  { label: "For Professors",  href: "/for-professors" },
  { label: "Sign Up",         href: "/signup" },
  { label: "Log In",          href: "/login" },
];

const CONTACT_ITEMS: { icon: React.ReactNode; text: string; href?: string }[] = [
  {
    icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="22,6 12,13 2,6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
    text: "schollective.corp@gmail.com",
    href: "mailto:schollective.corp@gmail.com",
  },
  {
    icon: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="9,22 9,12 15,12 15,22" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
    text: "Serving schools worldwide",
  },
  {
    icon: <><circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="1.5" /><polyline points="12,6 12,12 16,14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
    text: "Free to use — always",
  },
];

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg-base)]">
      {/* ── Main grid ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 text-left">
        {/* Brand column */}
        <div className="md:col-span-2 flex flex-col items-start gap-5">
          <Link href="/" className="group select-none flex items-center gap-3" style={{ textDecoration: "none" }}>
            <div className="transition-transform duration-300 group-hover:scale-105">
              <SchollectiveLogo size={36} />
            </div>
            <span className="font-display font-bold text-xl text-[var(--text-primary)] tracking-tight transition-colors duration-300 group-hover:text-[var(--accent)]">Schollective</span>
          </Link>
          <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
            Connecting ambitious students with verified professors for structured, transparent academic mentorship. Every question deserves a real answer.
          </p>
        </div>

        {/* Quick Links column */}
        <div className="col-span-1 flex flex-col items-start gap-4">
          <span className="font-sans uppercase text-[0.62rem] tracking-widest text-[var(--accent)] font-bold">Quick Links</span>
          <nav className="flex flex-col gap-3 items-start">
            {QUICK_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="font-sans text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all duration-200 hover:translate-x-1 inline-block">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Contact column */}
        <div className="md:col-span-2 lg:col-span-2 flex flex-col items-start gap-4">
          <span className="font-sans uppercase text-[0.62rem] tracking-widest text-[var(--accent)] font-bold">Contact Us</span>
          <div className="flex flex-col gap-4 items-start w-full">
            {CONTACT_ITEMS.map((item, i) => {
              const inner = (
                <div className="flex items-center gap-3 text-left group">
                  <div
                    style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    className="transition-all duration-200 group-hover:scale-105"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">{item.icon}</svg>
                  </div>
                  <span className="font-sans text-sm text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-[var(--accent)]">{item.text}</span>
                </div>
              );
              return item.href
                ? <a key={i} href={item.href} style={{ textDecoration: "none" }}>{inner}</a>
                : <div key={i}>{inner}</div>;
            })}
          </div>
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="border-t border-[var(--border)] mx-4 md:mx-8 lg:mx-12" />

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-7 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
          <span className="font-sans text-xs text-[var(--text-tertiary)]">© 2026 Schollective, Inc. All rights reserved.</span>
          <span className="font-sans text-[0.68rem] text-[var(--text-tertiary)]">Not a substitute for official academic advising.</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.55 }}>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="rgba(79,70,229,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-sans text-[0.68rem] text-slate-500">for students seeking knowledge</span>
        </div>
      </div>
    </footer>
  );
}
