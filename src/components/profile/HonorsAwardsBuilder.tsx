"use client";

import React, { useState } from "react";
import { Award, Plus, Trash2, Edit2, Check, X, Calendar } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { HonorAwardItem } from "@/lib/neon/profiles";

interface HonorsAwardsBuilderProps {
  honors: HonorAwardItem[];
  onHonorsChange: (honors: HonorAwardItem[]) => void;
}

const LEVEL_OPTIONS = [
  "School",
  "Regional",
  "State",
  "National",
  "International",
  "Other",
] as const;

export function HonorsAwardsBuilder({
  honors,
  onHonorsChange,
}: HonorsAwardsBuilderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formLevel, setFormLevel] = useState<string>(LEVEL_OPTIONS[2]); // Default State
  const [formYear, setFormYear] = useState("");

  const resetForm = () => {
    setFormTitle("");
    setFormLevel(LEVEL_OPTIONS[2]);
    setFormYear("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (item: HonorAwardItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormLevel(item.issuer_or_level || LEVEL_OPTIONS[2]);
    setFormYear(item.year || "");
    setIsAdding(false);
  };

  const handleSaveItem = () => {
    if (!formTitle.trim()) return;

    if (editingId) {
      const updated = honors.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            title: formTitle.trim(),
            issuer_or_level: formLevel.trim(),
            year: formYear.trim(),
          };
        }
        return item;
      });
      onHonorsChange(updated);
    } else {
      const newItem: HonorAwardItem = {
        id: `hon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle.trim(),
        issuer_or_level: formLevel.trim(),
        year: formYear.trim(),
      };
      onHonorsChange([...honors, newItem]);
    }

    resetForm();
  };

  const handleDeleteItem = (idToDelete: string) => {
    onHonorsChange(honors.filter((item) => item.id !== idToDelete));
  };

  const getLevelBadgeStyle = (level?: string) => {
    switch (level) {
      case "International":
        return { bg: "rgba(239, 68, 68, 0.1)", text: "#dc2626", border: "rgba(239, 68, 68, 0.3)" };
      case "National":
        return { bg: "rgba(147, 51, 234, 0.1)", text: "#9333ea", border: "rgba(147, 51, 234, 0.3)" };
      case "State":
        return { bg: "rgba(245, 158, 11, 0.1)", text: "#d97706", border: "rgba(245, 158, 11, 0.3)" };
      case "Regional":
        return { bg: "rgba(14, 165, 233, 0.1)", text: "#0284c7", border: "rgba(14, 165, 233, 0.3)" };
      case "School":
        return { bg: "rgba(16, 185, 129, 0.1)", text: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      default:
        return { bg: "rgba(100, 116, 139, 0.1)", text: "#475569", border: "rgba(100, 116, 139, 0.3)" };
    }
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
        gap: "1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
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
            <Award size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Honors & Awards
            </h3>
            <p style={{ fontSize: "0.76rem", color: "var(--text-tertiary)", margin: 0 }}>
              Academic competitions, science fair prizes, and recognitions
            </p>
          </div>
        </div>

        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={handleStartAdd}
            style={{
              background: "var(--accent)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 0.9rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.15s ease",
            }}
          >
            <Plus size={15} /> Add Honor / Award
          </button>
        )}
      </div>

      {/* Honors List */}
      {honors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {honors.map((item) => {
            const isItemEditing = editingId === item.id;
            const badgeStyle = getLevelBadgeStyle(item.issuer_or_level);

            if (isItemEditing) {
              return (
                <div
                  key={item.id}
                  style={{
                    background: "#f8fafc",
                    border: "1.5px solid var(--accent)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>
                      Edit Award
                    </span>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Title / Honor</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. 1st Place - State Science Fair"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-hover)", fontSize: "0.85rem", background: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Level / Issuer</label>
                      <Select
                        value={formLevel}
                        onChange={(e) => setFormLevel(e.target.value)}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-hover)", fontSize: "0.85rem", background: "#fff" }}
                      >
                        {LEVEL_OPTIONS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Year Conferred</label>
                      <input
                        type="text"
                        value={formYear}
                        onChange={(e) => setFormYear(e.target.value)}
                        placeholder="e.g. 2025"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-hover)", fontSize: "0.85rem", background: "#fff" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{ background: "#e2e8f0", color: "var(--text-secondary)", border: "none", borderRadius: "6px", padding: "0.45rem 0.85rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveItem}
                      style={{ background: "var(--accent)", color: "#ffffff", border: "none", borderRadius: "6px", padding: "0.45rem 0.95rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <Check size={14} /> Update Award
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "0.9rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: 1 }}>
                  <Award size={16} color="#d97706" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {item.title}
                  </span>
                  {item.issuer_or_level && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.55rem",
                        borderRadius: "100px",
                        background: badgeStyle.bg,
                        color: badgeStyle.text,
                        border: `1px solid ${badgeStyle.border}`,
                      }}
                    >
                      {item.issuer_or_level}
                    </span>
                  )}
                  {item.year && (
                    <span style={{ fontSize: "0.74rem", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Calendar size={11} /> {item.year}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: "0.3rem", borderRadius: "6px", cursor: "pointer" }}
                    title="Edit award"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    style={{ background: "none", border: "none", color: "#94a3b8", padding: "0.3rem", borderRadius: "6px", cursor: "pointer" }}
                    title="Delete award"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Add Form */}
      {isAdding && (
        <div
          style={{
            background: "#f8fafc",
            border: "1.5px dashed var(--accent)",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>
              New Honor or Award
            </span>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Title / Honor</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. 1st Place - State Science Fair"
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-hover)", fontSize: "0.85rem", background: "#fff" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Level / Issuer</label>
              <Select
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-hover)", fontSize: "0.85rem", background: "#fff" }}
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Year Conferred</label>
              <input
                type="text"
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
                placeholder="e.g. 2025"
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-hover)", fontSize: "0.85rem", background: "#fff" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: "#e2e8f0", color: "var(--text-secondary)", border: "none", borderRadius: "6px", padding: "0.45rem 0.85rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveItem}
              style={{ background: "var(--accent)", color: "#ffffff", border: "none", borderRadius: "6px", padding: "0.45rem 0.95rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <Plus size={14} /> Add Honor
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {honors.length === 0 && !isAdding && (
        <div
          style={{
            border: "1px dashed var(--border-hover)",
            borderRadius: "12px",
            padding: "1.75rem 1rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Award size={28} color="#94a3b8" />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            No honors or awards added yet
          </span>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, maxWidth: "320px" }}>
            Include science olympiad, math competitions, hackathons, or school awards.
          </p>
          <button
            type="button"
            onClick={handleStartAdd}
            style={{
              marginTop: "0.5rem",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              color: "var(--accent)",
              borderRadius: "8px",
              padding: "0.45rem 0.85rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Add an Honor or Award
          </button>
        </div>
      )}
    </div>
  );
}
