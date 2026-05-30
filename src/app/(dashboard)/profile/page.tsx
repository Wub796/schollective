"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

function Field({
  id, name, type = "text", label, defaultValue, placeholder, disabled = false,
}: {
  id: string; name: string; type?: string; label: string;
  defaultValue?: string; placeholder?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <label htmlFor={id} style={{
        display: "block", fontSize: "0.58rem", fontWeight: 700,
        letterSpacing: "0.22em", textTransform: "uppercase",
        color: disabled ? "rgba(15, 23, 42, 0.18)" : focused ? "var(--accent)" : "rgba(15, 23, 42, 0.3)",
        marginBottom: "0.55rem", transition: "color 0.25s",
        fontFamily: "var(--font-sans)",
      }}>
        {label}
      </label>
      <input
        id={id} name={name} type={type}
        defaultValue={defaultValue} placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: disabled ? "rgba(15, 23, 42, 0.02)" : focused ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)",
          border: `1px solid ${disabled ? "rgba(15, 23, 42, 0.06)" : focused ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "100px",
          padding: "0.95rem 1.75rem",
          fontSize: "0.875rem",
          color: disabled ? "rgba(15, 23, 42, 0.4)" : "var(--text-primary)",
          outline: "none",
          transition: "border-color 0.25s ease, background-0.25s ease, box-shadow 0.25s ease",
          boxShadow: focused ? "0 0 0 4px rgba(37, 99, 235, 0.08)" : "none",
          fontFamily: "var(--font-sans)",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  const router   = useRouter();
  const supabase = createClient();
  const [loading, setLoading]         = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profile, setProfile]         = React.useState<any>(null);
  const [fetching, setFetching]       = React.useState(true);
  const [avatarHover, setAvatarHover] = useState(false);
  const [customCursor, setCustomCursor] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const pref = localStorage.getItem("schollective-custom-cursor");
    setCustomCursor(pref !== "false");
  }, []);

  const handleToggleCursor = () => {
    const newVal = !customCursor;
    setCustomCursor(newVal);
    localStorage.setItem("schollective-custom-cursor", String(newVal));
    window.dispatchEvent(new Event("storage"));
  };

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setFetching(false);
    })();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type and size (max 5 MB)
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
      const ext      = file.name.split(".").pop();
      const filePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
         .from("avatars")
         .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
         .from("avatars")
         .getPublicUrl(filePath);

      // Append cache-buster so the browser refreshes the image
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
         .from("profiles")
         .update({ avatar_url: avatarUrl })
         .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile((p: any) => ({ ...p, avatar_url: avatarUrl }));
      toast.success("Profile picture updated.");
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setAvatarUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const expertiseRaw    = fd.get("expertise_fields") as string;
    const institutionVal  = (fd.get("institution") as string ?? "").trim();

    const updates: Record<string, any> = {
      first_name:     (fd.get("first_name")     as string ?? "").trim(),
      last_name:      (fd.get("last_name")       as string ?? "").trim(),
      preferred_name: (fd.get("preferred_name")  as string ?? "").trim(),
      updated_at:     new Date().toISOString(),
    };
    // Only set institution if the user actually typed something
    if (institutionVal) updates.institution = institutionVal;

    if (profile?.role === "student") {
      const educationLevel = fd.get("education_level") as string;
      if (educationLevel) updates.education_level = educationLevel;
    }
    if (profile?.role === "professor") {
      const expertise = expertiseRaw
        ? expertiseRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      updates.expertise_fields = expertise;

      const inst = updates.institution || profile.institution || "";
      const fName = updates.first_name || profile.first_name || "";
      const lName = updates.last_name || profile.last_name || "";
      updates.profile_complete = !!(fName.trim() && lName.trim() && inst.trim() && expertise.length > 0);
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (error) {
      console.error("[profile/save] Supabase error:", error.code, error.message, error.details, error.hint);
      toast.error(`Save failed: ${error.message}`);
    } else {
      toast.success("Profile updated.");
      setProfile((p: any) => ({ ...p, ...updates }));
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (fetching) {
    return (
      <div style={{ padding: "3rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)" }} />
        <span style={{ fontSize: "0.58rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans)" }}>
          Loading…
        </span>
      </div>
    );
  }

  const displayName = profile?.preferred_name || profile?.first_name || "Scholar";
  const roleLabel   = profile?.role === "professor" ? "Faculty" : profile?.role === "admin" ? "Admin" : "Student";
  const initials    = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <motion.div
      variants={stagger} initial="hidden" animate="show"
      style={{ display: "flex", flexDirection: "column", gap: "5rem", maxWidth: "640px" }}
    >
      {/* ── Header ── */}
      <motion.header variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans, monospace)" }}>
            Account Settings
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4vw, 3.5rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          {displayName}&apos;s{" "}
          <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>profile</em>
        </h1>
      </motion.header>

      {/* ── Avatar + role strip ── */}
      <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>

        {/* Clickable avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <input
            ref={fileInputRef}
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            disabled={avatarUploading}
            title="Change profile picture"
            style={{
              width: "4.5rem", height: "4.5rem", borderRadius: "50%",
              border: avatarHover ? "1px solid rgba(15, 23, 42, 0.35)" : "1px solid rgba(15, 23, 42, 0.12)",
              background: "rgba(15, 23, 42, 0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", cursor: avatarUploading ? "not-allowed" : "pointer",
              position: "relative", padding: 0,
              transition: "border-color 0.25s",
            }}
          >
            {/* Avatar image or initials */}
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profile picture"
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  filter: avatarHover || avatarUploading ? "brightness(0.45)" : "brightness(1)",
                  transition: "filter 0.25s",
                }}
              />
            ) : (
              <span style={{
                fontSize: "1.1rem", fontWeight: 700,
                color: avatarHover ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.7)",
                letterSpacing: "0.04em", fontFamily: "var(--font-sans)",
                transition: "color 0.25s",
              }}>
                {initials || "?"}
              </span>
            )}

            {/* Overlay: camera icon on hover, spinner while uploading */}
            {(avatarHover || avatarUploading) && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "0.2rem",
              }}>
                {avatarUploading
                  ? <Loader2 size={18} color="rgba(15, 23, 42, 0.8)" style={{ animation: "spin 1s linear infinite" }} />
                  : <Camera size={18} color="rgba(15, 23, 42, 0.8)" />
                }
                {!avatarUploading && (
                  <span style={{ fontSize: "0.42rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.6)", fontFamily: "var(--font-sans)" }}>
                    Change
                  </span>
                )}
              </div>
            )}
          </button>
        </div>

        <div>
          <div className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.85)", letterSpacing: "-0.02em", marginBottom: "0.3rem" }}>
            {profile?.first_name} {profile?.last_name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{
              fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em",
              textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)",
              fontFamily: "var(--font-sans, monospace)",
              padding: "0.25rem 0.65rem", border: "1px solid rgba(15, 23, 42, 0.1)",
              borderRadius: "100px",
            }}>
              {roleLabel}
            </span>
            {profile?.status === "approved" && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(120,220,120,0.8)" }} />
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans, monospace)" }}>
                  Verified
                </span>
              </span>
            )}
          </div>
          <p style={{ marginTop: "0.5rem", fontSize: "0.55rem", color: "rgba(15, 23, 42, 0.2)", fontFamily: "var(--font-sans)", letterSpacing: "0.05em" }}>
            Click your avatar to upload a new photo · max 5 MB
          </p>
        </div>
      </motion.div>

      {/* ── Hairline ── */}
      <motion.div variants={fadeUp} style={{ height: "1px", background: "rgba(15, 23, 42, 0.07)" }} />

      {/* ── Edit form ── */}
      <motion.div variants={fadeUp}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans, monospace)" }}>
            Personal Information
          </span>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
          <div className="grid-2">
            <Field id="first_name" name="first_name" label="First Name" defaultValue={profile?.first_name ?? ""} placeholder="Jane" />
            <Field id="last_name"  name="last_name"  label="Last Name"  defaultValue={profile?.last_name  ?? ""} placeholder="Doe"  />
          </div>

          <Field id="preferred_name" name="preferred_name" label="Preferred Name (optional)" defaultValue={profile?.preferred_name ?? ""} placeholder="Janey" />

          {/* Email — readonly */}
          <Field id="email" name="email" type="email" label="Email (cannot change)" defaultValue={profile?.email ?? ""} disabled />

          {/* Institution */}
          <Field id="institution" name="institution" label="Institution" defaultValue={profile?.institution ?? ""} placeholder="e.g. Stanford University" />

          {/* Education Level — students only */}
          {profile?.role === "student" && (
            <div style={{ position: "relative" }}>
              <label htmlFor="education_level" style={{ display: "block", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", marginBottom: "0.55rem", fontFamily: "var(--font-sans)" }}>
                Education Level
              </label>
              <Select
                id="education_level"
                name="education_level"
                defaultValue={profile?.education_level ?? ""}
              >
                <option value="" style={{ background: "#white" }}>Select level…</option>
                <option value="high-school"  style={{ background: "#white" }}>High School</option>
                <option value="undergraduate" style={{ background: "#white" }}>Undergraduate</option>
                <option value="graduate"     style={{ background: "#white" }}>Graduate (Master's)</option>
                <option value="doctoral"     style={{ background: "#white" }}>Doctoral (PhD)</option>
                <option value="postdoctoral" style={{ background: "#white" }}>Postdoctoral</option>
                <option value="other"        style={{ background: "#white" }}>Other</option>
              </Select>
            </div>
          )}

          {/* Expertise — professors only */}
          {profile?.role === "professor" && (
            <Field
              id="expertise_fields"
              name="expertise_fields"
              label="Expertise Fields (comma-separated)"
              defaultValue={profile?.expertise_fields?.join(", ") ?? ""}
              placeholder="e.g. Quantum Computing, AI Ethics, Biology"
            />
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.5rem" }}>
            <span style={{ fontSize: "0.6rem", color: "rgba(15, 23, 42, 0.22)", fontFamily: "var(--font-sans)", letterSpacing: "0.05em" }}>
              Role: <strong style={{ color: "rgba(15, 23, 42, 0.4)" }}>{roleLabel}</strong> · cannot be changed here
            </span>
            <Button
              type="submit"
              disabled={loading}
              size="lg"
            >
              {loading ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.07)" }} />

      {/* ── Preferences ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.15)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)", fontFamily: "var(--font-sans, monospace)" }}>
            Preferences
          </span>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={customCursor}
            onChange={handleToggleCursor}
            style={{ display: "none" }}
          />
          <div style={{
            width: "2.2rem",
            height: "1.2rem",
            borderRadius: "100px",
            background: customCursor ? "var(--accent)" : "rgba(15, 23, 42, 0.15)",
            position: "relative",
            transition: "background 0.25s",
            border: "1px solid rgba(15, 23, 42, 0.05)",
          }}>
            <div style={{
              width: "0.9rem",
              height: "0.9rem",
              borderRadius: "50%",
              background: "#ffffff",
              position: "absolute",
              top: "50%",
              left: customCursor ? "calc(100% - 1.05rem)" : "0.15rem",
              transform: "translateY(-50%)",
              transition: "left 0.25s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }} />
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.65)", fontFamily: "var(--font-sans)" }}>
            Use custom cursor (requires mouse pointer)
          </span>
        </label>
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.07)" }} />

      {/* ── Security ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.15)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)", fontFamily: "var(--font-sans, monospace)" }}>
            Security
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Button
            href="/reset-password"
            variant="ghost"
            size="lg"
          >
            Change Password
          </Button>
        </div>
      </div>

      {/* ── Hairline ── */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.07)" }} />

      {/* ── Session ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.15)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)", fontFamily: "var(--font-sans, monospace)" }}>
            Session
          </span>
        </div>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="lg"
          className="hover:border-[rgba(255,80,80,0.4)] hover:text-[#ff6b6b]"
        >
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
}
