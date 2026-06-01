import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. What We Collect",
      body: "We collect: (a) account information you provide at signup (name, email, institution, role); (b) profile content you choose to add; (c) messages exchanged through the platform; (d) usage metadata such as login timestamps and page views. We do not collect payment data.",
    },
    {
      title: "2. How We Use Your Data",
      body: "Your data is used to: operate and improve the Schollective service; verify professor credentials against our academic database; send system notifications about your requests and threads; and enforce our Terms of Service. We do not use your data for advertising.",
    },
    {
      title: "3. Data Sharing",
      body: "We do not sell your personal data. Your profile information (name, institution, expertise) is visible to other authenticated users. Messages are private between participants. We share data with Supabase (our database provider) under a data processing agreement, and with no other third parties.",
    },
    {
      title: "4. Cookies & Local Storage",
      body: "Schollective uses session cookies for authentication only. We do not use tracking pixels, advertising cookies, or cross-site identifiers.",
    },
    {
      title: "5. Data Retention",
      body: "Your account data is retained for as long as your account is active. You may request deletion at any time by emailing privacy@schollective.com. Deleted accounts are purged from active storage within 30 days, with audit logs retained for up to 90 days.",
    },
    {
      title: "6. Your Rights",
      body: "Depending on your jurisdiction, you may have rights to: access a copy of your data; correct inaccurate data; request deletion; and object to certain processing. To exercise these rights, email privacy@schollective.com.",
    },
    {
      title: "7. Security",
      body: "All data is transmitted over HTTPS. We use Supabase Row Level Security (RLS) policies to ensure users can only access their own data. Passwords are hashed and never stored in plaintext.",
    },
    {
      title: "8. Children's Privacy",
      body: "Schollective is not directed to children under 13. Students between 13 and 17 may use the platform with parental consent. We do not knowingly collect data from children under 13. If you believe a child has created an account, please contact us immediately.",
    },
    {
      title: "9. Changes to This Policy",
      body: "We may update this Privacy Policy periodically. We will notify you of material changes via in-platform notification. Your continued use constitutes acceptance.",
    },
    {
      title: "10. Contact",
      body: "Privacy questions or data requests: privacy@schollective.com.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#fafaf9" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "6rem 2rem" }}>
        {/* Nav */}
        <nav style={{ marginBottom: "5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em" }}>Schollective</span>
          </Link>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/about" style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", textDecoration: "none", fontFamily: "var(--font-sans)" }}>About</Link>
            <Link href="/terms" style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", textDecoration: "none", fontFamily: "var(--font-sans)" }}>Terms</Link>
          </div>
        </nav>

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.32)", fontFamily: "var(--font-sans)" }}>Legal</span>
        </div>

        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "0.75rem" }}>
          Privacy <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.3)" }}>Policy</em>
        </h1>
        <p style={{ fontSize: "0.78rem", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-sans)", marginBottom: "4rem" }}>
          Last updated: May 2025
        </p>

        <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)", marginBottom: "3rem" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-display" style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(250, 250, 249, 0.75)", letterSpacing: "-0.015em", marginBottom: "0.75rem" }}>{title}</h2>
              <p style={{ fontSize: "0.88rem", color: "rgba(250, 250, 249, 0.38)", lineHeight: 1.85, fontFamily: "var(--font-sans)" }}>{body}</p>
            </div>
          ))}
        </div>

        <div style={{ height: "1px", background: "rgba(250, 250, 249, 0.06)", marginTop: "4rem", marginBottom: "2rem" }} />
        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.15)", fontFamily: "var(--font-sans)" }}>
          © 2025 Schollective · <Link href="/terms" style={{ color: "rgba(250, 250, 249, 0.25)", textDecoration: "none" }}>Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
