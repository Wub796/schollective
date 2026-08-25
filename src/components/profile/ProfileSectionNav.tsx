"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  GraduationCap,
  FileText,
  Trophy,
  Wrench,
  Sparkles,
  Upload,
} from "lucide-react";

interface SectionDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionDef[] = [
  { id: "section-resume",     label: "Resume",     icon: <Upload size={13} /> },
  { id: "section-personal",   label: "Personal",   icon: <User size={13} /> },
  { id: "section-academic",   label: "Academic",   icon: <GraduationCap size={13} /> },
  { id: "section-pitch",      label: "Pitch",      icon: <FileText size={13} /> },
  { id: "section-activities", label: "Activities", icon: <Sparkles size={13} /> },
  { id: "section-honors",     label: "Honors",     icon: <Trophy size={13} /> },
  { id: "section-skills",     label: "Skills",     icon: <Wrench size={13} /> },
];

interface Props {
  className?: string;
}

export function ProfileSectionNav({ className }: Props = {}) {
  const [activeSection, setActiveSection] = useState<string>("section-resume");
  const [isStuck, setIsStuck] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Scroll listener: update active section & sticky state
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      // 1. Detect if nav strip is currently pinned/stuck under the header
      if (navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        // Header height is 56px, nav sticks at 56 + 12 = 68px
        setIsStuck(navRect.top <= 72);
      }

      // 2. Detect which section is active
      const headerThreshold = 140; // distance from top of viewport
      let currentSectionId = SECTIONS[0].id;

      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= headerThreshold) {
          currentSectionId = section.id;
        } else {
          break;
        }
      }

      setActiveSection(currentSectionId);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Also listen to any scroll on .app-main if applicable
    const main = document.querySelector(".app-main");
    if (main) main.addEventListener("scroll", handleScroll, { passive: true });

    onScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (main) main.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Auto-scroll the horizontal strip to keep the active section pill in view
  useEffect(() => {
    if (!activeSection) return;
    const pill = pillRefs.current[activeSection];
    if (pill) {
      pill.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeSection]);

  // Smooth scroll to target section with offset for header + nav strip
  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    setActiveSection(sectionId);

    // Total clearance = header (56px) + padding (12px) + nav height (~44px) + breathing space (16px) = ~128px
    const headerOffset = 128;

    const elRect = el.getBoundingClientRect();
    const currentScrollY = window.scrollY ?? document.documentElement.scrollTop ?? 0;
    const targetY = currentScrollY + elRect.top - headerOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: "smooth",
    });

    const main = document.querySelector(".app-main");
    if (main && main.scrollHeight > main.clientHeight) {
      const mainRect = main.getBoundingClientRect();
      const targetMainY = main.scrollTop + (elRect.top - mainRect.top) - headerOffset;
      main.scrollTo({
        top: Math.max(0, targetMainY),
        behavior: "smooth",
      });
    }
  }, []);

  return (
    <div
      ref={navRef}
      style={{
        position: "sticky",
        top: "calc(var(--nav-height, 56px) + 12px)",
        zIndex: 25,
        background: isStuck
          ? "rgba(255, 255, 255, 0.92)"
          : "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(20px) saturate(190%)",
        WebkitBackdropFilter: "blur(20px) saturate(190%)",
        borderRadius: "14px",
        border: isStuck
          ? "1px solid rgba(99, 102, 241, 0.22)"
          : "1px solid rgba(99, 102, 241, 0.12)",
        padding: "0.45rem",
        boxShadow: isStuck
          ? "0 12px 36px -4px rgba(79, 70, 229, 0.12), 0 4px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)"
          : "0 4px 20px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
        transition: "background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
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
                border: isActive
                  ? "1px solid rgba(99, 102, 241, 0.25)"
                  : "1px solid transparent",
                background: isActive
                  ? "rgba(99, 102, 241, 0.12)"
                  : "transparent",
                color: isActive ? "#4f46e5" : "#64748b",
                fontSize: "0.74rem",
                fontWeight: isActive ? 700 : 500,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
                whiteSpace: "nowrap",
                flexShrink: 0,
                scrollSnapAlign: "center",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(99, 102, 241, 0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#334155";
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
      </div>
    </div>
  );
}
