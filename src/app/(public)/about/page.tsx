import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", color: "#fff" }}>
      {/* Glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: "70vw", height: "70vw", maxWidth: 700, maxHeight: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,60,160,0.09) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "880px", margin: "0 auto", padding: "6rem 2rem" }}>

        {/* Wordmark nav */}
        <nav style={{ marginBottom: "5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Schollective</span>
          </Link>
        </nav>

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", fontFamily: "var(--font-sans)" }}>
            About
          </span>
        </div>

        {/* Hero text */}
        <h1 className="font-display" style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: "2rem" }}>
          Democratizing<br />
          <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.3)" }}>academic mentorship.</em>
        </h1>

        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.85, maxWidth: "560px", fontFamily: "var(--font-sans)", marginBottom: "5rem" }}>
          Schollective bridges the gap between students who hunger for guidance and the professors who have the expertise to provide it — removing institutional barriers and making world-class mentorship accessible to everyone.
        </p>

        {/* Hairline */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "4rem" }} />

        {/* Problem / Solution grid */}
        <div className="prose-two-col" style={{ marginBottom: "5rem" }}>
          {[
            { label: "The Problem", title: "Mentorship is gated by proximity", body: "Students at underfunded schools or outside major research hubs rarely get access to the professors whose work aligns with their interests. Geography and institutional prestige create invisible walls." },
            { label: "The Solution", title: "A verified, open network", body: "Schollective verifies professor credentials algorithmically and creates a direct, zero-friction channel between scholars and students — no tuition required, no campus required." },
          ].map(({ label, title, body }) => (
            <div key={label}>
              <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono, monospace)", marginBottom: "1rem" }}>{label}</div>
              <h2 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.025em", lineHeight: 1.25, marginBottom: "1rem" }}>{title}</h2>
              <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.8, fontFamily: "var(--font-sans)" }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Hairline */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "4rem" }} />

        {/* Stats */}
        <div style={{ display: "flex", gap: "4rem", marginBottom: "5rem", flexWrap: "wrap" }}>
          {[
            { n: "2,300+", l: "US Universities in Database" },
            { n: "Free",   l: "Always, for students" },
            { n: "100%",   l: "Algorithm-verified professors" },
          ].map(({ n, l }) => (
            <div key={l}>
              <div className="font-display" style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-sans)", marginTop: "0.5rem" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Hairline */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "4rem" }} />

        {/* Built for */}
        <div style={{ marginBottom: "5rem" }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono, monospace)", marginBottom: "1.5rem" }}>Built For</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { role: "Students", desc: "From high schoolers writing research papers to undergrads exploring graduate schools. If you have a serious academic question, Schollective is for you." },
              { role: "Professors", desc: "Faculty members who want to pay their expertise forward. Connect with motivated students who respect your time and come prepared." },
            ].map(({ role, desc }) => (
              <div key={role} style={{ padding: "1.5rem", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div className="font-display" style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "-0.02em" }}>{role}</div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.75, fontFamily: "var(--font-sans)" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.9rem 2rem", background: "#fff", color: "#080c14", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              Join Schollective
            </div>
          </Link>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.9rem 2rem", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              Back to Home
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
