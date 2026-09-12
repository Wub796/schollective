"use server";

import { upsertProfile } from "@/lib/neon/profiles";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/security";
import { requireRole } from "@/lib/authz";
import { sanitiseProfileFormData } from "@/lib/profile-input";
import { internalError } from "@/lib/utils";

export async function updateProfProfile(formData: FormData) {
  // A server action is a public endpoint: its id is a deterministic build-time
  // hash sitting in a static JS chunk that anyone can fetch, page guard or not.
  // This action used to check only "is someone signed in" and then write
  // `role: "professor"` unconditionally, so any signed-in caller could promote
  // themselves out of the admin review queue — and land in a state
  // (role=professor, status=active) that no screen could get them out of.
  const auth = await requireRole("professor");
  if (!auth.ok) return { error: auth.error };

  const { user, profile } = auth;

  try {
    // Rate limit: 10 profile updates per 5 minutes
    const rate = checkRateLimit(`profile:${user.id}`, 10, 5 * 60 * 1000);
    if (!rate.allowed) {
      return { error: `Profile update limit reached. Please wait ${Math.ceil(rate.retryAfterSeconds / 60)} minute(s).` };
    }

    // Role and status are deliberately NOT part of this payload. The caller is
    // already a professor (checked above), and their review status belongs to
    // the admin queue — editing your own profile must never re-open or skip it.
    await upsertProfile({
      ...sanitiseProfileFormData(formData),
      id: user.id,
      email: user.email,
    });

    revalidatePath("/prof/profile");
    revalidatePath("/prof/dashboard");
    revalidatePath(`/professors/${user.id}`);
    revalidatePath("/professors");
    // The directory caches the approved-faculty list; a name or expertise edit
    // has to invalidate the public profile too or the two disagree.
    revalidatePath("/sitemap.xml");

    return { success: true, previewedByAdmin: profile.role === "admin" };
  } catch (err: unknown) {
    return { error: internalError("updateProfProfile", err, "Failed to save profile. Please try again.") };
  }
}
