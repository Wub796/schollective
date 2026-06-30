"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

export function FeedbackPrompt() {
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    // Check if the user has already dismissed or submitted the feedback
    const dismissed = localStorage.getItem("schollective-feedback-dismissed") === "true";
    if (!dismissed) {
      // Delay mounting slightly to create a nice entry animation feel
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("schollective-feedback-dismissed", "true");
    setVisible(false);
  };

  const handleSubmit = (selectedRating: number) => {
    setRating(selectedRating);
    setSubmitted(true);
    toast.success("Thank you for your feedback! It helps us build a better mentorship space.");
    
    // Store in localStorage so it is never shown again
    localStorage.setItem("schollective-feedback-dismissed", "true");
    
    // Auto-fade out after 3 seconds
    setTimeout(() => {
      setVisible(false);
    }, 3000);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(245, 243, 255, 0.8) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(79, 70, 229, 0.15)",
          borderRadius: "20px",
          padding: "1.75rem 2rem",
          boxShadow: "0 10px 30px rgba(79, 70, 229, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "2.5rem",
          overflow: "hidden"
        }}
      >
        {/* Decorative corner glow */}
        <div style={{
          position: "absolute",
          top: "-5rem",
          right: "-5rem",
          width: "10rem",
          height: "10rem",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(15, 23, 42, 0.35)",
            padding: "0.25rem",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background = "rgba(15, 23, 42, 0.04)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "rgba(15, 23, 42, 0.35)";
            e.currentTarget.style.background = "none";
          }}
          aria-label="Dismiss feedback prompt"
        >
          <X size={16} />
        </button>

        {!submitted ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
              <div style={{
                width: "2.2rem",
                height: "2.2rem",
                borderRadius: "10px",
                background: "rgba(79, 70, 229, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                flexShrink: 0
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-display" style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  letterSpacing: "-0.02em"
                }}>
                  How is your research dialogue going?
                </h3>
                <p style={{
                  fontSize: "0.82rem",
                  color: "rgba(15, 23, 42, 0.5)",
                  margin: "0.2rem 0 0 0",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.5
                }}>
                  One of your mentorship requests has been accepted. Share a quick rating to let us know about your experience so far!
                </p>
              </div>
            </div>

            {/* Rating Stars */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverRating !== null ? star <= hoverRating : rating !== null ? star <= rating : false);
                return (
                  <motion.button
                    key={star}
                    onClick={() => handleSubmit(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isActive ? "#fbbf24" : "rgba(15, 23, 42, 0.15)",
                      transition: "color 0.2s"
                    }}
                  >
                    <Star
                      size={28}
                      fill={isActive ? "#fbbf24" : "transparent"}
                      strokeWidth={1.5}
                    />
                  </motion.button>
                );
              })}
              {hoverRating !== null && (
                <span style={{
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  color: "rgba(15, 23, 42, 0.4)",
                  fontFamily: "var(--font-sans)",
                  marginLeft: "0.5rem"
                }}>
                  {["Needs work", "Okay", "Good", "Great", "Excellent!"][hoverRating - 1]}
                </span>
              )}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "1rem 0",
              gap: "0.5rem"
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                background: "rgba(120, 220, 120, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(120, 220, 120, 0.9)",
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "0.25rem"
              }}
            >
              ✓
            </motion.div>
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Feedback received!
            </h4>
            <p style={{ fontSize: "0.8rem", color: "rgba(15, 23, 42, 0.45)", margin: 0, fontFamily: "var(--font-sans)" }}>
              We're thrilled to support you on your academic research journey.
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
