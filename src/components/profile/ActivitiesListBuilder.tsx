"use client";

import React, { useState } from "react";
import { Briefcase, Plus, Trash2, Edit2, Check, X, Calendar, Layers } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { ActivityItem } from "@/lib/neon/profiles";

interface ActivitiesListBuilderProps {
  activities: ActivityItem[];
  onActivitiesChange: (activities: ActivityItem[]) => void;
}

const CATEGORY_OPTIONS = [
  "Research",
  "Software / Engineering Project",
  "Competition Team",
  "School Club / Leadership",
  "Fine Arts / Athletics",
  "Work / Volunteer",
  "Other",
] as const;

export function ActivitiesListBuilder({
  activities,
  onActivitiesChange,
}: ActivitiesListBuilderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for current add/edit
  const [formTitle, setFormTitle] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formCategory, setFormCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [formDateRange, setFormDateRange] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const resetForm = () => {
    setFormTitle("");
    setFormOrg("");
    setFormCategory(CATEGORY_OPTIONS[0]);
    setFormDateRange("");
    setFormDescription("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (item: ActivityItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormOrg(item.organization);
    setFormCategory(item.category || CATEGORY_OPTIONS[0]);
    setFormDateRange(item.date_range || "");
    setFormDescription(item.description || "");
    setIsAdding(false);
  };

  const handleSaveItem = () => {
    if (!formTitle.trim() && !formOrg.trim()) return;

    if (editingId) {
      // Update existing item
      const updated = activities.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            title: formTitle.trim() || "Untitled Activity",
            organization: formOrg.trim(),
            category: formCategory as ActivityItem["category"],
            date_range: formDateRange.trim(),
            description: formDescription.trim(),
          };
        }
        return item;
      });
      onActivitiesChange(updated);
    } else {
      // Add new item
      const newItem: ActivityItem = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle.trim() || "Untitled Activity",
        organization: formOrg.trim(),
        category: formCategory as ActivityItem["category"],
        date_range: formDateRange.trim(),
        description: formDescription.trim(),
      };
      onActivitiesChange([...activities, newItem]);
    }

    resetForm();
  };

  const handleDeleteItem = (idToDelete: string) => {
    onActivitiesChange(activities.filter((item) => item.id !== idToDelete));
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "Research":
        return { bg: "rgba(99, 102, 241, 0.1)", text: "#4f46e5", border: "rgba(99, 102, 241, 0.3)" };
      case "Software / Engineering Project":
        return { bg: "rgba(14, 165, 233, 0.1)", text: "#0284c7", border: "rgba(14, 165, 233, 0.3)" };
      case "Competition Team":
        return { bg: "rgba(245, 158, 11, 0.1)", text: "#d97706", border: "rgba(245, 158, 11, 0.3)" };
      case "School Club / Leadership":
        return { bg: "rgba(16, 185, 129, 0.1)", text: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "Fine Arts / Athletics":
        return { bg: "rgba(236, 72, 153, 0.1)", text: "#db2777", border: "rgba(236, 72, 153, 0.3)" };
      case "Work / Volunteer":
        return { bg: "rgba(139, 92, 246, 0.1)", text: "#7c3aed", border: "rgba(139, 92, 246, 0.3)" };
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
              color: "#4f46e5",
            }}
          >
            <Briefcase size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Activities & Experience
            </h3>
            <p style={{ fontSize: "0.76rem", color: "#64748b", margin: 0 }}>
              Research, technical projects, teams, and leadership roles
            </p>
          </div>
        </div>

        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={handleStartAdd}
            style={{
              background: "#4f46e5",
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
            <Plus size={15} /> Add Activity
          </button>
        )}
      </div>

      {/* Activity Item List */}
      {activities.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {activities.map((item) => {
            const isItemEditing = editingId === item.id;
            const badgeStyle = getCategoryColor(item.category);

            if (isItemEditing) {
              return (
                <div
                  key={item.id}
                  style={{
                    background: "#f8fafc",
                    border: "1.5px solid #4f46e5",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase" }}>
                      Edit Activity
                    </span>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Title / Role</label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Lead Developer"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Organization / Context</label>
                      <input
                        type="text"
                        value={formOrg}
                        onChange={(e) => setFormOrg(e.target.value)}
                        placeholder="e.g. Robotics Club"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Category</label>
                      <Select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Date Range</label>
                      <input
                        type="text"
                        value={formDateRange}
                        onChange={(e) => setFormDateRange(e.target.value)}
                        placeholder="e.g. Sep 2024 - Present"
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Description / Key Highlight (Optional)</label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Designed autonomous navigation algorithms; qualified for state finals"
                      style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{ background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", padding: "0.45rem 0.85rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveItem}
                      style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "0.45rem 0.95rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <Check size={14} /> Update Activity
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
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1rem",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                      {item.title}
                    </span>
                    {item.organization && (
                      <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                        · {item.organization}
                      </span>
                    )}
                    {item.category && (
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
                        {item.category}
                      </span>
                    )}
                  </div>

                  {item.date_range && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.74rem", color: "#64748b" }}>
                      <Calendar size={12} />
                      <span>{item.date_range}</span>
                    </div>
                  )}

                  {item.description && (
                    <p style={{ fontSize: "0.82rem", color: "#334155", margin: "0.25rem 0 0 0", lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    style={{ background: "none", border: "none", color: "#64748b", padding: "0.3rem", borderRadius: "6px", cursor: "pointer" }}
                    title="Edit activity"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    style={{ background: "none", border: "none", color: "#94a3b8", padding: "0.3rem", borderRadius: "6px", cursor: "pointer" }}
                    title="Delete activity"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Add Activity Form */}
      {isAdding && (
        <div
          style={{
            background: "#f8fafc",
            border: "1.5px dashed #4f46e5",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase" }}>
              New Activity Details
            </span>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Title / Role</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Lead Developer or Independent Researcher"
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Organization / Context</label>
              <input
                type="text"
                value={formOrg}
                onChange={(e) => setFormOrg(e.target.value)}
                placeholder="e.g. Robotics Club or Local University Lab"
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Category</label>
              <Select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Date Range</label>
              <input
                type="text"
                value={formDateRange}
                onChange={(e) => setFormDateRange(e.target.value)}
                placeholder="e.g. Sep 2024 - Present"
                style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.25rem" }}>Description / Key Highlight (Optional)</label>
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Designed and trained convolutional neural nets to detect plant leaf diseases"
              style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", background: "#fff" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", padding: "0.45rem 0.85rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveItem}
              style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: "6px", padding: "0.45rem 0.95rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <Plus size={14} /> Add to Profile
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {activities.length === 0 && !isAdding && (
        <div
          style={{
            border: "1px dashed #cbd5e1",
            borderRadius: "12px",
            padding: "1.75rem 1rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Layers size={28} color="#94a3b8" />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>
            No activities or experience listed yet
          </span>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, maxWidth: "340px" }}>
            Add science fairs, coding projects, club leadership, sports, or volunteer initiatives.
          </p>
          <button
            type="button"
            onClick={handleStartAdd}
            style={{
              marginTop: "0.5rem",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              color: "#4f46e5",
              borderRadius: "8px",
              padding: "0.45rem 0.85rem",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Add Your First Activity
          </button>
        </div>
      )}
    </div>
  );
}
