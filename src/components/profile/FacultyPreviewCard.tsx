"use client";

import React from "react";
import {
  Sparkles,
  Briefcase,
  Award,
  Globe,
  ExternalLink,
  Calendar,
} from "lucide-react";
import type { AcademicStats, ActivityItem, HonorAwardItem, LanguageItem, SocialLinks } from "@/lib/neon/profiles";

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

interface FacultyPreviewCardProps {
  displayName: string;
  lastName: string;
  avatarUrl?: string | null;
  institution: string;
  educationLevel: string;
  major: string;
  graduationYear: string;
  bio: string;
  interests: string[];
  academicStats: AcademicStats;
  activities: ActivityItem[];
  honors: HonorAwardItem[];
  skills: string[];
  languages: LanguageItem[];
  socialLinks: SocialLinks;
}

export function FacultyPreviewCard({
  displayName,
  lastName,
  avatarUrl,
  institution,
  educationLevel,
  major,
  graduationYear,
  bio,
  interests,
  academicStats,
  activities,
  honors,
  skills,
  languages,
  socialLinks,
}: FacultyPreviewCardProps) {
  const initials = `${displayName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "S";

  const hasStats = Boolean(
    academicStats.unweighted_gpa ||
    academicStats.weighted_gpa ||
    academicStats.standardized_test_score ||
    (academicStats.class_rank && academicStats.class_size)
  );

  const formatLevel = (lvl: string) => {
    return lvl
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "2.25rem",
        border: "1px solid rgba(99, 102, 241, 0.2)",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent)", fontSize: "0.85rem", fontWeight: 800 }}>
          <Sparkles size={18} /> Faculty Candidate Dossier Preview
        </div>
        <span style={{ fontSize: "0.74rem", color: "var(--text-tertiary)" }}>
          This is exactly how evaluating faculty and labs view your profile
        </span>
      </div>

      {/* Header Profile Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div
          style={{
            width: "4.5rem",
            height: "4.5rem",
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.1)",
            border: "2px solid rgba(99, 102, 241, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            fontWeight: 800,
            color: "var(--accent)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              {displayName} {lastName}
            </h3>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "0.2rem 0.65rem",
                borderRadius: "100px",
                background: "rgba(99, 102, 241, 0.1)",
                color: "var(--accent)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
              }}
            >
              {formatLevel(educationLevel || "Student Scholar")}
            </span>
          </div>

          <div style={{ fontSize: "0.92rem", color: "#334155", fontWeight: 600 }}>
            {major || "General Academic Track"} {institution ? `· ${institution}` : ""}
          </div>

          <div style={{ fontSize: "0.76rem", color: "var(--text-tertiary)" }}>
            {graduationYear ? `Expected Graduation: Class of ${graduationYear}` : "Graduation Year Pending"}
          </div>
        </div>
      </div>

      {/* Optional Academic Stats Ribbon */}
      {hasStats && (
        <div
          style={{
            background: "rgba(248, 250, 252, 0.9)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            padding: "0.85rem 1.25rem",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.25rem",
          }}
        >
          {academicStats.unweighted_gpa !== undefined && academicStats.unweighted_gpa !== null && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Unweighted GPA</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>{Number(academicStats.unweighted_gpa).toFixed(2)} / 4.0</span>
            </div>
          )}

          {academicStats.weighted_gpa !== undefined && academicStats.weighted_gpa !== null && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Weighted GPA</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>{Number(academicStats.weighted_gpa).toFixed(2)}</span>
            </div>
          )}

          {academicStats.class_rank && academicStats.class_size && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Class Rank</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>{academicStats.class_rank} / {academicStats.class_size}</span>
            </div>
          )}

          {academicStats.standardized_test_type && academicStats.standardized_test_score && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>{academicStats.standardized_test_type}</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>{academicStats.standardized_test_score}</span>
            </div>
          )}
        </div>
      )}

      {/* Research Statement & Bio */}
      {bio && (
        <div style={{ background: "rgba(99, 102, 241, 0.04)", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.15)", padding: "1.25rem 1.5rem" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: "0.4rem", letterSpacing: "0.04em" }}>
            Research Pitch & Motivation
          </span>
          <p style={{ fontSize: "0.92rem", color: "#1e293b", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
            &ldquo;{bio}&rdquo;
          </p>
        </div>
      )}

      {/* Target Academic Interests */}
      {interests.length > 0 && (
        <div>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
            Primary Academic Interests
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {interests.map((topic, idx) => (
              <span
                key={idx}
                style={{
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  color: "var(--accent)",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "100px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Coursework */}
      {academicStats.advanced_coursework && academicStats.advanced_coursework.length > 0 && (
        <div>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
            Advanced Coursework
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {academicStats.advanced_coursework.map((course, idx) => (
              <span
                key={idx}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid var(--border)",
                  color: "#334155",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "6px",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                }}
              >
                {course}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Activities & Experience */}
      {activities.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.75rem" }}>
            <Briefcase size={16} color="#4f46e5" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Experience & Key Activities
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activities.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {item.title}
                    </span>
                    {item.organization && (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                        · {item.organization}
                      </span>
                    )}
                  </div>
                  {item.category && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.55rem",
                        borderRadius: "100px",
                        background: "rgba(99, 102, 241, 0.1)",
                        color: "var(--accent)",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                      }}
                    >
                      {item.category}
                    </span>
                  )}
                </div>

                {(item.date_range || item.dateRange) && (
                  <span style={{ fontSize: "0.74rem", color: "var(--text-tertiary)" }}>
                    {item.date_range || item.dateRange}
                  </span>
                )}

                {item.description && (
                  <p style={{ fontSize: "0.84rem", color: "#334155", margin: "0.2rem 0 0 0", lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honors & Awards */}
      {honors.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.75rem" }}>
            <Award size={16} color="#d97706" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Honors & Distinctions
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {honors.map((item) => {
              const level = item.issuer_or_level || item.issuer;
              return (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {item.title}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {level && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "100px",
                          background: "rgba(245, 158, 11, 0.1)",
                          color: "#d97706",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                        }}
                      >
                        {level}
                      </span>
                    )}
                    {item.year && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                        {item.year}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical Skills & Spoken Languages */}
      {(skills.length > 0 || languages.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {skills.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
                Technical Skills & Tools
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      color: "#059669",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "6px",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
                Spoken Languages
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {languages.map((l, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid var(--border)",
                      color: "#334155",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "6px",
                      fontSize: "0.76rem",
                    }}
                  >
                    <strong>{l.language}</strong> ({l.proficiency})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Online Links */}
      {(() => {
        const gh = socialLinks.github_url || socialLinks.github;
        const li = socialLinks.linkedin_url || socialLinks.linkedin;
        const pf = socialLinks.portfolio_url || socialLinks.portfolio;
        if (!gh && !li && !pf) return null;

        return (
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", display: "block", marginBottom: "0.65rem", letterSpacing: "0.04em" }}>
              Online Portfolios & Profiles
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {gh && (
                <a
                  href={gh.startsWith("http") ? gh : `https://${gh}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "#334155",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    border: "1px solid var(--border)",
                  }}
                >
                  <GithubIcon size={14} /> GitHub Profile <ExternalLink size={12} color="#94a3b8" />
                </a>
              )}

              {li && (
                <a
                  href={li.startsWith("http") ? li : `https://${li}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "#0a66c2",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "8px",
                    background: "rgba(10, 102, 194, 0.08)",
                    border: "1px solid rgba(10, 102, 194, 0.2)",
                  }}
                >
                  <LinkedinIcon size={14} /> LinkedIn <ExternalLink size={12} color="#0a66c2" />
                </a>
              )}

              {pf && (
                <a
                  href={pf.startsWith("http") ? pf : `https://${pf}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "var(--accent)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "8px",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <Globe size={14} /> Portfolio Site <ExternalLink size={12} color="#4f46e5" />
                </a>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
