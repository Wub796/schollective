import Link from "next/link";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";

const FOOTER_LINKS = [
  { label: "Home",        href: "/" },
  { label: "About",       href: "/about" },
  { label: "Features",    href: "/features" },
  { label: "Students",    href: "/for-students" },
  { label: "Professors",  href: "/for-professors" },
  { label: "Privacy",     href: "/privacy" },
  { label: "Terms",       href: "/terms" },
];

export function PublicFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        {/* Logo */}
        <div className="lp-footer-logo">
          <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <SchollectiveLogo size={24} />
            <span>Schollective</span>
          </Link>
        </div>

        {/* Links */}
        <div className="lp-footer-links">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Quote Copy */}
        <div className="lp-footer-copy">
          Every question deserves a real answer.
        </div>
      </div>
    </footer>
  );
}
