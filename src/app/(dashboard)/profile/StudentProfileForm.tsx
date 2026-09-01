"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  GraduationCap,
  Building2,
  BookOpen,
  Globe,
  Code2,
  Award,
  Calendar,
  Save,
  Loader2,
  Eye,
  Edit3,
  Camera,
  User,
  KeyRound,
  LogOut,
  Sliders,
  Sparkles,
  ExternalLink,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AiProfileReviewerCard } from "@/components/features/AiProfileReviewerCard";

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
      schoolPlaceholder: "e.g. Westwood High School, TJHSST, Stuyvesant High",
      majorLabel: "Intended Major / Research Focus",
      majorPlaceholder: "e.g. Computer Science, Bioengineering, Pre-Med",
      gradYearLabel: "High School Graduation Year",
      gradYearPlaceholder: "e.g. 2026, 2027",
      courseworkLabel: "AP / IB / Advanced Coursework",
      courseworkPlaceholder: "e.g. AP Calculus BC, AP Physics C, AP Chemistry, AP Computer Science A",
      extrasLabel: "Science Fairs, Competitions & Clubs",
      extrasPlaceholder: "e.g. Science Fair / ISEF Finalist, USAMO Gold, USACO Plat, MIT PRIMES, Unity Game Dev, Robotics Captain",
      bioPlaceholder: "Tell professors what scientific questions fascinate you, your project ideas, and what you hope to learn through mentorship...",
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
      schoolPlaceholder: "e.g. MIT, Stanford, Harvard, Oxford",
      majorLabel: "Degree Program & Field of Study",
      majorPlaceholder: "e.g. PhD in Machine Learning, Master's in Bioengineering",
      gradYearLabel: "Target Defense / Graduation Year",
      gradYearPlaceholder: "e.g. 2026",
      courseworkLabel: "Advanced Specialized Seminars",
      courseworkPlaceholder: "e.g. Advanced Stochastic Processes, Deep Reinforcement Learning",
      extrasLabel: "Publications, Patents & Fellowships",
      extrasPlaceholder: "e.g. NSF Graduate Fellow, NeurIPS Workshop Paper, Patent Co-inventor",
      bioPlaceholder: "Summarize your dissertation direction, current methodology, and key research questions...",
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
    schoolPlaceholder: "e.g. Stanford University, UC Berkeley, MIT",
    majorLabel: "Undergraduate Major & Minor",
    majorPlaceholder: "e.g. Computer Science (Major), Mathematics (Minor)",
    gradYearLabel: "Expected Graduation Year",
    gradYearPlaceholder: "e.g. 2026, 2027",
    courseworkLabel: "Upper-Division Coursework",
    courseworkPlaceholder: "e.g. Linear Algebra, Real Analysis, Data Structures, Operating Systems",
    extrasLabel: "REU Programs, Projects & Campus Labs",
    extrasPlaceholder: "e.g. Summer REU Scholar, Campus AI Lab Assistant, Hackathon Winner, Unity Project Lead",
    bioPlaceholder: "Highlight your undergraduate research goals, lab experience, and specific areas of faculty interest...",
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

  // Custom Cursor Preference (OFF by default)
  const [customCursor, setCustomCursor] = useState(() => {
    if (typeof window !== "undefined") {
      const isUserToggled = localStorage.getItem("schollective-custom-cursor-user-toggled") === "true";
      if (!isUserToggled) return false;
      return localStorage.getItem("schollective-custom-cursor") === "true";
    }
    return false;
  });

  const handleToggleCursor = () => {
    const newVal = !customCursor;
    setCustomCursor(newVal);
    localStorage.setItem("schollective-custom-cursor-user-toggled", "true");
    localStorage.setItem("schollective-custom-cursor", String(newVal));
    window.dispatchEvent(new Event("storage"));
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  // Form State for Live Preview & Edit
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [preferredName, setPreferredName] = useState(profile?.preferred_name || "");
  const [inst, setInst] = useState(profile?.institution || "");
  const [educationLevel, setEducationLevel] = useState(profile?.education_level || "high-school-senior");
  const [major, setMajor] = useState(profile?.major || "");
  const [gradYear, setGradYear] = useState(profile?.graduation_year || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url || "");
  const [mentorshipType, setMentorshipType] = useState(profile?.seeking_mentorship_type || "");

  const [interests, setInterests] = useState(
    Array.isArray(profile?.academic_interests) ? profile.academic_interests.join(", ") : profile?.academic_interests || ""
  );
  const [extracurriculars, setExtracurriculars] = useState(
    Array.isArray(profile?.extracurriculars) ? profile.extracurriculars.join(", ") : profile?.extracurriculars || ""
  );
  const [coursework, setCoursework] = useState(
    Array.isArray(profile?.coursework) ? profile.coursework.join(", ") : profile?.coursework || ""
  );
  const [skills, setSkills] = useState(
    Array.isArray(profile?.skills_and_tools) ? profile.skills_and_tools.join(", ") : profile?.skills_and_tools || ""
  );

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
      // 1. Get presigned upload URL from Neon storage
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

      // 2. Direct upload to Neon Object Storage
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!s3Res.ok) throw new Error("Storage upload failed");

      // 3. Save avatar URL in Neon profiles table
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

    const interestsArr = interests.split(",").map((s: string) => s.trim()).filter(Boolean);
    const extrasArr = extracurriculars.split(",").map((s: string) => s.trim()).filter(Boolean);
    const courseworkArr = coursework.split(",").map((s: string) => s.trim()).filter(Boolean);
    const skillsArr = skills.split(",").map((s: string) => s.trim()).filter(Boolean);

    const effectiveMentorshipType = mentorshipType || levelConfig.mentorshipOptions[0];

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
      academic_interests: interestsArr,
      extracurriculars: extrasArr,
      coursework: courseworkArr,
      skills_and_tools: skillsArr,
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
    } catch (error: any) {
      console.error("[StudentProfileForm] update error:", error);
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const displayName = preferredName || firstName || "Scholar";
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "S";
  const interestsArray = interests.split(",").map((s: string) => s.trim()).filter(Boolean);
  const extrasArray = extracurriculars.split(",").map((s: string) => s.trim()).filter(Boolean);
  const courseworkArray = coursework.split(",").map((s: string) => s.trim()).filter(Boolean);
  const skillsArray = skills.split(",").map((s: string) => s.trim()).filter(Boolean);

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
            <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "100px", background: "rgba(99, 102, 241, 0.1)", color: "#4f46e5", border: "1px solid rgba(99, 102, 241, 0.25)", flexShrink: 0 }}>
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
        <div data-tour="tour-tab-switcher" style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", background: "rgba(99, 102, 241, 0.08)", padding: "0.3rem", borderRadius: "100px", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
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
      <div data-tour="tour-education-guidance" style={{ background: "rgba(99, 102, 241, 0.06)", borderRadius: "14px", padding: "1rem 1.25rem", border: "1px solid rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.82rem", color: "#334155", lineHeight: 1.5 }}>
        <HelpCircle size={20} color="#4f46e5" style={{ flexShrink: 0 }} />
        <div>{levelConfig.tip}</div>
      </div>

      {/* AI Profile Reviewer Card Embedded directly */}
      <div data-tour="tour-ai-reviewer">
        <AiProfileReviewerCard profileData={{ ...profile, first_name: firstName, last_name: lastName, bio, academic_interests: interests, extracurriculars, education_level: educationLevel }} />
      </div>

      {activeTab === "edit" ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Section: Personal & Account Info */}
          <div style={{ background: "rgba(255, 255, 255, 0.8)", borderRadius: "16px", padding: "1.75rem", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
              <User size={18} color="#4f46e5" />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Personal Information
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder="Jane"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder="Doe"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Preferred Name (Optional)</label>
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

          {/* Section: Academic Standing (Dynamically changes based on level) */}
          <div style={{ background: "rgba(255, 255, 255, 0.8)", borderRadius: "16px", padding: "1.75rem", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
              <GraduationCap size={18} color="#4f46e5" />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Academic Standing & Program
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Education Standing</label>
                <Select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  id="education_level"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                >
                  <option value="high-school-senior">High School Senior (12th Grade)</option>
                  <option value="high-school-junior">High School Junior (11th Grade)</option>
                  <option value="high-school-underclassman">High School (9th/10th Grade)</option>
                  <option value="undergraduate-lower">College Undergraduate (Freshman/Sophomore)</option>
                  <option value="undergraduate-upper">College Undergraduate (Junior/Senior)</option>
                  <option value="graduate">Graduate (Master&apos;s / PhD)</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>{levelConfig.schoolLabel}</label>
                <input
                  type="text"
                  value={inst}
                  onChange={(e) => setInst(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder={levelConfig.schoolPlaceholder}
                  id="institution"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>{levelConfig.majorLabel}</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder={levelConfig.majorPlaceholder}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>{levelConfig.gradYearLabel}</label>
                <input
                  type="text"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder={levelConfig.gradYearPlaceholder}
                />
              </div>
            </div>
          </div>

          {/* Section: Research & Technical Background (Dynamic Placeholders) */}
          <div style={{ background: "rgba(255, 255, 255, 0.8)", borderRadius: "16px", padding: "1.75rem", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
              <BookOpen size={18} color="#4f46e5" />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Research Background & Technical Profile
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Short Bio & Motivation Statement</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  id="bio"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem", resize: "vertical" }}
                  placeholder={levelConfig.bioPlaceholder}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Academic Research Interests (comma-separated)</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  id="academic_interests"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder="e.g. Machine Learning, Computational Biology, Astrophysics, Bioengineering"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>{levelConfig.extrasLabel}</label>
                <input
                  type="text"
                  value={extracurriculars}
                  onChange={(e) => setExtracurriculars(e.target.value)}
                  id="extracurriculars"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder={levelConfig.extrasPlaceholder}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
                <div>
                  <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>{levelConfig.courseworkLabel}</label>
                  <input
                    type="text"
                    value={coursework}
                    onChange={(e) => setCoursework(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                    placeholder={levelConfig.courseworkPlaceholder}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Technical Skills & Tools (comma-separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                    placeholder="e.g. Python, PyTorch, C++, R, LaTeX, CAD, Lab Bench Work"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Links & Mentorship Preferences */}
          <div style={{ background: "rgba(255, 255, 255, 0.8)", borderRadius: "16px", padding: "1.75rem", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
              <Globe size={18} color="#4f46e5" />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Portfolio & Mentorship Preferences
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Portfolio / GitHub / LinkedIn Link</label>
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                  placeholder="https://github.com/username or personal portfolio site"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Seeking Mentorship Type</label>
                <Select
                  value={mentorshipType || levelConfig.mentorshipOptions[0]}
                  onChange={(e) => setMentorshipType(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", outline: "none", fontSize: "0.88rem" }}
                >
                  {levelConfig.mentorshipOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div data-tour="tour-save-button" style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <Button type="submit" disabled={loading} size="lg" icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}>
              {loading ? "Saving Profile…" : "Save Student Profile"}
            </Button>
          </div>
        </form>
      ) : (
        /* Live Faculty View Preview */
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "2rem", border: "1px solid rgba(99, 102, 241, 0.2)", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#4f46e5", fontSize: "0.8rem", fontWeight: 700 }}>
              <Sparkles size={16} /> Faculty Candidate Overview Preview
            </div>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>How professors see your profile when evaluating requests</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 800, color: "#4f46e5", overflow: "hidden" }}>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {displayName} {lastName}
                </h3>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "100px", background: "rgba(99, 102, 241, 0.1)", color: "#4f46e5", border: "1px solid rgba(99, 102, 241, 0.25)" }}>
                  {levelConfig.badge}
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>
                {major || "Student"} {inst ? `· ${inst}` : ""}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {educationLevel ? educationLevel.replace("-", " ") : "High School Senior"} {gradYear ? `· Class of ${gradYear}` : ""}
              </div>
            </div>
          </div>

          {bio && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                Research Statement
              </span>
              <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                &ldquo;{bio}&rdquo;
              </p>
            </div>
          )}

          {interestsArray.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                Academic Interests
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {interestsArray.map((topic: string, idx: number) => (
                  <span key={idx} style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", color: "#4f46e5", padding: "0.3rem 0.75rem", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 700 }}>
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {extrasArray.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                {levelConfig.extrasLabel}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {extrasArray.map((item: string, idx: number) => (
                  <span key={idx} style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#334155", padding: "0.3rem 0.75rem", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {courseworkArray.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                {levelConfig.courseworkLabel}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {courseworkArray.map((c: string, idx: number) => (
                  <span key={idx} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569", padding: "0.25rem 0.65rem", borderRadius: "6px", fontSize: "0.75rem" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skillsArray.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                Technical Skills & Tools
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {skillsArray.map((sk: string, idx: number) => (
                  <span key={idx} style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#059669", padding: "0.25rem 0.65rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {portfolioUrl && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
                Portfolio & Links
              </span>
              <a href={portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#4f46e5", fontWeight: 700, fontSize: "0.85rem", textDecoration: "underline", wordBreak: "break-all", overflowWrap: "break-word", maxWidth: "100%" }}>
                <ExternalLink size={14} style={{ flexShrink: 0 }} /> {portfolioUrl}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
