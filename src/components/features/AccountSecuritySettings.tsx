"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  KeyRound,
  ShieldCheck,
  Sliders,
  LogOut,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AccountSecuritySettingsProps {
  profile: any;
}

export function AccountSecuritySettings({ profile }: AccountSecuritySettingsProps) {
  const router = useRouter();
  const supabase = createClient();

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
    toast.success(newVal ? "Custom cursor enabled." : "Custom cursor disabled.");
  };

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      const err = "Password must be at least 8 characters long.";
      setPasswordError(err);
      toast.error(err);
      return;
    }

    if (newPassword !== confirmPassword) {
      const err = "Passwords do not match.";
      setPasswordError(err);
      toast.error(err);
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.message || "Failed to update password.";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  const displayName = profile?.preferred_name || profile?.first_name || "User";
  const initials = `${profile?.first_name?.[0] ?? "U"}${profile?.last_name?.[0] ?? ""}`;
  const isProf = profile?.role === "professor";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem", maxWidth: "800px" }}>

      {/* ── 1. Account Summary Card ── */}
      <div style={{
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "16px",
        padding: "2rem",
        border: "1px solid rgba(99, 102, 241, 0.18)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{
            width: "4rem", height: "4rem", borderRadius: "50%",
            background: isProf ? "rgba(79, 70, 229, 0.1)" : "rgba(99, 102, 241, 0.1)",
            border: "2px solid rgba(99, 102, 241, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.25rem", fontWeight: 800, color: "#4f46e5", overflow: "hidden",
            flexShrink: 0,
          }}>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {displayName} {profile?.last_name || ""}
              </h2>
              <span style={{
                fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.15em", padding: "0.2rem 0.65rem", borderRadius: "100px",
                background: "rgba(99, 102, 241, 0.1)", color: "#4f46e5",
                border: "1px solid rgba(99, 102, 241, 0.25)",
              }}>
                {profile?.role === "professor" ? "Faculty" : profile?.role === "admin" ? "Admin" : "Student"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
              <Mail size={14} color="#6366f1" />
              <span>{profile?.email || "No email linked"}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", color: "#16a34a", fontWeight: 700, background: "rgba(22, 163, 74, 0.08)", padding: "0.1rem 0.5rem", borderRadius: "100px" }}>
                <CheckCircle2 size={11} /> Verified
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          icon={<LogOut size={14} />}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-500 hover:text-red-700"
        >
          Sign Out
        </Button>
      </div>

      {/* ── 2. Password & Security Manager ── */}
      <div style={{
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "16px",
        padding: "2rem",
        border: "1px solid rgba(99, 102, 241, 0.18)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
          <ShieldCheck size={20} color="#4f46e5" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Security & Password Manager
          </h3>
        </div>
        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
          Update your account password to protect your mentorship communications.
        </p>

        <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {passwordError && (
            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#dc2626",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}>
              {passwordError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.45rem", letterSpacing: "0.15em" }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  style={{
                    width: "100%",
                    padding: "0.8rem 1rem 0.8rem 2.5rem",
                    borderRadius: "100px",
                    border: "1.5px solid rgba(99, 102, 241, 0.4)",
                    background: "rgba(255, 255, 255, 0.95)",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Lock size={15} color="#6366f1" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.7 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "0.45rem", letterSpacing: "0.15em" }}>
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  style={{
                    width: "100%",
                    padding: "0.8rem 1rem 0.8rem 2.5rem",
                    borderRadius: "100px",
                    border: "1.5px solid rgba(99, 102, 241, 0.4)",
                    background: "rgba(255, 255, 255, 0.95)",
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Lock size={15} color="#6366f1" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.7 }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            <Button
              type="submit"
              disabled={passwordLoading || !newPassword}
              size="md"
              icon={passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* ── 3. UI & Accessibility Preferences ── */}
      <div style={{
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "16px",
        padding: "2rem",
        border: "1px solid rgba(99, 102, 241, 0.18)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
          <Sliders size={20} color="#4f46e5" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Interface & Cursor Preferences
          </h3>
        </div>
        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
          Customize your browsing experience across the platform.
        </p>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderRadius: "14px",
          background: "rgba(99, 102, 241, 0.04)",
          border: "1px solid rgba(99, 102, 241, 0.15)",
        }}>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={15} color="#4f46e5" /> Animated Custom Cursor
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
              Enables smooth magnet tracking effects on desktop pointers (OFF by default).
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={customCursor}
            onClick={handleToggleCursor}
            style={{
              position: "relative",
              width: "2.75rem",
              height: "1.5rem",
              borderRadius: "100px",
              background: customCursor ? "#4f46e5" : "rgba(15, 23, 42, 0.2)",
              border: "none",
              cursor: "pointer",
              transition: "background 0.3s ease",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "0.15rem",
                left: customCursor ? "calc(100% - 1.35rem)" : "0.15rem",
                width: "1.2rem",
                height: "1.2rem",
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                transition: "left 0.3s ease",
              }}
            />
          </button>
        </div>
      </div>

      {/* ── 4. Session Protection Notice ── */}
      <div style={{
        background: "rgba(99, 102, 241, 0.05)",
        borderRadius: "14px",
        padding: "1.25rem 1.5rem",
        border: "1px solid rgba(99, 102, 241, 0.18)",
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        fontSize: "0.82rem",
        color: "#475569",
        lineHeight: 1.5,
      }}>
        <Lock size={20} color="#4f46e5" style={{ flexShrink: 0 }} />
        <div>
          <strong>Session Protection Active:</strong> Your account is secured with 1-year persistent token authentication and automatic background token rotation.
        </div>
      </div>

    </div>
  );
}
