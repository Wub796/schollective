"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  GraduationCap,
  FileText,
  Trophy,
  Wrench,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";

interface SectionDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: "section-resume",    label: "Resume",     icon: <Upload size={13} /> },
  { id: "section-personal",  label: "Personal",   icon: <User size={13} /> },
  { id: "section-academic",  label: "Academic",   icon: <GraduationCap size={13} /> },
  { id: "section-pitch",     label: "Pitch",      icon: <FileText size={13} /> },
  { id: "section-activities", label: "Activities", icon: <Sparkles size={13} /> },
  { id: "section-honors",    label: "Honors",     icon: <Trophy size={13} /> },
  { id: "section-skills",    label: "Skills",     icon: <Wrench size={13} /> },
];

interface Props {
  onSaveClick?: () => void;
  loading?: boolean;
}

export function ProfileSectionNav({ onSaveClick, loading }: Props) {
  const [activeSection, setActiveSection] = useState<string>("");
  const navRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Track which section is in view using IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const visibleSections = new Map<string, number>();

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visibleSections.set(section.id, entry.intersectionRatio);
            } else {
              visibleSections.delete(section.id);
            }

            // Find the most visible section
            let maxRatio = 0;
            let maxId = "";
            visibleSections.forEach((ratio, id) => {
              if (ratio > maxRatio) {
                maxRatio = ratio;
                maxId = id;
              }
            });
            if (maxId) setActiveSection(maxId);
          });
        },
        {
          root: document.querySelector(".app-main"),
          rootMargin: "-80px 0px -40% 0px",
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Auto-scroll the nav strip to keep the active pill visible
  useEffect(() => {
    if (!activeSection || !navRef.current) return;
    const pill = pillRefs.current[activeSection];
    if (pill) {
      pill.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeSection]);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const main = document.querySelector(".app-main");
    if (main) {
      const top = el.getBoundingClientRect().top + main.scrollTop - 120;
      main.scrollTo({ top, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div
      ref={navRef}
      style={{
        position: "sticky",
        top: "3.5rem",
        zIndex: 15,
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderRadius: "14px",
        border: "1px solid rgba(99, 102, 241, 0.12)",
        padding: "0.45rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.3rem",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "x mandatory",
        }}
        className="hide-scrollbar"
      >
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              ref={(el) => { pillRefs.current[section.id] = el; }}
              type="button"
              onClick={() => scrollToSection(section.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.75rem",
                borderRadius: "10px",
                border: "none",
                background: isActive
                  ? "rgba(99, 102, 241, 0.12)"
                  : "transparent",
                color: isActive ? "#4f46e5" : "#64748b",
                fontSize: "0.72rem",
                fontWeight: isActive ? 700 : 500,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                whiteSpace: "nowrap",
                flexShrink: 0,
                scrollSnapAlign: "center",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(99, 102, 241, 0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#475569";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#64748b";
                }
              }}
            >
              {section.icon}
              {section.label}
            </button>
          );
        })}

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: "0.5rem" }} />

        {/* Save pill */}
        {onSaveClick && (
          <button
            type="button"
            onClick={onSaveClick}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              color: "#ffffff",
              fontSize: "0.72rem",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
            }}
          >
            <Save size={12} />
            Save
          </button>
        )}
      </div>
    </div>
  );
}
