"use client";

import React, { useState } from "react";
import { Code2, Globe, Languages, Plus, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { LanguageItem, SocialLinks } from "@/lib/neon/profiles";

function GithubIcon({ size = 14, color = "#334155" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 14, color = "#0a66c2" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface SkillsAndLinksCardProps {
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
  languages: LanguageItem[];
  onLanguagesChange: (languages: LanguageItem[]) => void;
  socialLinks: SocialLinks;
  onSocialLinksChange: (links: SocialLinks) => void;
}

const COMMON_SKILL_SUGGESTIONS = [
  "Python",
  "C++",
  "PyTorch",
  "React",
  "TypeScript",
  "R",
  "LaTeX",
  "CAD / SolidWorks",
  "Git / GitHub",
  "Linux / Bash",
  "TensorFlow",
  "MATLAB",
];

const PROFICIENCY_OPTIONS = [
  "Native / Bilingual",
  "Professional Working",
  "Limited Working",
  "Elementary",
] as const;

export function SkillsAndLinksCard({
  skills,
  onSkillsChange,
  languages,
  onLanguagesChange,
  socialLinks,
  onSocialLinksChange,
}: SkillsAndLinksCardProps) {
  const [skillInput, setSkillInput] = useState("");
  const [langName, setLangName] = useState("");
  const [langProficiency, setLangProficiency] = useState<string>(PROFICIENCY_OPTIONS[0]);
  const [isAddingLang, setIsAddingLang] = useState(false);

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      onSkillsChange([...skills, trimmed]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (indexToRemove: number) => {
    onSkillsChange(skills.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const handleAddLanguage = () => {
    const trimmed = langName.trim();
    if (!trimmed) return;
    const newItem: LanguageItem = {
      id: `lang_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      language: trimmed,
      proficiency: langProficiency as LanguageItem["proficiency"],
    };
    onLanguagesChange([...languages, newItem]);
    setLangName("");
    setLangProficiency(PROFICIENCY_OPTIONS[0]);
    setIsAddingLang(false);
  };

  const handleRemoveLanguage = (indexToRemove: number) => {
    onLanguagesChange(languages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSocialLinkChange = (key: keyof SocialLinks, value: string) => {
    onSocialLinksChange({
      ...socialLinks,
      [key]: value.trim() || undefined,
    });
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "16px",
        padding: "1.75rem",
        border: "1px solid rgba(99, 102, 241, 0.15)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        <div
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "10px",
            background: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4f46e5",
          }}
        >
          <Code2 size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Skills & External Links
          </h3>
          <p style={{ fontSize: "0.76rem", color: "#64748b", margin: 0 }}>
            Technical proficiencies, spoken languages, and personal profiles
          </p>
        </div>
      </div>

      {/* Sub-section 1: Technical Skills */}
      <div>
        <label
          style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "#475569",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "0.4rem",
            letterSpacing: "0.04em",
          }}
        >
          Technical Skills & Tools
        </label>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.65rem" }}>
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Type skill and press Enter (e.g. Python, PyTorch, CAD)"
            style={{
              flex: 1,
              padding: "0.65rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              outline: "none",
              fontSize: "0.85rem",
              background: "#ffffff",
            }}
          />
          <button
            type="button"
            onClick={() => handleAddSkill(skillInput)}
            style={{
              background: "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.65rem 1rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "0.65rem" }}>
            {skills.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "100px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#059669",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  style={{ background: "none", border: "none", padding: 0, color: "#059669", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Common skill suggestions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Popular:</span>
          {COMMON_SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleAddSkill(s)}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "100px",
                padding: "0.2rem 0.55rem",
                fontSize: "0.68rem",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-section 2: Languages */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
          <label
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              color: "#475569",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              letterSpacing: "0.04em",
            }}
          >
            <Languages size={14} color="#4f46e5" />
            Spoken Languages
          </label>

          {!isAddingLang && (
            <button
              type="button"
              onClick={() => setIsAddingLang(true)}
              style={{
                background: "none",
                border: "none",
                color: "#4f46e5",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Plus size={13} /> Add Language
            </button>
          )}
        </div>

        {languages.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {languages.map((item, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                }}
              >
                <span style={{ fontWeight: 700 }}>{item.language}</span>
                <span style={{ fontSize: "0.72rem", color: "#64748b", background: "#f1f5f9", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                  {item.proficiency}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(idx)}
                  style={{ background: "none", border: "none", padding: 0, color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {isAddingLang && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "0.85rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.65rem",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={langName}
              onChange={(e) => setLangName(e.target.value)}
              placeholder="e.g. Spanish or Mandarin"
              style={{ flex: 1, minWidth: "150px", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
            />
            <Select
              value={langProficiency}
              onChange={(e) => setLangProficiency(e.target.value)}
              style={{ width: "auto", minWidth: "160px", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", background: "#ffffff" }}
            >
              {PROFICIENCY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                type="button"
                onClick={handleAddLanguage}
                style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "0.55rem 0.85rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingLang(false)}
                style={{ background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", padding: "0.55rem 0.75rem", fontSize: "0.78rem", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-section 3: External Profiles & Links */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
        <label
          style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "#475569",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "0.75rem",
            letterSpacing: "0.04em",
          }}
        >
          Online Profiles & Portfolio
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          {/* GitHub */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
              <GithubIcon size={14} color="#334155" />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#334155" }}>GitHub Profile</span>
            </div>
            <input
              type="text"
              value={socialLinks.github_url || socialLinks.github || ""}
              onChange={(e) => handleSocialLinkChange("github_url", e.target.value)}
              placeholder="https://github.com/username"
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.85rem" }}
            />
          </div>

          {/* LinkedIn */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
              <LinkedinIcon size={14} color="#0a66c2" />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#334155" }}>LinkedIn Profile</span>
            </div>
            <input
              type="text"
              value={socialLinks.linkedin_url || socialLinks.linkedin || ""}
              onChange={(e) => handleSocialLinkChange("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/in/username"
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.85rem" }}
            />
          </div>

          {/* Portfolio / Personal Site */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
              <Globe size={14} color="#4f46e5" />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#334155" }}>Portfolio or Personal Website</span>
            </div>
            <input
              type="text"
              value={socialLinks.portfolio_url || ""}
              onChange={(e) => handleSocialLinkChange("portfolio_url", e.target.value)}
              placeholder="https://janedoe.dev"
              style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.85rem" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
