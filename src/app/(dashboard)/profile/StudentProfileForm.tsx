"use client";

import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AiProfileReviewerCard } from "@/components/features/AiProfileReviewerCard";
import { AcademicIdentityCard } from "@/components/profile/AcademicIdentityCard";
import { ResearchPitchCard } from "@/components/profile/ResearchPitchCard";
import { ActivitiesListBuilder } from "@/components/profile/ActivitiesListBuilder";
import { HonorsAwardsBuilder } from "@/components/profile/HonorsAwardsBuilder";
import { SkillsAndLinksCard } from "@/components/profile/SkillsAndLinksCard";
import { FacultyPreviewCard } from "@/components/profile/FacultyPreviewCard";
import type {
  AcademicStats,
  ActivityItem,
  HonorAwardItem,
  LanguageItem,
  SocialLinks,
} from "@/lib/neon/profiles";

interface Props {
  profile: any;
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
    if (Array.isArray(profile?.academic_interests)) {
      return profile.academic_interests;
    }
    if (typeof profile?.academic_interests === "string") {
      return profile.academic_interests.split(",").map((s: string) => s.trim()).filter(Boolean);
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
    if (Array.isArray(profile?.skills_and_tools)) {
      return profile.skills_and_tools;
    }
    if (typeof profile?.skills_and_tools === "string") {
      return profile.skills_and_tools.split(",").map((s: string) => s.trim()).filter(Boolean);
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

  const levelConfig = getEducationLevelConfig(educationLevel);

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
          profileData={{
            ...profile,
            first_name: firstName,
            last_name: lastName,
            bio,
            academic_interests: interests,
            activities,
            honors_awards: honors,
            academic_stats: academicStats,
            education_level: educationLevel,
          }}
        />
      </div>

      {activeTab === "edit" ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Card: Personal Details */}
          <div
            style={{
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

          {/* Section 2: Research Pitch & Interests */}
          <ResearchPitchCard
            bio={bio}
            onBioChange={setBio}
            interests={interests}
            onInterestsChange={setInterests}
          />

          {/* Section 3: Activities & Experience */}
          <ActivitiesListBuilder
            activities={activities}
            onActivitiesChange={setActivities}
          />

          {/* Section 4: Honors & Awards */}
          <HonorsAwardsBuilder
            honors={honors}
            onHonorsChange={setHonors}
          />

          {/* Section 5: Skills, Spoken Languages & Links */}
          <SkillsAndLinksCard
            skills={skills}
            onSkillsChange={setSkills}
            languages={languages}
            onLanguagesChange={setLanguages}
            socialLinks={socialLinks}
            onSocialLinksChange={setSocialLinks}
          />

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
    </div>
  );
}
