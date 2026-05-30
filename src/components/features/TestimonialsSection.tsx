"use client";

import React from "react";
import { Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  institution: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    quote: "Schollective replaced weeks of cold emailing with a single, high-context request. I connected with a Stanford professor in three days.",
    name: "Alex Rivera",
    role: "Undergraduate Scholar",
    institution: "Stanford University"
  },
  {
    quote: "As a professor, my inbox is flooded with generic outreach. Schollective's structured requests let me instantly spot high-potential research dialogues.",
    name: "Dr. Evelyn Carter",
    role: "Associate Professor of AI",
    institution: "MIT"
  },
  {
    quote: "Finding a mentor in specialized fields like bio-ethics used to be impossible. Schollective bridged that gap seamlessly.",
    name: "Liam Chen",
    role: "PhD Candidate",
    institution: "UC Berkeley"
  }
];

export function TestimonialsSection() {
  // Only render if env variable is explicitly true
  const showTestimonials = process.env.NEXT_PUBLIC_SHOW_TESTIMONIALS === "true";
  if (!showTestimonials) return null;

  return (
    <section style={{
      padding: "7rem 1.5rem",
      background: "rgba(15, 23, 42, 0.015)",
      borderTop: "1px solid rgba(15, 23, 42, 0.03)",
      borderBottom: "1px solid rgba(15, 23, 42, 0.03)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "50rem",
        height: "30rem",
        background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
        zIndex: 0,
        pointerEvents: "none"
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "60rem", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", marginBottom: "4.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans, monospace)" }}>
              Social Proof
            </span>
            <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          </div>
          <h2 className="font-display" style={{
            fontSize: "clamp(2.4rem, 5vw, 3.2rem)",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05
          }}>
            Trusted by <em style={{ fontStyle: "italic", color: "var(--accent)" }}>scholars & faculty</em>
          </h2>
        </div>

        {/* Testimonials Grid/Scroll */}
        <div 
          className="testimonials-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
            width: "100%"
          }}
        >
          {defaultTestimonials.map((t, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(15, 23, 42, 0.06)",
                borderRadius: "20px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(99, 102, 241, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.06)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.02)";
              }}
            >
              {/* Quote Icon */}
              <Quote size={20} color="var(--accent)" style={{ opacity: 0.8 }} />

              {/* Quote */}
              <p style={{
                fontSize: "0.88rem",
                color: "rgba(15, 23, 42, 0.65)",
                lineHeight: 1.7,
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontStyle: "italic"
              }}>
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                  {t.name}
                </span>
                <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-sans, monospace)" }}>
                  {t.role} · {t.institution}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
