"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Eye,
  Edit3,
  Camera,
  User,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AiProfileReviewerCard } from "@/components/features/AiProfileReviewerCard";
import { ResumeDropzone } from "@/components/features/ResumeDropzone";
import { AcademicIdentityCard } from "@/components/profile/AcademicIdentityCard";
import { ResearchPitchCard } from "@/components/profile/ResearchPitchCard";
import { ActivitiesListBuilder } from "@/components/profile/ActivitiesListBuilder";
import { HonorsAwardsBuilder } from "@/components/profile/HonorsAwardsBuilder";
import { SkillsAndLinksCard } from "@/components/profile/SkillsAndLinksCard";
import { FacultyPreviewCard } from "@/components/profile/FacultyPreviewCard";
import { ProfileSectionNav } from "@/components/profile/ProfileSectionNav";
import type { ParsedResumeProfile } from "@/lib/ai/resume-parser";
import {
  ProfileRecord,
  AcademicStats,
  ActivityItem,
  HonorAwardItem,
  LanguageItem,
  SocialLinks,
} from "@/lib/neon/profiles";

interface Props {
  profile: ProfileRecord | null | undefined;
}

export function getEducationLevelConfig(level: string) {
  const isHighSchool = (level || "").includes("high-school");
  const isUndergrad = (level || "").includes("undergraduate") || (level || "").includes("college");
  const isGraduate = !isUndergrad && !isHighSchool && (
    (level || "").includes("graduate") ||
    (level || "").includes("doctoral") ||
    (level || "").includes("postdoctoral")
  );

  if (isHighSchool) {
    return {
      category: "high_school",
      badge: "🎓 High School Scholar",
      schoolLabel: "High School Name",
      majorLabel: "Intended Major / Research Focus",
      gradYearLabel: "High School Graduation Year",
      mentorshipOptions: [
        "High School Summer Research & Science Fair Mentorship",
        "College Prep & Science Portfolio Guidance",
        "High School Capstone Project Mentorship",
        "Remote Independent Study",
        "Year-round Mentorship",
      ],
      tip: "💡 High Schooler Guidance: Professors love seeing self-taught coding projects, AP/IB science rigor, science fair initiatives, and genuine curiosity!",
    };
  }

  if (isGraduate) {
    return {
      category: "graduate",
      badge: "🔬 Graduate / Doctoral Scholar",
      schoolLabel: "Graduate Institution / Research Institute",
      majorLabel: "Degree Program & Field of Study",
      gradYearLabel: "Target Defense / Graduation Year",
      mentorshipOptions: [
        "Collaborative Research & Co-Authorship",
        "Dissertation Methodology Guidance",
        "Grant Proposal & Fellowship Review",
        "Postdoctoral Career Advisory",
      ],
      tip: "💡 Graduate Researcher Guidance: Focus on methodology synergy, dataset availability, and potential publication collaboration.",
    };
  }

  // Default: College / Undergraduate
  return {
    category: "college",
    badge: "🏛️ Undergraduate Scholar",
    schoolLabel: "University / College Name",
    majorLabel: "Undergraduate Major & Minor",
    gradYearLabel: "Expected Graduation Year",
    mentorshipOptions: [
      "Undergraduate REU & Lab Assistant Mentorship",
      "Senior Thesis & Capstone Guidance",
      "Summer Research Internship",
      "Graduate School Application Prep",
    ],
    tip: "💡 Undergrad Guidance: Highlight relevant lab techniques, programming languages, and upper-division math/science classes!",
  };
}

export function StudentProfileForm({ profile: initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Personal Information
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [preferredName, setPreferredName] = useState(profile?.preferred_name || "");

  // Section 1: Academic Identity
  const [inst, setInst] = useState(profile?.institution || "");
  const [educationLevel, setEducationLevel] = useState(profile?.education_level || "high-school-senior");
  const [major, setMajor] = useState(profile?.major || "");
  const [gradYear, setGradYear] = useState(profile?.graduation_year || "");
  const [academicStats, setAcademicStats] = useState<AcademicStats>(() => {
    if (profile?.academic_stats && typeof profile.academic_stats === "object") {
      return profile.academic_stats;
    }
    // Backward compatibility: seed from legacy coursework array if available
    const legacyCoursework = Array.isArray(profile?.coursework) ? profile.coursework : [];
    return {
      advanced_coursework: legacyCoursework,
    };
  });

  // Section 2: Research Pitch & Interests
  const [bio, setBio] = useState(profile?.bio || "");
  const [interests, setInterests] = useState<string[]>(() => {
    const raw = profile?.academic_interests as unknown;
    if (Array.isArray(raw)) {
      return raw.filter((s): s is string => typeof s === "string");
    }
    if (typeof raw === "string") {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  });

  // Section 3: Activities & Experience
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    if (Array.isArray(profile?.activities) && profile.activities.length > 0) {
      return profile.activities;
    }
    // Backward compatibility: convert string extracurriculars to basic ActivityItems
    if (Array.isArray(profile?.extracurriculars) && profile.extracurriculars.length > 0) {
      return profile.extracurriculars.map((item: string, idx: number) => ({
        id: `legacy_act_${idx}`,
        title: item,
        organization: "",
        category: "Other",
      }));
    }
    return [];
  });

  // Section 4: Honors & Awards
  const [honors, setHonors] = useState<HonorAwardItem[]>(() => {
    if (Array.isArray(profile?.honors_awards)) {
      return profile.honors_awards;
    }
    return [];
  });

  // Section 5: Skills, Languages & Social Links
  const [skills, setSkills] = useState<string[]>(() => {
    const raw = profile?.skills_and_tools as unknown;
    if (Array.isArray(raw)) {
      return raw.filter((s): s is string => typeof s === "string");
    }
    if (typeof raw === "string") {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  });

  const [languages, setLanguages] = useState<LanguageItem[]>(() => {
    if (Array.isArray(profile?.languages)) {
      return profile.languages;
    }
    return [];
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => {
    if (profile?.social_links && typeof profile.social_links === "object") {
      return profile.social_links;
    }
    return {
      portfolio_url: profile?.portfolio_url || undefined,
    };
  });

  const [mentorshipType, setMentorshipType] = useState(profile?.seeking_mentorship_type || "");
  const [pendingParsedResume, setPendingParsedResume] = useState<ParsedResumeProfile | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);

  useEffect(() => {
    if (!showMergeModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMergeModal(false);
        setPendingParsedResume(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMergeModal]);

  const levelConfig = getEducationLevelConfig(educationLevel);

  const hasSignificantData = Boolean(
    inst.trim() ||
    bio.trim() ||
    activities.length > 0 ||
    honors.length > 0 ||
    skills.length > 0 ||
    (academicStats?.advanced_coursework?.length || 0) > 0 ||
    major.trim()
  );

  const handleAddAcademicInterest = useCallback((tag: string): boolean => {
    const trimmed = tag.trim();
    if (!trimmed) return false;
    let added = false;
    setInterests((prev) => {
      if (prev.includes(trimmed)) return prev;
      if (prev.length >= 5) {
        toast.error("You can select up to 5 academic interests.");
        return prev;
      }
      added = true;
      return [...prev, trimmed];
    });
    return added;
  }, []);

  const reviewerProfileData = useMemo(() => ({
    ...profile,
    first_name: firstName,
    last_name: lastName,
    bio,
    academic_interests: interests,
    activities,
    honors_awards: honors,
    academic_stats: academicStats,
    education_level: educationLevel,
  }), [profile, firstName, lastName, bio, interests, activities, honors, academicStats, educationLevel]);

  const applyResumeData = (data: ParsedResumeProfile, overwrite: boolean = false) => {
    if (overwrite) {
      if (data.first_name) setFirstName(data.first_name);
      if (data.last_name) setLastName(data.last_name);
      if (data.preferred_name) setPreferredName(data.preferred_name);
      if (data.institution) setInst(data.institution);
      if (data.education_level) setEducationLevel(data.education_level);
      if (data.major) setMajor(data.major);
      if (data.graduation_year) setGradYear(data.graduation_year);
      if (data.bio) setBio(data.bio);
      if (data.academic_stats) {
        setAcademicStats({
          unweighted_gpa: data.academic_stats.unweighted_gpa || undefined,
          weighted_gpa: data.academic_stats.weighted_gpa || undefined,
          advanced_coursework: data.academic_stats.advanced_coursework || [],
        });
      }
      if (data.activities && data.activities.length > 0) {
        setActivities(data.activities);
      }
      if (data.honors_awards && data.honors_awards.length > 0) {
        setHonors(data.honors_awards);
      }
      if (data.skills_and_tools && data.skills_and_tools.length > 0) {
        setSkills(data.skills_and_tools);
      }
      if (data.academic_interests && data.academic_interests.length > 0) {
        setInterests(data.academic_interests);
      }
      if (data.languages && data.languages.length > 0) {
        setLanguages(data.languages);
      }
      if (data.social_links) {
        setSocialLinks(data.social_links);
      }
      toast.success("Profile replaced with resume details.");
    } else {
      // Safe non-destructive merge
      if (!firstName.trim() && data.first_name) setFirstName(data.first_name);
      if (!lastName.trim() && data.last_name) setLastName(data.last_name);
      if (!preferredName.trim() && data.preferred_name) setPreferredName(data.preferred_name);
      if (!inst.trim() && data.institution) setInst(data.institution);
      if (!major.trim() && data.major) setMajor(data.major);
      if (!gradYear.trim() && data.graduation_year) setGradYear(data.graduation_year);
      if (!bio.trim() && data.bio) setBio(data.bio);
      if ((!educationLevel || educationLevel === "high-school-senior") && data.education_level && !profile?.education_level) {
        setEducationLevel(data.education_level);
      }

      setAcademicStats((prev) => {
        const existingCourses = prev?.advanced_coursework || [];
        const existingSet = new Set(existingCourses.map((c) => c.toLowerCase().trim()));
        const incoming = (data.academic_stats?.advanced_coursework || []).filter(
          (c) => c.trim() && !existingSet.has(c.toLowerCase().trim())
        );
        return {
          unweighted_gpa: prev?.unweighted_gpa || data.academic_stats?.unweighted_gpa,
          weighted_gpa: prev?.weighted_gpa || data.academic_stats?.weighted_gpa,
          advanced_coursework: [...existingCourses, ...incoming],
        };
      });

      if (data.activities && data.activities.length > 0) {
        setActivities((prev) => {
          const existingTitles = new Set(prev.map((a) => (a.title || "").toLowerCase().trim()).filter(Boolean));
          const incoming = (data.activities || []).filter(
            (a) => a.title && !existingTitles.has((a.title || "").toLowerCase().trim())
          );
          return [...prev, ...incoming];
        });
      }

      if (data.honors_awards && data.honors_awards.length > 0) {
        setHonors((prev) => {
          const existingTitles = new Set(prev.map((h) => (h.title || "").toLowerCase().trim()).filter(Boolean));
          const incoming = (data.honors_awards || []).filter(
            (h) => h.title && !existingTitles.has((h.title || "").toLowerCase().trim())
          );
          return [...prev, ...incoming];
        });
      }

      if (data.skills_and_tools && data.skills_and_tools.length > 0) {
        setSkills((prev) => {
          const existingSet = new Set(prev.map((s) => s.toLowerCase().trim()).filter(Boolean));
          const incoming = (data.skills_and_tools || []).filter(
            (s) => s.trim() && !existingSet.has(s.toLowerCase().trim())
          );
          return [...prev, ...incoming];
        });
      }

      if (data.academic_interests && data.academic_interests.length > 0) {
        setInterests((prev) => {
          const existingSet = new Set(prev.map((i) => i.toLowerCase().trim()).filter(Boolean));
          const incoming = (data.academic_interests || []).filter(
            (i) => i.trim() && !existingSet.has(i.toLowerCase().trim())
          );
          return [...prev, ...incoming];
        });
      }

      if (data.languages && data.languages.length > 0) {
        setLanguages((prev) => {
          const existingSet = new Set(prev.map((l) => (l.language || "").toLowerCase().trim()).filter(Boolean));
          const incoming = (data.languages || []).filter(
            (l) => l.language && !existingSet.has((l.language || "").toLowerCase().trim())
          );
          return [...prev, ...incoming];
        });
      }

      if (data.social_links) {
        setSocialLinks((prev) => ({
          portfolio_url: prev?.portfolio_url || data.social_links?.portfolio_url,
          github_url: prev?.github_url || data.social_links?.github_url,
          linkedin_url: prev?.linkedin_url || data.social_links?.linkedin_url,
        }));
      }

      toast.success("Resume data merged into empty fields & lists!");
    }
  };

  const handleResumeParsed = (parsedData: ParsedResumeProfile) => {
    if (hasSignificantData) {
      setPendingParsedResume(parsedData);
      setShowMergeModal(true);
    } else {
      applyResumeData(parsedData, false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const presignRes = await fetch("/api/storage/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, contentLength: file.size }),
      });

      if (!presignRes.ok) {
        const detail = await presignRes.json().catch(() => null);
        throw new Error(detail?.error || "Failed to generate storage upload URL");
      }
      const { uploadUrl, publicUrl } = await presignRes.json();

      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!s3Res.ok) throw new Error("Storage upload failed");

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      const profileRes = await fetch("/api/auth/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      if (!profileRes.ok) throw new Error("Failed to save profile picture");

      setProfile((p: any) => ({ ...p, avatar_url: avatarUrl }));
      toast.success("Profile picture updated.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Upload failed. Please try again.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const effectiveMentorshipType = mentorshipType || levelConfig.mentorshipOptions[0];

    // Build serialized string lists for backward compatibility
    const legacyExtras = activities.map((a) =>
      a.organization ? `${a.title} (${a.organization})` : a.title
    );
    const legacyCoursework = academicStats.advanced_coursework || [];
    const portfolioUrl = socialLinks.portfolio_url || profile?.portfolio_url || "";

    const updates: Record<string, any> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      preferred_name: preferredName.trim(),
      institution: inst.trim(),
      education_level: educationLevel,
      major: major.trim(),
      graduation_year: gradYear.trim(),
      bio: bio.trim(),
      portfolio_url: portfolioUrl.trim(),
      seeking_mentorship_type: effectiveMentorshipType,
      academic_interests: interests,
      academic_stats: academicStats,
      activities: activities,
      honors_awards: honors,
      skills_and_tools: skills,
      languages: languages,
      social_links: socialLinks,
      // Backward compatibility fields:
      extracurriculars: legacyExtras,
      coursework: legacyCoursework,
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/auth/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update profile");
      }

      toast.success("Profile saved successfully.");
      setProfile((prev: any) => ({ ...prev, ...updates }));
      router.refresh();
    } catch (error: any) {
      console.error("[StudentProfileForm] update error:", error);
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const displayName = preferredName || firstName || "Scholar";
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "S";

  return (
    <div data-tour="tour-profile-editor" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Header Avatar Row */}
      <div data-tour="tour-profile-avatar" style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "5rem",
              height: "5rem",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(99, 102, 241, 0.3)",
              background: "rgba(99, 102, 241, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4f46e5" }}>
                {initials}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "1.8rem",
              height: "1.8rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
            title="Upload avatar"
          >
            {avatarUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              {displayName} {lastName}
            </h2>
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "0.2rem 0.65rem",
                borderRadius: "100px",
                background: "rgba(99, 102, 241, 0.1)",
                color: "#4f46e5",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                flexShrink: 0,
              }}
            >
              {levelConfig.badge}
            </span>
          </div>
          <span style={{ fontSize: "0.85rem", color: "#4f46e5", fontWeight: 600 }}>
            {major ? `${major}` : "Student Scholar"} {inst ? `· ${inst}` : ""}
          </span>
          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
            Graduation: {gradYear ? `Class of ${gradYear}` : "Pending"}
          </span>
        </div>

        {/* Edit vs Live Faculty Preview Tab Switcher */}
        <div
          data-tour="tour-tab-switcher"
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "0.5rem",
            background: "rgba(99, 102, 241, 0.08)",
            padding: "0.3rem",
            borderRadius: "100px",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.9rem",
              borderRadius: "100px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "none",
              background: activeTab === "edit" ? "#4f46e5" : "transparent",
              color: activeTab === "edit" ? "#ffffff" : "#475569",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Edit3 size={13} /> Edit Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.9rem",
              borderRadius: "100px",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "none",
              background: activeTab === "preview" ? "#4f46e5" : "transparent",
              color: activeTab === "preview" ? "#ffffff" : "#475569",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Eye size={13} /> Faculty View Preview
          </button>
        </div>
      </div>

      {/* Dynamic Education Guidance Banner */}
      <div
        data-tour="tour-education-guidance"
        style={{
          background: "rgba(99, 102, 241, 0.06)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.82rem",
          color: "#334155",
          lineHeight: 1.5,
        }}
      >
        <HelpCircle size={20} color="#4f46e5" style={{ flexShrink: 0 }} />
        <div>{levelConfig.tip}</div>
      </div>

      {/* AI Profile Reviewer Card Embedded directly */}
      <div data-tour="tour-ai-reviewer">
        <AiProfileReviewerCard
          profileData={reviewerProfileData}
          onAddAcademicInterest={handleAddAcademicInterest}
        />
      </div>

      {/* Section Jump-Nav Strip — only visible in edit mode */}
      {activeTab === "edit" && <ProfileSectionNav />}

      {activeTab === "edit" ? (
        <form ref={formRef} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Top-anchored Resume Dropzone */}
          <div id="section-resume" style={{ scrollMarginTop: "135px" }}>
            <ResumeDropzone onParsed={handleResumeParsed} disabled={loading} />
          </div>

          {/* Card: Personal Details */}
          <div
            id="section-personal"
            style={{
              scrollMarginTop: "135px",
              background: "rgba(255, 255, 255, 0.9)",
              borderRadius: "16px",
              padding: "1.75rem",
              border: "1px solid rgba(99, 102, 241, 0.15)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1.25rem" }}>
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
                <User size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Personal Information
                </h3>
                <p style={{ fontSize: "0.76rem", color: "#64748b", margin: 0 }}>
                  Your basic identity details and preferred name
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
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
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder="Jane"
                />
              </div>

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
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder="Doe"
                />
              </div>

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
                  Preferred Name (Optional)
                </label>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder="Janey"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Academic Identity */}
          <div id="section-academic" style={{ scrollMarginTop: "135px" }}>
            <AcademicIdentityCard
              institution={inst}
              onInstitutionChange={setInst}
              educationLevel={educationLevel}
              onEducationLevelChange={setEducationLevel}
              major={major}
              onMajorChange={setMajor}
              graduationYear={gradYear}
              onGraduationYearChange={setGradYear}
              academicStats={academicStats}
              onAcademicStatsChange={setAcademicStats}
            />
          </div>

          {/* Section 2: Research Pitch & Interests */}
          <div id="section-pitch" style={{ scrollMarginTop: "135px" }}>
            <ResearchPitchCard
              bio={bio}
              onBioChange={setBio}
              interests={interests}
              onInterestsChange={setInterests}
            />
          </div>

          {/* Section 3: Activities & Experience */}
          <div id="section-activities" style={{ scrollMarginTop: "135px" }}>
            <ActivitiesListBuilder
              activities={activities}
              onActivitiesChange={setActivities}
            />
          </div>

          {/* Section 4: Honors & Awards */}
          <div id="section-honors" style={{ scrollMarginTop: "135px" }}>
            <HonorsAwardsBuilder
              honors={honors}
              onHonorsChange={setHonors}
            />
          </div>

          {/* Section 5: Skills, Spoken Languages & Links */}
          <div id="section-skills" style={{ scrollMarginTop: "135px" }}>
            <SkillsAndLinksCard
              skills={skills}
              onSkillsChange={setSkills}
              languages={languages}
              onLanguagesChange={setLanguages}
              socialLinks={socialLinks}
              onSocialLinksChange={setSocialLinks}
            />
          </div>

          {/* Save Action Bar */}
          <div
            data-tour="tour-save-button"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingTop: "0.5rem",
              position: "sticky",
              bottom: "1.5rem",
              zIndex: 20,
            }}
          >
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              style={{
                boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
              }}
            >
              {loading ? "Saving Profile…" : "Save Student Profile"}
            </Button>
          </div>
        </form>
      ) : (
        /* Live Faculty View Preview Tab */
        <FacultyPreviewCard
          displayName={displayName}
          lastName={lastName}
          avatarUrl={profile?.avatar_url}
          institution={inst}
          educationLevel={educationLevel}
          major={major}
          graduationYear={gradYear}
          bio={bio}
          interests={interests}
          academicStats={academicStats}
          activities={activities}
          honors={honors}
          skills={skills}
          languages={languages}
          socialLinks={socialLinks}
        />
      )}

      {/* Resume Merge Strategy Modal */}
      {showMergeModal && pendingParsedResume && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="merge-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMergeModal(false);
              setPendingParsedResume(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "540px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    borderRadius: "12px",
                    background: "rgba(99, 102, 241, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4f46e5",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 id="merge-modal-title" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                    Resume Parsed Successfully
                  </h3>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                    Choose how to apply extracted information to your existing profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMergeModal(false);
                  setPendingParsedResume(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {/* Option 1: Safe Merge (Default) */}
              <button
                type="button"
                onClick={() => {
                  applyResumeData(pendingParsedResume, false);
                  setShowMergeModal(false);
                  setPendingParsedResume(null);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                  padding: "1.15rem 1.25rem",
                  borderRadius: "14px",
                  border: "2px solid #4f46e5",
                  background: "rgba(99, 102, 241, 0.04)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#4f46e5", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <CheckCircle2 size={16} color="#4f46e5" /> Merge & Fill Empty Fields
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "100px",
                      background: "#4f46e5",
                      color: "#ffffff",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Safe & Recommended
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.4 }}>
                  Preserves your existing personal details and bio. Appends newly discovered activities, honors, coursework, and skills without duplicating.
                </p>
              </button>

              {/* Option 2: Replace All */}
              <button
                type="button"
                onClick={() => {
                  applyResumeData(pendingParsedResume, true);
                  setShowMergeModal(false);
                  setPendingParsedResume(null);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                  padding: "1.15rem 1.25rem",
                  borderRadius: "14px",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  background: "#ffffff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                    Replace All with Resume
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "100px",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#dc2626",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Overwrite
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>
                  Completely resets your profile fields, activities, honors, and coursework to match the contents extracted from this resume.
                </p>
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  setShowMergeModal(false);
                  setPendingParsedResume(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "0.5rem 0.9rem",
                  borderRadius: "8px",
                }}
              >
                Cancel & Keep Unchanged
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
