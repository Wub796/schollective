import React from "react";
import Link from "next/link";

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
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#fff" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "6rem 2rem" }}>
        {/* Nav */}
        <nav style={{ marginBottom: "5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Schollective</span>
          </Link>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/about"   style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none", fontFamily: "var(--font-sans)" }}>About</Link>
            <Link href="/privacy" style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none", fontFamily: "var(--font-sans)" }}>Privacy</Link>
          </div>
        </nav>

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", fontFamily: "var(--font-sans)" }}>Legal</span>
        </div>

        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "0.75rem" }}>
          Terms of <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.3)" }}>Service</em>
        </h1>
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-sans)", marginBottom: "4rem" }}>
          Last updated: May 2025
        </p>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "3rem" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-display" style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "-0.015em", marginBottom: "0.75rem" }}>{title}</h2>
              <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.85, fontFamily: "var(--font-sans)" }}>{body}</p>
            </div>
          ))}
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginTop: "4rem", marginBottom: "2rem" }} />
        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", fontFamily: "var(--font-sans)" }}>
          © 2025 Schollective · <Link href="/privacy" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
