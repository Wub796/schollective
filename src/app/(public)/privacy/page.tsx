"use client";

import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/ui/PublicNav";

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
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <PublicNav />

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "12rem 2rem 8rem" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "var(--border)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-sans)" }}>Legal</span>
        </div>

        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "2rem" }}>
          Privacy <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Policy</em>
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", marginBottom: "4.5rem" }}>
          Last updated: May 2025
        </p>

        <div style={{ height: "1px", background: "var(--border)", marginBottom: "4rem" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.015em", marginBottom: "1rem" }}>{title}</h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.85, fontFamily: "var(--font-sans)" }}>{body}</p>
            </div>
          ))}
        </div>

        <div style={{ height: "1px", background: "var(--border)", marginTop: "5rem", marginBottom: "2rem" }} />
        <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)" }}>
          © 2025 Schollective · <Link href="/terms" style={{ color: "var(--accent)", textDecoration: "none" }}>Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
