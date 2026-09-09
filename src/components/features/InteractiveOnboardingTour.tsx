"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Rocket,
  PartyPopper,
} from "lucide-react";

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
  suppressAutoLaunch?: boolean;
}

export function InteractiveOnboardingTour({ role, steps, suppressAutoLaunch = false }: InteractiveOnboardingTourProps) {
  const tourKey = `schollective-tour-${role}-v2`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 = welcome, steps.length = complete
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Broadcast tour active status to window so headers/banners can react
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("schollective:tour-status", {
          detail: { active: isOpen, role },
        })
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("schollective:tour-status", {
            detail: { active: false, role },
          })
        );
      }
    };
  }, [isOpen, role]);

  // Check if first-time user OR triggered via ?tour=true query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const forceTour =
        urlParams.get("tour") === "true" ||
        urlParams.get("tour") === "1" ||
        urlParams.get("tour") === "open";
      const completed = localStorage.getItem(tourKey) === "completed";

      if (forceTour || (!completed && !suppressAutoLaunch)) {
        window.dispatchEvent(
          new CustomEvent("schollective:tour-status", {
            detail: { active: true, role },
          })
        );
        const timer = setTimeout(() => {
          setIsOpen(true);
          setCurrentStepIndex(-1); // start with welcome splash

          if (forceTour && window.history?.replaceState) {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("tour");
            const newSearch = cleanUrl.searchParams.toString();
            window.history.replaceState(
              {},
              document.title,
              cleanUrl.pathname + (newSearch ? `?${newSearch}` : "")
            );
          }
        }, 650);
        return () => clearTimeout(timer);
      }
    }
  }, [tourKey, role, suppressAutoLaunch]);

  // Listen for on-demand tour launch events (e.g. from Admin preview banner or sidebar)
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

  // Measure target element position cleanly
  const measureElement = useCallback(() => {
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
    } else {
      setRect(null);
    }
  }, [isOpen, currentStepIndex, steps]);

  // Handle intentional step transitions (scroll smoothly if needed, measure cleanly)
  useEffect(() => {
    if (!isOpen || currentStepIndex < 0 || currentStepIndex >= steps.length) {
      setRect(null);
      return;
    }

    const targetId = steps[currentStepIndex].targetId;
    const element =
      document.querySelector(`[data-tour="${targetId}"]`) ||
      document.getElementById(targetId);

    if (!element) {
      setRect(null);
      return;
    }

    const initialRect = element.getBoundingClientRect();
    const isOffscreen = initialRect.top < 80 || initialRect.bottom > window.innerHeight - 80;

    if (isOffscreen) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      const t1 = setTimeout(measureElement, 150);
      const t2 = setTimeout(measureElement, 350);
      const t3 = setTimeout(measureElement, 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      measureElement();
    }
  }, [isOpen, currentStepIndex, steps, measureElement]);

  // Handle window resize and manual user scrolling smoothly
  useEffect(() => {
    if (!isOpen || currentStepIndex < 0 || currentStepIndex >= steps.length) return;

    let ticking = false;
    const handleScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          measureElement();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize);
    };
  }, [isOpen, currentStepIndex, steps, measureElement]);

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

  if (!isOpen) return null;

  // ─── Tour Modes ───────────────────────────────────────────────
  const isWelcome = currentStepIndex === -1;
  const isComplete = currentStepIndex === steps.length;
  const isTouring = currentStepIndex >= 0 && currentStepIndex < steps.length;

  const currentStep = isTouring ? steps[currentStepIndex] : null;
  const progressPercent = isWelcome
    ? 0
    : isComplete
    ? 100
    : Math.round(((currentStepIndex + 1) / steps.length) * 100);

  // Compute popover position near highlighted element
  let popoverTop = 80;
  let popoverLeft = 20;
  const popoverWidth = 380;

  if (rect && isTouring) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const windowH = typeof window !== "undefined" ? window.innerHeight : 800;
    const windowW = typeof window !== "undefined" ? window.innerWidth : 1200;

    if (isMobile) {
      popoverLeft = 16;
      popoverTop = Math.max(16, Math.min(rect.bottom + 16, windowH - 280));
    } else {
      popoverLeft = Math.max(20, Math.min(rect.left, windowW - popoverWidth - 20));
      if (rect.bottom + 280 < windowH) {
        popoverTop = rect.bottom + 16;
      } else if (rect.top - 270 > 20) {
        popoverTop = rect.top - 270;
      } else {
        popoverTop = Math.max(20, Math.min(rect.bottom + 16, windowH - 280));
      }
    }

    // Explicit boundary clamp to guarantee the popover is always 100% visible inside the screen
    popoverTop = Math.max(16, Math.min(popoverTop, windowH - 280));
    popoverLeft = Math.max(16, Math.min(popoverLeft, windowW - (isMobile ? 32 : popoverWidth) - 16));
  }

  const roleLabel = role === "student" ? "Scholar" : "Faculty";
  const roleEmoji = role === "student" ? "🎓" : "🔬";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      {/* ─── Persistent Dark Backdrop (Ensures screen NEVER flashes white) ─── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.72)",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: isTouring && rect ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}
      />

      {/* ─── Intentional Spotlight (Single smooth trajectory over 0.6s) ────── */}
      {isTouring && rect && (
        <div
          style={{
            position: "fixed",
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: "16px",
            boxShadow:
              "0 0 0 9999px rgba(15, 23, 42, 0.72), inset 0 0 0 2px rgba(99, 102, 241, 0.8), 0 0 35px rgba(99, 102, 241, 0.3)",
            border: "2px solid rgba(99, 102, 241, 0.8)",
            pointerEvents: "none",
            zIndex: 9999,
            transition:
              "top 0.6s cubic-bezier(0.16, 1, 0.3, 1), left 0.6s cubic-bezier(0.16, 1, 0.3, 1), width 0.6s cubic-bezier(0.16, 1, 0.3, 1), height 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      )}

      {/* ─── Welcome Splash Card (Centered) ───────────────────────── */}
      <AnimatePresence>
        {isWelcome && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
              zIndex: 10000,
              pointerEvents: "none",
            }}
          >
            <motion.div
              key="tour-welcome-card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: "430px",
                maxHeight: "calc(100vh - 3rem)",
                overflowY: "auto",
                background: "#ffffff",
                borderRadius: "20px",
                padding: "2rem 1.75rem 1.75rem",
                boxShadow:
                  "0 25px 60px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                textAlign: "center",
                fontFamily: "var(--font-sans)",
                position: "relative",
              }}
            >
              {/* Top accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: "linear-gradient(90deg, #4f46e5, #6366f1, #818cf8, #6366f1, #4f46e5)",
                  borderRadius: "20px 20px 0 0",
                }}
              />

              {/* Skip button */}
              <button
                type="button"
                onClick={handleSkip}
                style={{
                  position: "absolute",
                  top: "0.85rem",
                  right: "0.85rem",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "0.3rem",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Skip Tour"
              >
                <X size={18} />
              </button>

              {/* Static Rocket Icon */}
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "0.25rem",
                }}
              >
                <Rocket size={24} color="#ffffff" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#4f46e5",
                  }}
                >
                  {roleEmoji} {roleLabel} Quickstart Tour
                </span>
                <h2
                  className="font-display"
                  style={{
                    fontSize: "1.45rem",
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
                  fontSize: "0.84rem",
                  color: "#475569",
                  lineHeight: 1.55,
                  margin: 0,
                  maxWidth: "340px",
                }}
              >
                {role === "student"
                  ? "Let's take a quick tour of your dashboard. We'll show you how to build your profile, preview the faculty view, and connect with mentors."
                  : "Let's walk through your faculty dashboard. We'll cover student requests, setting availability, and customizing your research focus."}
              </p>

              {/* Step count badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.7rem",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                <Sparkles size={13} color="#4f46e5" />
                <span>{steps.length} interactive steps · ~1 min</span>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.65rem", marginTop: "0.25rem", width: "100%" }}>
                <button
                  type="button"
                  onClick={handleSkip}
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    flex: 1.4,
                    padding: "0.65rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#4f46e5",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Start Tour <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Completion Screen (Centered) ─────────────────────────── */}
      <AnimatePresence>
        {isComplete && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
              zIndex: 10000,
              pointerEvents: "none",
            }}
          >
            <motion.div
              key="tour-complete-card"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: "430px",
                maxHeight: "calc(100vh - 3rem)",
                overflowY: "auto",
                background: "#ffffff",
                borderRadius: "20px",
                padding: "2rem 1.75rem 1.75rem",
                boxShadow:
                  "0 25px 60px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(16, 185, 129, 0.25)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                textAlign: "center",
                fontFamily: "var(--font-sans)",
                position: "relative",
              }}
            >
              {/* Top accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: "linear-gradient(90deg, #10b981, #34d399, #6ee7b7, #34d399, #10b981)",
                  borderRadius: "20px 20px 0 0",
                }}
              />

              {/* Static Party Popper Icon */}
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "0.25rem",
                }}
              >
                <PartyPopper size={24} color="#ffffff" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#10b981",
                  }}
                >
                  🎉 Tour Complete!
                </span>
                <h2
                  className="font-display"
                  style={{
                    fontSize: "1.45rem",
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
                  fontSize: "0.84rem",
                  color: "#475569",
                  lineHeight: 1.55,
                  margin: 0,
                  maxWidth: "340px",
                }}
              >
                {role === "student"
                  ? "Your dashboard is ready. Complete your research profile, use AI review for feedback, and start reaching out to professors!"
                  : "Your faculty dashboard is ready. Set your availability, review incoming requests, and fine-tune your research profile!"}
              </p>

              {/* Action button */}
              <button
                type="button"
                onClick={handleComplete}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#10b981",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <Check size={16} /> Let&apos;s Go!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Intentional Smooth Popover Card (Single 0.6s Glide) ──────────── */}
      {isTouring && currentStep && (
        <div
          style={{
            position: "fixed",
            top: rect ? popoverTop : "50%",
            left: rect ? popoverLeft : "50%",
            transform: rect ? "none" : "translate(-50%, -50%)",
            width: "calc(100vw - 32px)",
            maxWidth: `${popoverWidth}px`,
            background: "#ffffff",
            borderRadius: "16px",
            padding: "0",
            boxShadow:
              "0 20px 50px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(99, 102, 241, 0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 10000,
            overflow: "hidden",
            fontFamily: "var(--font-sans)",
            transition:
              "top 0.6s cubic-bezier(0.16, 1, 0.3, 1), left 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "3px",
              background: "rgba(99, 102, 241, 0.1)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: "#4f46e5",
                transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>

          <div style={{ padding: "1.25rem 1.35rem 1.15rem" }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.65rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                {currentStep.emoji && (
                  <span style={{ fontSize: "1rem", lineHeight: 1 }}>{currentStep.emoji}</span>
                )}
                <span
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#4f46e5",
                    fontFamily: "var(--font-sans, monospace)",
                  }}
                >
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Skip Tour"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stable Content with gentle crossfade */}
            <div style={{ minHeight: "5.5rem", display: "flex", flexDirection: "column" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`step-content-${currentStepIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
                >
                  <h4
                    className="font-display"
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: 0,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.25,
                    }}
                  >
                    {currentStep.title}
                  </h4>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#475569",
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {currentStep.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step Dots */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem",
                margin: "0.85rem 0 0.65rem",
              }}
            >
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: idx === currentStepIndex ? "16px" : "6px",
                    height: "5px",
                    borderRadius: "100px",
                    background:
                      idx === currentStepIndex
                        ? "#4f46e5"
                        : idx < currentStepIndex
                        ? "#a5b4fc"
                        : "#e2e8f0",
                    transition: "all 0.35s ease",
                  }}
                />
              ))}
            </div>

            {/* Step Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                paddingTop: "0.25rem",
              }}
            >
              <button
                type="button"
                onClick={handleSkip}
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.3rem 0.2rem",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Skip tour
              </button>

              <div style={{ display: "flex", gap: "0.45rem" }}>
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.45rem 1rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {currentStepIndex === steps.length - 1 ? (
                    <>
                      <Check size={13} /> Finish
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
