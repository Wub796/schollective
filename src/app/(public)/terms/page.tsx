"use client";

import React from "react";
import Link from "next/link";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      body: "By creating an account or using the Schollective platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.",
    },
    {
      title: "2. Eligibility",
      body: "You must be at least 13 years old to use Schollective as a student. Professors must be currently employed or affiliated with a recognized academic institution and must provide accurate credential information during registration.",
    },
    {
      title: "3. Academic Integrity",
      body: "Schollective is a platform for genuine academic mentorship. Users may not misrepresent their credentials, impersonate others, or use the platform for commercial solicitation, plagiarism assistance, or any activity that violates institutional academic integrity policies.",
    },
    {
      title: "4. User Content",
      body: "Messages and content you send through Schollective remain your property. By submitting content, you grant Schollective a limited, non-exclusive license to store and display that content solely for the purpose of providing the service. We do not sell your messages to third parties.",
    },
    {
      title: "5. Professor Verification",
      body: "Schollective uses an algorithmic scoring system to assess professor applications. Approval is at the sole discretion of Schollective administrators. Verified status may be revoked if a professor is found to have provided false information.",
    },
    {
      title: "6. Prohibited Conduct",
      body: "You may not use Schollective to: harass, threaten, or abuse other users; share spam, malware, or phishing links; post content that is illegal, defamatory, or sexually explicit; or attempt to reverse-engineer or compromise platform security.",
    },
    {
      title: "7. Termination",
      body: "Schollective reserves the right to suspend or permanently remove any account that violates these Terms, without prior notice. You may delete your account at any time via the Account Settings page.",
    },
    {
      title: "8. Limitation of Liability",
      body: "Schollective is provided \"as is\" without warranties of any kind. We are not liable for the accuracy of professor credentials, the quality of mentorship sessions, or any indirect, incidental, or consequential damages arising from platform use.",
    },
    {
      title: "9. Changes to These Terms",
      body: "We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms. Material changes will be announced via platform notifications.",
    },
    {
      title: "10. Contact",
      body: "Questions about these Terms? Reach us at legal@schollective.com.",
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
            Terms of <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Service</em>
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
