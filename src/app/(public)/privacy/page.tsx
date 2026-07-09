"use client";

import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";

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
    <div style={{ minHeight: "100vh", background: "transparent", color: "#0f172a" }}>
      <PublicNav />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "8rem 2rem 6rem", display: "flex", flexDirection: "column", gap: "4.5rem" }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans)" }}>Legal</span>
        </div>

        <div>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "0.75rem" }}>
            Privacy <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Policy</em>
          </h1>
          <p style={{ fontSize: "0.88rem", color: "#475569", opacity: 0.75, fontFamily: "var(--font-sans)" }}>
            Last updated: May 2025
          </p>
        </div>

        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.4)", marginTop: "1rem", marginBottom: "1rem" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "2.75rem" }}>
          {sections.map(({ title, body }) => (
            <div key={title} style={{ padding: "2rem 2.25rem", border: "1px solid rgba(99, 102, 241, 0.4)", borderRadius: "16px", background: "rgba(255, 255, 255, 0.9)" }}>
              <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.015em", marginBottom: "0.75rem" }}>{title}</h2>
              <p style={{ fontSize: "0.95rem", color: "#475569", opacity: 0.8, lineHeight: 1.8, fontFamily: "var(--font-sans)" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
