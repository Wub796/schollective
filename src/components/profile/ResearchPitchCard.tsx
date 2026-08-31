"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Plus, X, Tag } from "lucide-react";

interface ResearchPitchCardProps {
  bio: string;
  onBioChange: (bio: string) => void;
  interests: string[];
  onInterestsChange: (interests: string[]) => void;
}

const POPULAR_INTEREST_SUGGESTIONS = [
  "Artificial Intelligence",
  "Computational Biology",
  "Astrophysics",
  "Robotics & Automation",
  "Quantum Computing",
  "Neuroscience",
  "Renewable Energy",
  "Materials Science",
];

export function ResearchPitchCard({
  bio,
  onBioChange,
  interests,
  onInterestsChange,
}: ResearchPitchCardProps) {
  const [tagInput, setTagInput] = useState("");
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Sync hidden input for external AI Reviewer topic injection
  useEffect(() => {
    const el = hiddenInputRef.current;
    if (!el) return;
    const handleEvent = () => {
      const raw = el.value;
      const parsed = raw.split(",").map((s) => s.trim()).filter(Boolean);
      onInterestsChange(parsed.slice(0, 5));
    };
    el.addEventListener("input", handleEvent);
    el.addEventListener("change", handleEvent);
    return () => {
      el.removeEventListener("input", handleEvent);
      el.removeEventListener("change", handleEvent);
    };
  }, [onInterestsChange]);

  useEffect(() => {
    if (hiddenInputRef.current && hiddenInputRef.current.value !== interests.join(", ")) {
      hiddenInputRef.current.value = interests.join(", ");
    }
  }, [interests]);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (interests.length >= 5) return;
    if (!interests.includes(trimmed)) {
      onInterestsChange([...interests, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onInterestsChange(interests.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const charCount = bio.length;
  const isNearLimit = charCount >= 220;
  const isAtLimit = charCount >= 250;

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
        gap: "1.5rem",
      }}
    >
      {/* Hidden input to receive clicks from AiProfileReviewerCard without breaking its API */}
      <input
        ref={hiddenInputRef}
        id="academic_interests"
        type="hidden"
        value={interests.join(", ")}
        readOnly
      />

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
            color: "var(--accent)",
          }}
        >
          <Sparkles size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Research Bio & Direction
          </h3>
          <p style={{ fontSize: "0.76rem", color: "var(--text-tertiary)", margin: 0 }}>
            Elevator pitch and primary research topics
          </p>
        </div>
      </div>

      {/* Short Bio / Academic Pitch */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <label
            htmlFor="bio"
            style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            Academic Pitch & Motivation
          </label>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: isAtLimit ? "#ef4444" : isNearLimit ? "#f59e0b" : "#94a3b8",
            }}
          >
            {charCount} / 250
          </span>
        </div>

        <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", margin: "0 0 0.5rem 0", lineHeight: 1.4 }}>
          What specific questions or technical problems excite you most?
        </p>

        <textarea
          id="bio"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          maxLength={250}
          rows={3}
          placeholder="e.g. Fascinated by reinforcement learning and neural network interpretability; currently exploring sparse autoencoders to uncover latent feature circuits."
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            outline: "none",
            fontSize: "0.88rem",
            resize: "vertical",
            lineHeight: 1.5,
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Academic Interests (Max 5 Pills) */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <label
            style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            Target Academic Interests
          </label>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: interests.length >= 5 ? "var(--accent)" : "var(--text-tertiary)" }}>
            {interests.length} / 5 max
          </span>
        </div>

        {/* Input row */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.65rem" }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={interests.length >= 5}
            placeholder={interests.length >= 5 ? "Maximum of 5 topics reached" : "Type a research area and press Enter (e.g. Genomics)"}
            style={{
              flex: 1,
              padding: "0.65rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              outline: "none",
              fontSize: "0.85rem",
              background: interests.length >= 5 ? "#f8fafc" : "#ffffff",
            }}
          />
          <button
            type="button"
            disabled={interests.length >= 5 || !tagInput.trim()}
            onClick={() => handleAddTag(tagInput)}
            style={{
              background: interests.length >= 5 || !tagInput.trim() ? "#e2e8f0" : "var(--accent)",
              color: interests.length >= 5 || !tagInput.trim() ? "#94a3b8" : "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.65rem 1rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: interests.length >= 5 || !tagInput.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Active Interest Pills */}
        {interests.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "0.65rem" }}>
            {interests.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "100px",
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "var(--accent)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                <Tag size={12} />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--accent)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Remove tag"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Popular suggestions */}
        {interests.length < 5 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Suggestions:</span>
            {POPULAR_INTEREST_SUGGESTIONS.filter((s) => !interests.includes(s))
              .slice(0, 5)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddTag(s)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border)",
                    borderRadius: "100px",
                    padding: "0.2rem 0.6rem",
                    fontSize: "0.68rem",
                    color: "var(--text-tertiary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  + {s}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
