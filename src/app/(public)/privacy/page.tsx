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
      body: "We do not sell your personal data. Your profile information (name, institution, expertise) is visible to other authenticated users. Messages are private between participants. We store data securely with Neon (our cloud database and storage provider) under strict data processing agreements, and share with no other third parties.",
    },
    {
      title: "4. Cookies & Local Storage",
      body: "Schollective sets one kind of cookie itself: the session cookie that keeps you signed in. Optional product analytics (PostHog and Amplitude) and error-reporting session replay (Sentry) are offered through a consent banner and start only if you accept; error reports that carry no analytics identity are sent either way, and no analytics is ever used for advertising. Because many of our students are minors, declining costs you nothing but aggregate usage counts — the product works in full without it.",
    },
    {
      title: "5. Data Retention",
      body: "Your account data is retained for as long as your account is active. You can disable your account yourself from Settings, which keeps it recoverable for 30 days, or delete it permanently, which removes your profile and the conversations it took part in. You can also ask us at privacy@schollective.com. Audit logs are retained for up to 90 days. One exception, and it exists for safety: a report someone has made about an account is stored separately from that account and is not removed by deleting it.",
    },
    {
      title: "6. Your Rights",
      body: "Depending on your jurisdiction, you may have rights to: access a copy of your data; correct inaccurate data; request deletion; and object to certain processing. To exercise these rights, email privacy@schollective.com. A parent or guardian asking on behalf of a student under 18 can use the same address, and we will tell you what we hold.",
    },
    {
      title: "7. Security",
      body: "All data is transmitted over HTTPS. Access to data is enforced by PostgreSQL row-level security policies in the database itself, not only by application code, so a query made on your behalf returns your rows and the rows you are entitled to see. A mentorship thread is readable only by the students on it and the professor; every message send is re-checked server-side, and every message is attributable to an account. Passwords are hashed and never stored in plaintext.",
    },
    {
      title: "8. Children's Privacy",
      body: "Schollective includes high-school students, and we collect the minimum needed to keep them safe: the education level a student gives at signup, which is how the platform knows a thread involves a minor, and the messages in a mentorship thread, which are retained so that a concern raised later can still be reviewed. We do not knowingly collect data from children under 13 and do not permit accounts for them. Students between 13 and 17 may use the platform only with the knowledge of a parent or guardian, who may ask us what we hold about their child and may ask for it to be removed. If you believe a child under 13 has created an account, or you have any concern about a student's safety, contact safety@schollective.com immediately; the rules themselves are in the Youth Protection Policy at /safety.",
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
    <div style={{ minHeight: "100vh", background: "transparent", color: "var(--text-primary)" }}>
      <PublicNav />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "9rem 2rem 6rem", display: "flex", flexDirection: "column", gap: "4.5rem" }}>
        <div>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "0.75rem" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", opacity: 0.75, fontFamily: "var(--font-sans)" }}>
            Last updated: September 2026
          </p>
        </div>

        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.4)", marginTop: "1rem", marginBottom: "1rem" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "2.75rem" }}>
          {sections.map(({ title, body }) => (
            <div key={title} style={{ padding: "2rem 2.25rem", border: "1px solid rgba(99, 102, 241, 0.4)", borderRadius: "16px", background: "rgba(255, 255, 255, 0.9)" }}>
              <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.015em", marginBottom: "0.75rem" }}>{title}</h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", opacity: 0.8, lineHeight: 1.8, fontFamily: "var(--font-sans)" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
