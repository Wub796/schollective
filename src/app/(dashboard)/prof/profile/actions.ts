"use server";

import { getCurrentUserAndProfile, upsertProfile } from "@/lib/neon/profiles";
import { revalidatePath } from "next/cache";
import {
  checkRateLimit,
  sanitiseText,
  sanitiseUrl,
  sanitiseTagArray,
  sanitiseMultiline,
  sanitiseBool,
  LIMITS,
} from "@/lib/security";

export async function updateProfProfile(formData: FormData) {
  try {
    const { user, profile } = await getCurrentUserAndProfile();

    if (!user || !profile) {
      return { error: "Unauthorized: Please log in." };
    }

    // Rate limit: 10 profile updates per 5 minutes
    const rate = checkRateLimit(`profile:${user.id}`, 10, 5 * 60 * 1000);
    if (!rate.allowed) {
      return { error: `Profile update limit reached. Please wait ${Math.ceil(rate.retryAfterSeconds / 60)} minute(s).` };
    }

    const expertiseFields = sanitiseTagArray(formData.get("expertise_fields"), LIMITS.expertiseField);
    const acceptingStudentTypes = sanitiseTagArray(formData.get("accepting_student_types"), LIMITS.studentType);
    const publications = sanitiseMultiline(formData.get("publications"), LIMITS.publication);

    const updates = {
      id: user.id,
      email: user.email,
      role: "professor" as const,
      first_name: sanitiseText(formData.get("first_name"), LIMITS.name),
      last_name: sanitiseText(formData.get("last_name"), LIMITS.name),
      preferred_name: sanitiseText(formData.get("preferred_name"), LIMITS.name),
      institution: sanitiseText(formData.get("institution"), LIMITS.institution),
      department: sanitiseText(formData.get("department"), LIMITS.department),
      academic_title: sanitiseText(formData.get("academic_title"), LIMITS.academicTitle),
      bio: sanitiseText(formData.get("bio"), LIMITS.bio),
      lab_website: sanitiseUrl(formData.get("lab_website")),
      office_hours: sanitiseText(formData.get("office_hours"), LIMITS.officeHours),
      expertise_fields: expertiseFields,
      accepting_student_types: acceptingStudentTypes,
      publications,
      is_accepting_requests: sanitiseBool(formData.get("is_accepting_requests")),
    };

    await upsertProfile(updates);

    revalidatePath("/prof/profile");
    revalidatePath("/prof/dashboard");
    revalidatePath(`/professors/${user.id}`);
    revalidatePath("/professors");

    return { success: true };
  } catch (err: any) {
    console.error("[updateProfProfile] Error:", err);
    return { error: err.message || "Failed to save profile." };
  }
}
