"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProfProfile } from "./actions";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  GraduationCap,
  Building2,
  BookOpen,
  Globe,
  Clock,
  Users,
  FileText,
  CheckCircle2,
  Save,
  Loader2,
  Eye,
  Edit3,
  Camera,
  User,
  KeyRound,
  LogOut,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  profile: any;
}

export function ProfProfileForm({ profile: initialProfile }: Props) {
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
  const [title, setTitle] = useState(profile?.academic_title || "Professor / Principal Investigator");
  const [dept, setDept] = useState(profile?.department || "Academic Department");
  const [inst, setInst] = useState(profile?.institution || "University");
  const [bio, setBio] = useState(profile?.bio || "");
  const [labSite, setLabSite] = useState(profile?.lab_website || "");
  const [officeHrs, setOfficeHrs] = useState(profile?.office_hours || "");
  const [expertise, setExpertise] = useState(
    Array.isArray(profile?.expertise_fields) ? profile.expertise_fields.join(", ") : profile?.expertise_fields || ""
  );
  const [studentTypes, setStudentTypes] = useState(
    Array.isArray(profile?.accepting_student_types) ? profile.accepting_student_types.join(", ") : profile?.accepting_student_types || "Undergraduates, High School, Master's"
  );
  const [publications, setPublications] = useState(
    Array.isArray(profile?.publications) ? profile.publications.join("\n") : profile?.publications || ""
  );
  const [isAccepting, setIsAccepting] = useState<boolean>(profile?.is_accepting_requests !== false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
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
      toast.success("Profile picture updated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Upload failed. Please try again.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("is_accepting_requests", String(isAccepting));
      const res = await updateProfProfile(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile updated successfully!");
        setProfile((prev: any) => ({
          ...prev,
          first_name: firstName,
          last_name: lastName,
          preferred_name: preferredName,
          academic_title: title,
          department: dept,
          institution: inst,
          bio,
          lab_website: labSite,
          office_hours: officeHrs,
          expertise_fields: expertise.split(",").map((s: string) => s.trim()).filter(Boolean),
          accepting_student_types: studentTypes.split(",").map((s: string) => s.trim()).filter(Boolean),
          publications: publications.split("\n").map((s: string) => s.trim()).filter(Boolean),
          is_accepting_requests: isAccepting,
        }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = preferredName || firstName || "Professor";
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "P";
  const expertiseArray = expertise.split(",").map((s: string) => s.trim()).filter(Boolean);
  const studentTypesArray = studentTypes.split(",").map((s: string) => s.trim()).filter(Boolean);
  const publicationsArray = publications.split("\n").map((s: string) => s.trim()).filter(Boolean);

  return (
    <div data-tour="tour-prof-profile-editor" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Header Avatar Row */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "5rem",
              height: "5rem",
              borderRadius: "50%",
              background: "rgba(79, 70, 229, 0.1)",
              border: "2px solid rgba(79, 70, 229, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              fontWeight: 900,
              color: "var(--accent)",
              overflow: "hidden",
            }}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
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
              width: "1.8rem",
              height: "1.8rem",
              borderRadius: "50%",
              background: "var(--accent)",
              border: "2px solid #ffffff",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            }}
            title="Upload profile picture"
          >
            {avatarUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
        </div>

        <div>
          <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text-primary)", margin: "0 0 0.2rem 0" }}>
            Dr. {displayName} {lastName}
          </h2>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            {title} • {inst}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.2rem" }}>{profile?.email}</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div data-tour="tour-prof-tab-switcher" style={{ display: "flex", gap: "0.5rem", background: "rgba(15, 23, 42, 0.04)", borderRadius: "100px", padding: "0.3rem", width: "fit-content" }}>
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          style={{
            background: activeTab === "edit" ? "#ffffff" : "transparent",
            color: activeTab === "edit" ? "var(--accent)" : "var(--text-tertiary)",
            border: activeTab === "edit" ? "1px solid rgba(99, 102, 241, 0.2)" : "none",
            borderRadius: "100px",
            padding: "0.55rem 1.25rem",
            fontSize: "0.82rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            boxShadow: activeTab === "edit" ? "0 2px 8px rgba(0, 0, 0, 0.04)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <Edit3 size={14} /> Edit Profile Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          style={{
            background: activeTab === "preview" ? "#ffffff" : "transparent",
            color: activeTab === "preview" ? "var(--accent)" : "var(--text-tertiary)",
            border: activeTab === "preview" ? "1px solid rgba(99, 102, 241, 0.2)" : "none",
            borderRadius: "100px",
            padding: "0.55rem 1.25rem",
            fontSize: "0.82rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            boxShadow: activeTab === "preview" ? "0 2px 8px rgba(0, 0, 0, 0.04)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <Eye size={14} /> Student View Preview
        </button>
      </div>

      {activeTab === "edit" ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Status Toggle */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(99, 102, 241, 0.18)",
              borderRadius: "16px",
              padding: "1.25rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.05)",
            }}
          >
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)" }}>Mentorship Acceptance Status</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>Control whether students can submit research mentorship requests to your lab.</div>
            </div>
            <button
              type="button"
              onClick={() => setIsAccepting(!isAccepting)}
              style={{
                background: isAccepting ? "#10b981" : "#e2e8f0",
                color: isAccepting ? "#ffffff" : "var(--text-tertiary)",
                border: "none",
                borderRadius: "100px",
                padding: "0.5rem 1.25rem",
                fontSize: "0.8rem",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {isAccepting ? "✓ Accepting Requests" : "Not Accepting"}
            </button>
          </div>

          {/* Name & Academic Position Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <FieldInput id="first_name" name="first_name" label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Jane" icon={<User size={15} />} />
            <FieldInput id="last_name" name="last_name" label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Smith" icon={<User size={15} />} />
            <FieldInput id="preferred_name" name="preferred_name" label="Preferred Name (Optional)" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} placeholder="e.g. Janie" icon={<User size={15} />} />
          </div>

          {/* Academic Profile Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <FieldInput id="academic_title" name="academic_title" label="Academic Position / Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Associate Professor & Lab PI" icon={<GraduationCap size={15} />} />
            <FieldInput id="department" name="department" label="Department / School" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="e.g. Department of Computer Science" icon={<Building2 size={15} />} />
            <FieldInput id="institution" name="institution" label="University / Institution" value={inst} onChange={(e) => setInst(e.target.value)} placeholder="e.g. Stanford University" icon={<Building2 size={15} />} />
            <FieldInput id="lab_website" name="lab_website" label="Lab Website / Personal URL" value={labSite} onChange={(e) => setLabSite(e.target.value)} placeholder="e.g. https://lab.university.edu" icon={<Globe size={15} />} />
            <FieldInput id="office_hours" name="office_hours" label="Office Hours & Availability" value={officeHrs} onChange={(e) => setOfficeHrs(e.target.value)} placeholder="e.g. Tuesdays 2–4pm EST" icon={<Clock size={15} />} />
            <FieldInput id="accepting_student_types" name="accepting_student_types" label="Mentee Levels Accepted (Comma separated)" value={studentTypes} onChange={(e) => setStudentTypes(e.target.value)} placeholder="Undergraduate, High School, Master's" icon={<Users size={15} />} />
          </div>

          {/* Focus Areas */}
          <FieldInput id="expertise_fields" name="expertise_fields" label="Research Focus Areas (Comma separated)" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Machine Learning, Computer Vision, Deep Learning" icon={<BookOpen size={15} />} />

          {/* Research Bio */}
          <div>
            <label htmlFor="bio" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              <FileText size={15} color="#4f46e5" /> Research Overview & Lab Philosophy
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your lab's primary research questions, current projects, and what qualities you appreciate in prospective student mentees..."
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid rgba(99, 102, 241, 0.18)",
                borderRadius: "14px",
                padding: "1rem",
                fontSize: "0.9rem",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Featured Publications */}
          <div>
            <label htmlFor="publications" style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              <BookOpen size={15} color="#4f46e5" /> Featured Publications (One paper title per line)
            </label>
            <textarea
              id="publications"
              name="publications"
              rows={3}
              value={publications}
              onChange={(e) => setPublications(e.target.value)}
              placeholder="Smith et al. (2025). Efficient Transformer Architectures. Nature Machine Intelligence."
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid rgba(99, 102, 241, 0.18)",
                borderRadius: "14px",
                padding: "1rem",
                fontSize: "0.85rem",
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Submit Button */}
          <div data-tour="tour-prof-save-button" style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="gap-2"
              icon={loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            >
              {loading ? "Saving Changes…" : "Save Faculty Profile"}
            </Button>
          </div>
        </form>
      ) : (
        /* Live Student View Preview */
        <div
          style={{
            background: "#ffffff",
            border: "1px solid rgba(99, 102, 241, 0.18)",
            borderRadius: "20px",
            padding: "2.5rem",
            boxShadow: "0 6px 24px rgba(99, 102, 241, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div
                style={{
                  width: "4rem",
                  height: "4rem",
                  borderRadius: "50%",
                  background: "rgba(79, 70, 229, 0.1)",
                  border: "1.5px solid rgba(79, 70, 229, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  color: "var(--accent)",
                  overflow: "hidden",
                }}
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text-primary)", margin: "0 0 0.25rem 0" }}>
                  Dr. {displayName} {lastName}
                </h2>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {title} • {dept}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.2rem" }}>
                  <Building2 size={13} color="#4f46e5" /> {inst}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ padding: "0.35rem 0.85rem", borderRadius: "100px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#166534", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <CheckCircle2 size={13} color="#166534" /> Verified Faculty
              </span>
              <span style={{ padding: "0.35rem 0.85rem", borderRadius: "100px", background: isAccepting ? "rgba(79, 70, 229, 0.1)" : "rgba(239, 68, 68, 0.1)", border: isAccepting ? "1px solid rgba(79, 70, 229, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)", color: isAccepting ? "var(--accent)" : "#dc2626", fontSize: "0.72rem", fontWeight: 800 }}>
                {isAccepting ? "Accepting Students" : "Currently Full"}
              </span>
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.15)" }} />

          {/* Research Bio */}
          {bio && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.4rem" }}>
                Research Overview & Lab Philosophy
              </span>
              <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.65, margin: 0 }}>{bio}</p>
            </div>
          )}

          {/* Focus Areas */}
          {expertiseArray.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>
                Research Focus Areas
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {expertiseArray.map((exp: string, i: number) => (
                  <span key={i} style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", color: "var(--accent)", padding: "0.3rem 0.75rem", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 700 }}>
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Mentee Levels */}
          {studentTypesArray.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>
                Accepted Mentee Levels
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                {studentTypesArray.map((st: string, i: number) => (
                  <span key={i} style={{ background: "#f8fafc", border: "1px solid var(--border-hover)", color: "#334155", padding: "0.25rem 0.65rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600 }}>
                    {st}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Office Hours & Lab Site */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {officeHrs && (
              <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Clock size={12} color="#4f46e5" /> Office Hours
                </span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{officeHrs}</span>
              </div>
            )}
            {labSite && (
              <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Globe size={12} color="#4f46e5" /> Lab Website
                </span>
                <a href={labSite.startsWith("http") ? labSite : `https://${labSite}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)", wordBreak: "break-all", overflowWrap: "break-word", maxWidth: "100%", display: "block" }}>
                  {labSite}
                </a>
              </div>
            )}
          </div>

          {/* Publications */}
          {publicationsArray.length > 0 && (
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>
                Featured Publications
              </span>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {publicationsArray.map((pub: string, i: number) => (
                  <li key={i} style={{ marginBottom: "0.3rem" }}>{pub}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldInput({ id, name, label, value, onChange, placeholder, icon }: { id: string; name: string; label: string; value: string; onChange: (e: any) => void; placeholder: string; icon: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
        {icon} {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "#ffffff",
          border: "1px solid rgba(99, 102, 241, 0.18)",
          borderRadius: "100px",
          padding: "0.75rem 1.25rem",
          fontSize: "0.88rem",
          color: "var(--text-primary)",
          outline: "none",
          fontFamily: "var(--font-sans)",
        }}
      />
    </div>
  );
}
