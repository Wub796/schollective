"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface TourStep {
  targetId: string; // matches data-tour attribute
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface InteractiveOnboardingTourProps {
  role: "student" | "professor";
  steps: TourStep[];
}

export function InteractiveOnboardingTour({ role, steps }: InteractiveOnboardingTourProps) {
  const tourKey = `schollective-tour-${role}-v1`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Check if first-time user
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(tourKey) === "completed";
      if (!completed) {
        // Small delay so dashboard DOM elements mount cleanly
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 750);
        return () => clearTimeout(timer);
      }
    }
  }, [tourKey]);

  const updateRect = useCallback(() => {
    if (!isOpen || !steps[currentStepIndex]) return;
    const targetId = steps[currentStepIndex].targetId;
    const element = document.querySelector(`[data-tour="${targetId}"]`) || document.getElementById(targetId);

    if (element) {
      const r = element.getBoundingClientRect();
      setRect(r);
      // Smooth scroll target into view if offscreen
      if (r.top < 0 || r.bottom > window.innerHeight) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setRect(null);
    }
  }, [isOpen, currentStepIndex, steps]);

  // Recalculate spotlight position on step change, scroll, or resize
  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [updateRect]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(tourKey, "completed");
    }
  };

  const handleReplay = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  if (!isOpen && typeof window !== "undefined" && localStorage.getItem(tourKey) === "completed") {
    return (
      <button
        onClick={handleReplay}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 40,
          background: "rgba(255, 255, 255, 0.95)",
          border: "1.5px solid rgba(99, 102, 241, 0.35)",
          borderRadius: "100px",
          padding: "0.55rem 1.15rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#4f46e5",
          cursor: "pointer",
          boxShadow: "0 4px 18px rgba(79, 70, 229, 0.15)",
          backdropFilter: "blur(10px)",
          transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        title="Replay Interactive Tour"
      >
        <HelpCircle size={15} color="#4f46e5" />
        <span>Take Product Tour</span>
      </button>
    );
  }

  if (!isOpen || !steps[currentStepIndex]) return null;

  const currentStep = steps[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  // Compute position for popover box
  let popoverTop = 100;
  let popoverLeft = 100;

  if (rect) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobile) {
      popoverLeft = 16;
      popoverTop = Math.min(rect.bottom + 16, window.innerHeight - 260);
    } else {
      popoverLeft = Math.max(20, Math.min(rect.left, window.innerWidth - 380));
      if (rect.bottom + 260 < window.innerHeight) {
        popoverTop = rect.bottom + 16;
      } else if (rect.top - 260 > 0) {
        popoverTop = rect.top - 260;
      } else {
        popoverTop = rect.top + 16;
      }
    }
  }

  return (
    <AnimatePresence>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "auto" }}>
        
        {/* Spotlight cutout overlay */}
        {rect ? (
          <div
            style={{
              position: "fixed",
              top: rect.top - 8,
              left: rect.left - 8,
              width: rect.width + 16,
              height: rect.height + 16,
              borderRadius: "16px",
              boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 30px rgba(99, 102, 241, 0.6)",
              border: "2px solid #6366f1",
              pointerEvents: "none",
              transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
              animation: "pulseBorder 2s infinite ease-in-out",
            }}
          />
        ) : (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.72)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Popover Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: rect ? popoverTop : "50%",
            left: rect ? popoverLeft : "50%",
            transform: rect ? "none" : "translate(-50%, -50%)",
            width: "calc(100vw - 32px)",
            maxWidth: "360px",
            background: "#ffffff",
            borderRadius: "20px",
            padding: "1.5rem",
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            zIndex: 10000,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Sparkles size={16} color="#4f46e5" />
              <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#4f46e5" }}>
                {role === "student" ? "Scholar Tour" : "Faculty Tour"} • Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <button
              onClick={handleComplete}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0.2rem" }}
              title="Skip Tour"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ width: "100%", height: "4px", background: "rgba(99, 102, 241, 0.12)", borderRadius: "100px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: "#4f46e5",
                borderRadius: "100px",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              {currentStep.title}
            </h4>
            <p style={{ fontSize: "0.84rem", color: "#475569", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-sans)" }}>
              {currentStep.description}
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem", gap: "0.75rem" }}>
            <button
              onClick={handleComplete}
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#64748b",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.4rem 0.2rem",
              }}
            >
              Skip
            </button>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {currentStepIndex > 0 && (
                <Button onClick={handleBack} variant="outline" size="sm" icon={<ArrowLeft size={14} />}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                variant="primary"
                size="sm"
                icon={currentStepIndex === steps.length - 1 ? <Check size={14} /> : <ArrowRight size={14} />}
              >
                {currentStepIndex === steps.length - 1 ? "Got it!" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
