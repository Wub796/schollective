"use client";

import React, { useState } from "react";
import { GraduationCap, BarChart3, Plus, X } from "lucide-react";
import { InstitutionInput } from "@/components/ui/InstitutionInput";
import { Select } from "@/components/ui/Select";
import type { AcademicStats } from "@/lib/neon/profiles";

interface AcademicIdentityCardProps {
  institution: string;
  onInstitutionChange: (value: string) => void;
  educationLevel: string;
  onEducationLevelChange: (value: string) => void;
  major: string;
  onMajorChange: (value: string) => void;
  graduationYear: string;
  onGraduationYearChange: (value: string) => void;
  academicStats: AcademicStats;
  onAcademicStatsChange: (stats: AcademicStats) => void;
}

const COMMON_COURSE_SUGGESTIONS = [
  "AP Calculus BC",
  "AP Physics C",
  "AP Computer Science A",
  "AP Chemistry",
  "AP Biology",
  "AP Statistics",
  "Multivariable Calculus",
  "Linear Algebra",
  "IB Physics HL",
  "IB Math AA HL",
  "Dual Enrollment Python",
];

export function AcademicIdentityCard({
  institution,
  onInstitutionChange,
  educationLevel,
  onEducationLevelChange,
  major,
  onMajorChange,
  graduationYear,
  onGraduationYearChange,
  academicStats,
  onAcademicStatsChange,
}: AcademicIdentityCardProps) {
  const [courseInput, setCourseInput] = useState("");
  const [statsExpanded, setStatsExpanded] = useState(
    Boolean(
      academicStats.unweighted_gpa ||
      academicStats.weighted_gpa ||
      academicStats.standardized_test_score ||
      (academicStats.advanced_coursework && academicStats.advanced_coursework.length > 0)
    )
  );

  const handleStatChange = <K extends keyof AcademicStats>(key: K, value: AcademicStats[K]) => {
    onAcademicStatsChange({
      ...academicStats,
      [key]: value,
    });
  };

  const handleAddCourse = (course: string) => {
    const trimmed = course.trim();
    if (!trimmed) return;
    const current = academicStats.advanced_coursework || [];
    if (!current.includes(trimmed)) {
      handleStatChange("advanced_coursework", [...current, trimmed]);
    }
    setCourseInput("");
  };

  const handleRemoveCourse = (indexToRemove: number) => {
    const current = academicStats.advanced_coursework || [];
    handleStatChange(
      "advanced_coursework",
      current.filter((_, idx) => idx !== indexToRemove)
    );
  };

  const handleCourseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddCourse(courseInput);
    }
  };

  const courseworkList = academicStats.advanced_coursework || [];

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
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Academic Identity
            </h3>
            <p style={{ fontSize: "0.76rem", color: "#64748b", margin: 0 }}>
              School, standing, and optional academic metrics
            </p>
          </div>
        </div>
      </div>

      {/* Grid: School, Standing, Major, Grad Year */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.25rem" }}>
        {/* Institution */}
        <div>
          <label
            htmlFor="institution"
            style={{ fontSize: "0.68rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", letterSpacing: "0.04em" }}
          >
            Institution / School Name
          </label>
          <InstitutionInput
            id="institution"
            value={institution}
            onChange={onInstitutionChange}
            placeholder="e.g. Westwood High or Stanford"
            inputStyle={{
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              fontSize: "0.88rem",
              border: "1px solid rgba(99, 102, 241, 0.25)",
            }}
          />
        </div>

        {/* Education Standing */}
        <div>
          <label
            htmlFor="education_level"
            style={{ fontSize: "0.68rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", letterSpacing: "0.04em" }}
          >
            Education Standing
          </label>
          <Select
            id="education_level"
            value={educationLevel}
            onChange={(e) => onEducationLevelChange(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
          >
            <option value="high-school-senior">High School Senior (12th Grade)</option>
            <option value="high-school-junior">High School Junior (11th Grade)</option>
            <option value="high-school-underclassman">High School (9th / 10th Grade)</option>
            <option value="undergraduate-lower">Undergraduate (Freshman / Sophomore)</option>
            <option value="undergraduate-upper">Undergraduate (Junior / Senior)</option>
            <option value="graduate">Graduate (Master&apos;s / PhD)</option>
            <option value="postdoc">Postdoctoral / Fellow</option>
            <option value="other">Other</option>
          </Select>
        </div>

        {/* Major / Focus */}
        <div>
          <label
            htmlFor="major"
            style={{ fontSize: "0.68rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", letterSpacing: "0.04em" }}
          >
            Intended Major / Research Focus
          </label>
          <input
            id="major"
            type="text"
            value={major}
            onChange={(e) => onMajorChange(e.target.value)}
            placeholder="e.g. Computer Science, Bioengineering"
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
          />
        </div>

        {/* Expected Grad Year */}
        <div>
          <label
            htmlFor="graduation_year"
            style={{ fontSize: "0.68rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", letterSpacing: "0.04em" }}
          >
            Expected Graduation Year
          </label>
          <input
            id="graduation_year"
            type="text"
            value={graduationYear}
            onChange={(e) => onGraduationYearChange(e.target.value)}
            placeholder="e.g. 2026"
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
          />
        </div>
      </div>

      {/* Optional Academic Stats Accordion / Section */}
      <div
        style={{
          borderTop: "1px dashed rgba(99, 102, 241, 0.2)",
          paddingTop: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <button
          type="button"
          onClick={() => setStatsExpanded(!statsExpanded)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#4f46e5",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            textAlign: "left",
            width: "fit-content",
          }}
        >
          <BarChart3 size={15} />
          <span>{statsExpanded ? "Hide Optional Academic Metrics (GPA, Rank, Testing)" : "+ Add Optional Academic Metrics (GPA, Rank, Testing, AP/IB Coursework)"}</span>
        </button>

        {statsExpanded && (
          <div
            style={{
              background: "rgba(248, 250, 252, 0.8)",
              borderRadius: "12px",
              padding: "1.25rem",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Row 1: GPAs & Class Rank */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              {/* Unweighted GPA */}
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                  Unweighted GPA (4.0 Scale)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={academicStats.unweighted_gpa ?? ""}
                  onChange={(e) => handleStatChange("unweighted_gpa", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g. 3.92"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.85rem", background: "#ffffff" }}
                />
              </div>

              {/* Weighted GPA */}
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                  Weighted GPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="6.0"
                  value={academicStats.weighted_gpa ?? ""}
                  onChange={(e) => handleStatChange("weighted_gpa", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g. 4.38"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.85rem", background: "#ffffff" }}
                />
              </div>

              {/* Class Rank & Size */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                    Class Rank
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.68rem", color: "#64748b", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(academicStats.school_does_not_rank)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onAcademicStatsChange({
                          ...academicStats,
                          school_does_not_rank: checked,
                          class_rank: checked ? null : academicStats.class_rank,
                          class_size: checked ? null : academicStats.class_size,
                        });
                      }}
                      style={{ accentColor: "#4f46e5" }}
                    />
                    Does not rank
                  </label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="number"
                    disabled={Boolean(academicStats.school_does_not_rank)}
                    value={academicStats.class_rank ?? ""}
                    onChange={(e) => handleStatChange("class_rank", e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="Rank (e.g. 8)"
                    style={{
                      width: "50%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      outline: "none",
                      fontSize: "0.85rem",
                      background: academicStats.school_does_not_rank ? "#f1f5f9" : "#ffffff",
                    }}
                  />
                  <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>/</span>
                  <input
                    type="number"
                    disabled={Boolean(academicStats.school_does_not_rank)}
                    value={academicStats.class_size ?? ""}
                    onChange={(e) => handleStatChange("class_size", e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="Class size (e.g. 420)"
                    style={{
                      width: "50%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      outline: "none",
                      fontSize: "0.85rem",
                      background: academicStats.school_does_not_rank ? "#f1f5f9" : "#ffffff",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Standardized Testing */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                  Standardized Test
                </label>
                <Select
                  value={academicStats.standardized_test_type || ""}
                  onChange={(e) => handleStatChange("standardized_test_type", e.target.value || null)}
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.85rem", background: "#ffffff" }}
                >
                  <option value="">None / Test-Optional</option>
                  <option value="SAT">SAT</option>
                  <option value="ACT">ACT</option>
                  <option value="PSAT">PSAT</option>
                </Select>
              </div>

              {academicStats.standardized_test_type && (
                <div>
                  <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                    {academicStats.standardized_test_type} Score
                  </label>
                  <input
                    type="text"
                    value={academicStats.standardized_test_score || ""}
                    onChange={(e) => handleStatChange("standardized_test_score", e.target.value || null)}
                    placeholder={academicStats.standardized_test_type === "ACT" ? "e.g. 35" : "e.g. 1540"}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.85rem", background: "#ffffff" }}
                  />
                </div>
              )}
            </div>

            {/* Row 3: Advanced Coursework Chips */}
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                Advanced Coursework (AP / IB / Dual Enrollment / Honors)
              </label>

              {/* Tag input row */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.65rem" }}>
                <input
                  type="text"
                  value={courseInput}
                  onChange={(e) => setCourseInput(e.target.value)}
                  onKeyDown={handleCourseKeyDown}
                  placeholder="Type course name and press Enter (e.g. AP Calculus BC)"
                  style={{ flex: 1, padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "0.85rem", background: "#ffffff" }}
                />
                <button
                  type="button"
                  onClick={() => handleAddCourse(courseInput)}
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

              {/* Active Course Chips */}
              {courseworkList.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.65rem" }}>
                  {courseworkList.map((course, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.3rem 0.65rem",
                        borderRadius: "100px",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                        color: "#4f46e5",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {course}
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(idx)}
                        style={{ background: "none", border: "none", padding: 0, color: "#4f46e5", cursor: "pointer", display: "flex", alignItems: "center" }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Popular:</span>
                {COMMON_COURSE_SUGGESTIONS.filter((s) => !courseworkList.includes(s)).slice(0, 5).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleAddCourse(s)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "100px",
                      padding: "0.2rem 0.55rem",
                      fontSize: "0.68rem",
                      color: "#64748b",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
