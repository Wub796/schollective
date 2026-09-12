import { NextResponse } from "next/server";
import { getCurrentUserAndProfile, upsertProfile } from "@/lib/neon/profiles";
import { sanitiseProfileBody } from "@/lib/profile-input";
import { checkRateLimit } from "@/lib/security";
import { isSuspended } from "@/lib/authz";
import { validateEmail } from "@/lib/validators";
import {
  defaultStatusForRole,
  isProfileStatus,
  isUserRole,
  type ProfileStatus,
  type UserRole,
} from "@/lib/status";
import { internalError } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function POST(req: Request) {
  const { session, user, profile } = await getCurrentUserAndProfile(req.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_HEADERS });
  }
  if (isSuspended(profile)) {
    return NextResponse.json(
      { error: "Your account is suspended." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }

  // This route is the JSON twin of the updateProfProfile server action, and it
  // used to be the unguarded one: the body was spread straight into
  // upsertProfile, so nothing capped bio length, stripped HTML, checked URL
  // schemes, or limited how often it could be called.
  const rate = checkRateLimit(`profile:${user.id}`, 20, 5 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many profile updates. Please wait a moment." },
      { status: 429, headers: { ...PRIVATE_HEADERS, "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: PRIVATE_HEADERS });
    }

    const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

    // `role` and `status` are never taken from the body as-is (sanitiseProfileBody
    // drops both); they are re-derived here from what this caller is allowed to
    // become.
    const { allowedRole, allowedStatus, error } = resolveRoleTransition(raw, profile, user.email);
    if (error) {
      return NextResponse.json({ error }, { status: 403, headers: PRIVATE_HEADERS });
    }

    const updated = await upsertProfile({
      ...sanitiseProfileBody(raw),
      ...(allowedRole ? { role: allowedRole } : {}),
      ...(allowedStatus ? { status: allowedStatus } : {}),
      id: user.id,
      email: user.email,
    });

    return NextResponse.json({ success: true, profile: updated }, { headers: PRIVATE_HEADERS });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: internalError("profile/update", err, "Failed to update profile.") },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

interface RoleTransition {
  allowedRole?: UserRole;
  allowedStatus?: ProfileStatus;
  error?: string;
}

/**
 * Decides which role, if any, this caller may move into.
 *
 * An admin may set any role. Everyone else may only pick student or professor,
 * and only while onboarding (no completed profile) or while currently a student
 * — so a professor cannot quietly revert and re-apply to dodge a rejection.
 *
 * Becoming a professor always lands on `pending` unless the account is already
 * approved, which is what keeps the manual credential review in the loop.
 */
function resolveRoleTransition(
  body: Record<string, unknown>,
  profile: { role?: string; status?: string; profile_complete?: boolean | null } | null,
  sessionEmail: string,
): RoleTransition {
  const isAdmin = profile?.role === "admin";
  const rawRole = body.role;
  const rawStatus = body.status;

  let allowedRole: UserRole | undefined;
  let allowedStatus: ProfileStatus | undefined;

  if (typeof rawRole === "string" && rawRole.trim()) {
    const targetRole = rawRole.trim().toLowerCase();
    if (!isUserRole(targetRole)) return { error: "Unknown role." };

    if (isAdmin) {
      allowedRole = targetRole;
    } else if (targetRole === "admin") {
      // Stated explicitly rather than silently ignored: a client asking for this
      // is either broken or probing, and both deserve a real answer.
      return { error: "You cannot assign that role." };
    } else if (!profile?.profile_complete || profile?.role === "student") {
      // The professor institutional-email rule is enforced HERE, at the moment
      // the professor role is actually granted. It cannot be enforced at signup
      // because the role is not chosen until onboarding, and it was previously
      // enforced nowhere on the server at all.
      if (targetRole === "professor") {
        // The session's verified address, never one supplied in the body.
        const emailVerdict = validateEmail(sessionEmail, "professor");
        if (!emailVerdict.ok) return { error: emailVerdict.message };
        allowedRole = targetRole;
        allowedStatus = profile?.status === "approved" ? "approved" : defaultStatusForRole("professor");
      } else {
        allowedRole = targetRole;
        allowedStatus = defaultStatusForRole(targetRole);
      }
    }
    // Otherwise: silently no role change, same as before.
  }

  if (isAdmin && typeof rawStatus === "string" && rawStatus.trim()) {
    const targetStatus = rawStatus.trim().toLowerCase();
    if (!isProfileStatus(targetStatus)) return { error: "Unknown status." };
    allowedStatus = targetStatus;
  }

  return { allowedRole, allowedStatus };
}
