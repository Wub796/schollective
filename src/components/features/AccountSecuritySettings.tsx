"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, authErrorMessage } from "@/lib/auth-client";
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
  AlertTriangle,
  Ban,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FeedbackSettings } from "@/components/features/FeedbackSettings";
import { nameParts } from "@/lib/people";
import {
  DEACTIVATION_GRACE_DAYS,
  DELETE_CONFIRMATION_PHRASE,
  DISABLE_CONFIRMATION_PHRASE,
  confirmationMatches,
} from "@/lib/account-deletion";

/** Which of the two exits the confirmation dialog is standing in front of. */
type LeaveAction = "disable" | "delete";

/**
 * The confirmation step for an irreversible-ish action.
 *
 * A dialog rather than a bare button because both actions sign the user out,
 * revoke every device and change what other people can see, and a native
 * `confirm()` cannot list consequences, let alone require a typed phrase. The
 * phrase is checked again server side — this is friction, not the control.
 */
function ConfirmLeaveDialog({
  action,
  phrase,
  onPhraseChange,
  phraseOk,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  action: LeaveAction;
  phrase: string;
  onPhraseChange: (value: string) => void;
  phraseOk: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isDelete = action === "delete";
  const expected = isDelete ? DELETE_CONFIRMATION_PHRASE : DISABLE_CONFIRMATION_PHRASE;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-account-heading"
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem", background: "rgba(15, 23, 42, 0.42)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div style={{
        width: "100%", maxWidth: "32rem", background: "#ffffff",
        borderRadius: "18px", padding: "1.85rem",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
        display: "flex", flexDirection: "column", gap: "1.15rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <AlertTriangle size={20} color={isDelete ? "#dc2626" : "#4f46e5"} />
          <h3 id="leave-account-heading" style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            {isDelete ? "Delete this account permanently?" : "Disable this account?"}
          </h3>
        </div>

        <div style={{ fontSize: "0.83rem", lineHeight: 1.65, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {isDelete ? (
            <>
              <p style={{ margin: 0 }}>
                Your profile, mentorship threads and messages are deleted straight away. There is no
                grace period, no copy kept, and no way back to this account.
              </p>
              <p style={{ margin: 0 }}>
                <strong>Other people lose the thread too.</strong> A mentorship thread is one set of
                messages, not one copy per reader: every professor and co-student you talked to loses
                the whole conversation, not just your side of it.
              </p>
              <p style={{ margin: 0 }}>
                Your friendships, group memberships, notifications and faculty listing go with it.
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                Your profile is hidden, every device is signed out, and threads that could still
                receive messages are closed. Nothing is deleted.
              </p>
              <p style={{ margin: 0 }}>
                We email you instructions for bringing it back. You can restore it any time in the next{" "}
                <strong>{DEACTIVATION_GRACE_DAYS} days</strong> by signing in. After that the account
                and its data are permanently deleted.
              </p>
              <p style={{ margin: 0 }}>
                Restoring returns your profile, role and faculty listing as they were. Threads closed
                today stay closed — reopening a conversation the other person has moved on from is
                their decision, not yours.
              </p>
            </>
          )}
        </div>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            color: "#dc2626",
            borderRadius: "10px",
            padding: "0.7rem 0.9rem",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <div>
          <label htmlFor="leave-confirmation" style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.45rem", letterSpacing: "0.15em" }}>
            Type {expected} to confirm
          </label>
          <input
            id="leave-confirmation"
            type="text"
            value={phrase}
            autoComplete="off"
            autoCapitalize="characters"
            onChange={(e) => onPhraseChange(e.target.value)}
            placeholder={expected}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "100px",
              border: `1.5px solid ${phraseOk ? "rgba(220, 38, 38, 0.5)" : "rgba(99, 102, 241, 0.35)"}`,
              background: "rgba(255, 255, 255, 0.95)",
              fontSize: "0.85rem",
              letterSpacing: "0.08em",
              color: "var(--text-primary)",
              outline: "none",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", flexWrap: "wrap" }}>
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            Keep my account
          </Button>
          <button
            type="button"
            disabled={!phraseOk || busy}
            onClick={onConfirm}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1.5rem", borderRadius: "100px",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              background: isDelete ? "rgb(220, 38, 38)" : "rgba(220, 38, 38, 0.08)",
              color: isDelete ? "#ffffff" : "#b91c1c",
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", fontFamily: "var(--font-sans)",
              cursor: !phraseOk || busy ? "not-allowed" : "pointer",
              opacity: !phraseOk || busy ? 0.5 : 1,
            }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
            {busy ? "Working…" : isDelete ? "Delete permanently" : "Disable account"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AccountSecuritySettingsProps {
  profile: any;
}

export function AccountSecuritySettings({ profile }: AccountSecuritySettingsProps) {
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
    toast.success(newVal ? "Custom cursor enabled." : "Custom cursor disabled.");
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
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
      // This form used to report success without calling anything: the toast
      // appeared and the password never changed. Better Auth re-checks the
      // current password, and revokeOtherSessions signs out every other device,
      // which is what someone changing their password normally wants.
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        throw new Error(authErrorMessage(error, "Failed to update password."));
      }
      toast.success("Password updated. Your other devices have been signed out.");
      setCurrentPassword("");
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
      await authClient.signOut();
      toast.success("Signed out successfully.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  // ── Leaving the platform ──
  // Two separate actions, not one with an escalation: disabling is reversible
  // and deleting is not, so they get their own buttons, their own consequences
  // and their own confirmation word.
  const [leaveAction, setLeaveAction] = useState<LeaveAction | null>(null);
  const [leavePhrase, setLeavePhrase] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const expectedPhrase =
    leaveAction === "delete" ? DELETE_CONFIRMATION_PHRASE : DISABLE_CONFIRMATION_PHRASE;
  const phraseOk = confirmationMatches(leavePhrase, expectedPhrase);

  function openLeaveDialog(action: LeaveAction) {
    setLeavePhrase("");
    setLeaveError(null);
    setLeaveAction(action);
  }

  async function handleLeave() {
    if (!leaveAction || !phraseOk) return;
    setLeaving(true);
    setLeaveError(null);
    try {
      const res = await fetch(`/api/auth/account/${leaveAction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: leavePhrase }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error || "Something went wrong. Please try again.";
        setLeaveError(message);
        toast.error(message);
        return;
      }

      if (leaveAction === "delete") {
        toast.success("Your account and its data have been deleted.");
        window.location.assign("/");
        return;
      }

      // If the mail could not be sent the account is still disabled, and the
      // restore page is reachable by signing in — so say that rather than
      // claiming an email the user will never receive.
      toast.success(
        data?.emailSent === false
          ? "Account disabled. We could not email you, but signing in will still offer to restore it."
          : "Account disabled. Check your email for how to bring it back.",
      );
      // Every session was revoked, so leave the SPA state behind entirely.
      window.location.assign("/login");
    } catch {
      const message = "We could not reach the server. Please try again.";
      setLeaveError(message);
      toast.error(message);
    } finally {
      setLeaving(false);
    }
  }

  const shownName = nameParts(profile);
  const displayName = shownName.given || "User";
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
            fontSize: "1.25rem", fontWeight: 800, color: "var(--accent)", overflow: "hidden",
            flexShrink: 0,
          }}>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, wordBreak: "break-word" }}>
                {displayName} {shownName.family}
              </h2>
              <span style={{
                fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.15em", padding: "0.2rem 0.65rem", borderRadius: "100px",
                background: "rgba(99, 102, 241, 0.1)", color: "var(--accent)",
                border: "1px solid rgba(99, 102, 241, 0.25)", flexShrink: 0,
              }}>
                {profile?.role === "professor" ? "Faculty" : profile?.role === "admin" ? "Admin" : "Student"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, flexWrap: "wrap", wordBreak: "break-all" }}>
              <Mail size={14} color="#6366f1" style={{ flexShrink: 0 }} />
              <span>{profile?.email || "No email linked"}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", color: "#16a34a", fontWeight: 700, background: "rgba(22, 163, 74, 0.08)", padding: "0.1rem 0.5rem", borderRadius: "100px", flexShrink: 0 }}>
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
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Security & Password Manager
          </h3>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
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

          <div>
            <label htmlFor="current-password" style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.45rem", letterSpacing: "0.15em" }}>
              Current Password
            </label>
            <div style={{ position: "relative", maxWidth: "24rem" }}>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
                required
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem 0.8rem 2.5rem",
                  borderRadius: "100px",
                  border: "1.5px solid rgba(99, 102, 241, 0.4)",
                  background: "rgba(255, 255, 255, 0.95)",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                }}
              />
              <Lock size={15} color="#6366f1" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.7 }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.45rem", letterSpacing: "0.15em" }}>
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
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Lock size={15} color="#6366f1" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.7 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "0.45rem", letterSpacing: "0.15em" }}>
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
                    color: "var(--text-primary)",
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
              disabled={passwordLoading || !newPassword || !currentPassword}
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
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Interface & Cursor Preferences
          </h3>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
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
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={15} color="#4f46e5" /> Animated Custom Cursor
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.2rem" }}>
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
              background: customCursor ? "var(--accent)" : "rgba(15, 23, 42, 0.2)",
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

      {/* ── 4. Feedback & Bug Reports ── */}
      {/* Both settings pages (student and faculty) render this component, so the
          form lands in exactly one place for both roles. */}
      <FeedbackSettings />

      {/* ── 5. Session Protection Notice ── */}
      <div style={{
        background: "rgba(99, 102, 241, 0.05)",
        borderRadius: "14px",
        padding: "1.25rem 1.5rem",
        border: "1px solid rgba(99, 102, 241, 0.18)",
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        fontSize: "0.82rem",
        color: "var(--text-secondary)",
        lineHeight: 1.5,
      }}>
        <Lock size={20} color="#4f46e5" style={{ flexShrink: 0 }} />
        <div>
          <strong>Session Protection Active:</strong> Your account is secured with 1-year persistent token authentication and automatic background token rotation.
        </div>
      </div>

      {/* ── 6. Danger Zone — the two ways out ── */}
      <div style={{
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "16px",
        padding: "2rem",
        border: "1px solid rgba(220, 38, 38, 0.2)",
        boxShadow: "0 4px 20px rgba(220, 38, 38, 0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
          <AlertTriangle size={20} color="#dc2626" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Danger Zone
          </h3>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
          Both actions change your whole account, not just this page. Disabling is reversible; deleting is not.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Disable — reversible, inside a grace window */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.25rem",
            flexWrap: "wrap", padding: "1.25rem 1.5rem", borderRadius: "14px",
            background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.15)",
          }}>
            <div style={{ minWidth: "15rem", flex: 1 }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={15} color="#4f46e5" /> Disable my account
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                Hide your profile, sign out every device and close your open threads. We email you a link that
                brings it all back, and you have {DEACTIVATION_GRACE_DAYS} days before anything is deleted.
              </div>
            </div>
            <Button onClick={() => openLeaveDialog("disable")} variant="outline" size="sm" icon={<Clock size={14} />}>
              Disable account
            </Button>
          </div>

          {/* Delete — immediate and permanent */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.25rem",
            flexWrap: "wrap", padding: "1.25rem 1.5rem", borderRadius: "14px",
            background: "rgba(220, 38, 38, 0.03)", border: "1px solid rgba(220, 38, 38, 0.18)",
          }}>
            <div style={{ minWidth: "15rem", flex: 1 }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Ban size={15} color="#dc2626" /> Delete my account
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                Permanently delete your profile, threads and messages right now. Nothing is kept, and anyone you
                were mentoring loses the conversation too.
              </div>
            </div>
            <Button
              onClick={() => openLeaveDialog("delete")}
              variant="outline"
              size="sm"
              icon={<Ban size={14} />}
              className="text-red-600 border-red-200 hover:bg-red-600 hover:border-red-600 hover:text-white"
            >
              Delete account
            </Button>
          </div>
        </div>
      </div>

      {leaveAction && (
        <ConfirmLeaveDialog
          action={leaveAction}
          phrase={leavePhrase}
          onPhraseChange={setLeavePhrase}
          phraseOk={phraseOk}
          busy={leaving}
          error={leaveError}
          onCancel={() => {
            if (leaving) return;
            setLeaveAction(null);
          }}
          onConfirm={handleLeave}
        />
      )}

    </div>
  );
}
