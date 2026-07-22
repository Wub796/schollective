"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  HelpCircle,
  Rocket,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface TourStep {
  targetId: string; // matches data-tour attribute
  title: string;
  description: string;
  emoji?: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface InteractiveOnboardingTourProps {
  role: "student" | "professor";
  steps: TourStep[];
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function InteractiveOnboardingTour({ role, steps }: InteractiveOnboardingTourProps) {
  const tourKey = `schollective-tour-${role}-v2`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 = welcome, steps.length = complete
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Check if first-time user OR triggered via ?tour=true query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const forceTour =
        urlParams.get("tour") === "true" ||
        urlParams.get("tour") === "1" ||
        urlParams.get("tour") === "open";
      const completed = localStorage.getItem(tourKey) === "completed";

      if (forceTour || !completed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          setCurrentStepIndex(-1); // start with welcome splash
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [tourKey]);

  // Listen for on-demand tour launch events (e.g. from Admin preview banner)
  useEffect(() => {
    const handleLaunch = () => {
      setCurrentStepIndex(-1);
      setIsOpen(true);
    };
    window.addEventListener("schollective:launch-tour", handleLaunch);
    return () => {
      window.removeEventListener("schollective:launch-tour", handleLaunch);
    };
  }, []);

  const updateRect = useCallback(() => {
    if (!isOpen || currentStepIndex < 0 || currentStepIndex >= steps.length) {
      setRect(null);
      return;
    }
    const targetId = steps[currentStepIndex].targetId;
    const element =
      document.querySelector(`[data-tour="${targetId}"]`) ||
      document.getElementById(targetId);

    if (element) {
      const r = element.getBoundingClientRect();
      setRect(r);
      // Smooth scroll target into view if offscreen
      if (r.top < 0 || r.bottom > window.innerHeight) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // re-read after scroll settles
        setTimeout(() => {
          const updated = element.getBoundingClientRect();
          setRect(updated);
        }, 400);
      }
    } else {
      setRect(null);
    }
  }, [isOpen, currentStepIndex, steps]);

  // Recalculate spotlight position on step change, scroll, or resize
  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setCurrentStepIndex(steps.length); // show completion screen
    }
  };

  const handleBack = () => {
    setCurrentStepIndex((prev) => Math.max(-1, prev - 1));
  };

  const handleComplete = () => {
    setIsOpen(false);
    setCurrentStepIndex(-1);
    if (typeof window !== "undefined") {
      localStorage.setItem(tourKey, "completed");
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleReplay = () => {
    setCurrentStepIndex(-1);
    setIsOpen(true);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Replay Button (shown whenever tour is closed) ────────────
  if (!isOpen && mounted) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        onClick={handleReplay}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 40,
          background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(238,242,255,0.95))",
          border: "1.5px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "100px",
          padding: "0.6rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#4f46e5",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(79, 70, 229, 0.12), 0 0 0 1px rgba(79, 70, 229, 0.05)",
          backdropFilter: "blur(12px)",
          transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
          fontFamily: "var(--font-sans)",
        }}
        title="Replay Interactive Tour"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 8px 30px rgba(79, 70, 229, 0.2), 0 0 0 1px rgba(79, 70, 229, 0.1)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 4px 20px rgba(79, 70, 229, 0.12), 0 0 0 1px rgba(79, 70, 229, 0.05)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        <HelpCircle size={14} color="#4f46e5" />
        <span>Product Tour</span>
      </motion.button>
    );
  }

  if (!isOpen) return null;

  // ─── Welcome Screen (step -1) ──────────────────────────────────
  const isWelcome = currentStepIndex === -1;
  // ─── Completion Screen (step === steps.length) ─────────────────
  const isComplete = currentStepIndex === steps.length;
  // ─── Regular Tour Step ─────────────────────────────────────────
  const isTouring = currentStepIndex >= 0 && currentStepIndex < steps.length;

  const currentStep = isTouring ? steps[currentStepIndex] : null;
  const progressPercent = isWelcome
    ? 0
    : isComplete
    ? 100
    : Math.round(((currentStepIndex + 1) / steps.length) * 100);

  // Compute popover position near highlighted element
  let popoverTop = 0;
  let popoverLeft = 0;
  const popoverWidth = 380;

  if (rect && isTouring) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobile) {
      popoverLeft = 16;
      popoverTop = Math.min(rect.bottom + 20, window.innerHeight - 300);
    } else {
      popoverLeft = Math.max(20, Math.min(rect.left, window.innerWidth - popoverWidth - 20));
      if (rect.bottom + 300 < window.innerHeight) {
        popoverTop = rect.bottom + 20;
      } else if (rect.top - 300 > 0) {
        popoverTop = rect.top - 280;
      } else {
        popoverTop = Math.max(20, rect.top);
      }
    }
  }

  const roleLabel = role === "student" ? "Scholar" : "Faculty";
  const roleEmoji = role === "student" ? "🎓" : "🔬";

  return (
    <AnimatePresence mode="wait">
      <div
        key="tour-overlay"
        style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "auto" }}
      >
        {/* ─── Overlay / Spotlight ──────────────────────────────── */}
        {isTouring && rect ? (
          <motion.div
            key={`spotlight-${currentStepIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{
              position: "fixed",
              top: rect.top - 10,
              left: rect.left - 10,
              width: rect.width + 20,
              height: rect.height + 20,
              borderRadius: "16px",
              boxShadow:
                "0 0 0 9999px rgba(15, 23, 42, 0.68), inset 0 0 0 2px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.25)",
              border: "2px solid rgba(99, 102, 241, 0.5)",
              pointerEvents: "none",
              transition: "top 0.4s cubic-bezier(0.22,1,0.36,1), left 0.4s cubic-bezier(0.22,1,0.36,1), width 0.4s cubic-bezier(0.22,1,0.36,1), height 0.4s cubic-bezier(0.22,1,0.36,1)",
              animation: "tourSpotlightPulse 2.5s infinite ease-in-out",
            }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.68)",
              backdropFilter: "blur(2px)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* ─── Welcome Splash Card ───────────────────────────────── */}
        {isWelcome && (
          <motion.div
            key="tour-welcome"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100vw - 40px)",
              maxWidth: "440px",
              background: "linear-gradient(145deg, #ffffff 0%, #f5f3ff 60%, #eef2ff 100%)",
              borderRadius: "24px",
              padding: "2.5rem 2rem 2rem",
              boxShadow:
                "0 24px 60px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.15)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
              zIndex: 10000,
              textAlign: "center",
              fontFamily: "var(--font-sans)",
            }}
          >
            {/* Decorative top accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #4f46e5, #6366f1, #818cf8, #6366f1, #4f46e5)",
                borderRadius: "24px 24px 0 0",
              }}
            />

            {/* Skip button */}
            <button
              onClick={handleSkip}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "0.3rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748b")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#94a3b8")}
              title="Skip Tour"
            >
              <X size={18} />
            </button>

            {/* Animated icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 25px rgba(79, 70, 229, 0.3)",
              }}
            >
              <Rocket size={28} color="#ffffff" />
            </motion.div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#4f46e5",
                }}
              >
                {roleEmoji} {roleLabel} Quickstart Tour
              </span>
              <h2
                className="font-display"
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Welcome to Schollective
              </h2>
            </div>

            <p
              style={{
                fontSize: "0.88rem",
                color: "#475569",
                lineHeight: 1.65,
                margin: 0,
                maxWidth: "340px",
              }}
            >
              {role === "student"
                ? "Let's take a quick tour of your dashboard. We'll show you how to build a standout research profile, preview how professors see you, and navigate to find mentors."
                : "Let's walk through your faculty dashboard. We'll cover managing student requests, setting your availability, customizing your research profile, and reviewing candidates."}
            </p>

            {/* Step count preview */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.72rem",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              <Sparkles size={13} color="#6366f1" />
              <span>{steps.length} interactive steps · ~1 min</span>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", width: "100%" }}>
              <button
                onClick={handleSkip}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  background: "transparent",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(99, 102, 241, 0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                Skip for now
              </button>
              <button
                onClick={handleNext}
                style={{
                  flex: 1.5,
                  padding: "0.75rem",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(79, 70, 229, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 6px 24px rgba(79, 70, 229, 0.4)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 16px rgba(79, 70, 229, 0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                Start Tour <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Completion Screen ──────────────────────────────────── */}
        {isComplete && (
          <motion.div
            key="tour-complete"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100vw - 40px)",
              maxWidth: "440px",
              background: "linear-gradient(145deg, #ffffff 0%, #f5f3ff 60%, #eef2ff 100%)",
              borderRadius: "24px",
              padding: "2.5rem 2rem 2rem",
              boxShadow:
                "0 24px 60px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.15)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
              zIndex: 10000,
              textAlign: "center",
              fontFamily: "var(--font-sans)",
            }}
          >
            {/* Decorative top accent — green for success */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #10b981, #34d399, #6ee7b7, #34d399, #10b981)",
                borderRadius: "24px 24px 0 0",
              }}
            />

            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #10b981, #34d399)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)",
              }}
            >
              <PartyPopper size={28} color="#ffffff" />
            </motion.div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#10b981",
                }}
              >
                🎉 Tour Complete!
              </span>
              <h2
                className="font-display"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                You&apos;re All Set!
              </h2>
            </div>

            <p
              style={{
                fontSize: "0.88rem",
                color: "#475569",
                lineHeight: 1.65,
                margin: 0,
                maxWidth: "340px",
              }}
            >
              {role === "student"
                ? "Your dashboard is ready. Complete your research profile, use AI review for feedback, and start reaching out to professors!"
                : "Your faculty dashboard is ready. Set your availability, review incoming requests, and fine-tune your research profile to attract the right mentees!"}
            </p>

            <button
              onClick={handleComplete}
              style={{
                width: "100%",
                padding: "0.85rem",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "0.25rem",
                transition: "all 0.2s",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 6px 24px rgba(16, 185, 129, 0.4)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 16px rgba(16, 185, 129, 0.3)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <Check size={16} /> Let&apos;s Go!
            </button>
          </motion.div>
        )}

        {/* ─── Tour Step Popover Card ─────────────────────────────── */}
        {isTouring && currentStep && (
          <motion.div
            key={`tour-step-${currentStepIndex}`}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{
              position: "fixed",
              top: rect ? popoverTop : "50%",
              left: rect ? popoverLeft : "50%",
              transform: rect ? "none" : "translate(-50%, -50%)",
              width: "calc(100vw - 32px)",
              maxWidth: `${popoverWidth}px`,
              background: "linear-gradient(145deg, #ffffff 0%, #faf9ff 100%)",
              borderRadius: "20px",
              padding: "0",
              boxShadow:
                "0 20px 50px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.15)",
              display: "flex",
              flexDirection: "column",
              zIndex: 10000,
              overflow: "hidden",
              fontFamily: "var(--font-sans)",
            }}
          >
            {/* ── Gradient Progress Bar (top edge) ──────────────────── */}
            <div
              style={{
                width: "100%",
                height: "3px",
                background: "rgba(99, 102, 241, 0.08)",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: EASE }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)",
                  borderRadius: "0 2px 2px 0",
                }}
              />
            </div>

            <div style={{ padding: "1.35rem 1.5rem 1.25rem" }}>
              {/* ── Header ────────────────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {currentStep.emoji && (
                    <span style={{ fontSize: "1rem", lineHeight: 1 }}>{currentStep.emoji}</span>
                  )}
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#4f46e5",
                      fontFamily: "var(--font-sans, monospace)",
                    }}
                  >
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                </div>
                <button
                  onClick={handleSkip}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#64748b")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#94a3b8")
                  }
                  title="Skip Tour"
                >
                  <X size={16} />
                </button>
              </div>

              {/* ── Content ───────────────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <h4
                  className="font-display"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.25,
                  }}
                >
                  {currentStep.title}
                </h4>
                <p
                  style={{
                    fontSize: "0.84rem",
                    color: "#475569",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {currentStep.description}
                </p>
              </div>

              {/* ── Step Dots ─────────────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                  margin: "1rem 0 0.75rem",
                }}
              >
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: idx === currentStepIndex ? "18px" : "6px",
                      height: "6px",
                      borderRadius: "100px",
                      background:
                        idx === currentStepIndex
                          ? "linear-gradient(90deg, #4f46e5, #6366f1)"
                          : idx < currentStepIndex
                          ? "#a5b4fc"
                          : "rgba(99, 102, 241, 0.15)",
                      transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                ))}
              </div>

              {/* ── Controls ──────────────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <button
                  onClick={handleSkip}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#94a3b8",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.4rem 0.2rem",
                    transition: "color 0.2s",
                    fontFamily: "var(--font-sans)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#64748b")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#94a3b8")
                  }
                >
                  Skip tour
                </button>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {currentStepIndex > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      size="sm"
                      icon={<ArrowLeft size={14} />}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    size="sm"
                    icon={
                      currentStepIndex === steps.length - 1 ? (
                        <Check size={14} />
                      ) : (
                        <ArrowRight size={14} />
                      )
                    }
                  >
                    {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
