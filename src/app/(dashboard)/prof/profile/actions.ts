"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized: Please log in." };
    }

    // Rate limit: 10 profile updates per 5 minutes
    const rate = checkRateLimit(`profile:${user.id}`, 10, 5 * 60 * 1000);
    if (!rate.allowed) {
      return { error: `Profile update limit reached. Please wait ${Math.ceil(rate.retryAfterSeconds / 60)} minute(s).` };
    }

    const adminClient = createAdminClient();

    // ── Sanitise all string inputs ───────────────────────────────
    const expertiseFields = sanitiseTagArray(formData.get("expertise_fields"), LIMITS.expertiseField);
    const acceptingStudentTypes = sanitiseTagArray(formData.get("accepting_student_types"), LIMITS.studentType);
    const publications = sanitiseMultiline(formData.get("publications"), LIMITS.publication);

    const payload: Record<string, any> = {
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
      updated_at: new Date().toISOString(),
    };

    let { error: updateError } = await adminClient
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    // Schema Resilience Fallback
    if (updateError && (updateError.message?.includes("academic_title") || updateError.message?.includes("publications") || updateError.message?.includes("accepting_student_types") || updateError.message?.includes("schema cache"))) {
      console.warn("[updateProfProfile] Retrying update with core guaranteed columns:", updateError.message);
      delete payload.academic_title;
      delete payload.publications;
      delete payload.accepting_student_types;
      delete payload.office_hours;
      delete payload.lab_website;
      delete payload.department;

      const retry = await adminClient
        .from("profiles")
        .update(payload)
        .eq("id", user.id);
      updateError = retry.error;
    }

    if (updateError) {
      console.error("[updateProfProfile] DB update error:", updateError.message);
      return { error: updateError.message };
    }

    revalidatePath("/prof/profile");
    revalidatePath(`/professors/${user.id}`);
    revalidatePath("/professors");

    return { success: true };
  } catch (err: any) {
    console.error("[updateProfProfile] Error:", err);
    return { error: err.message || "Failed to save profile." };
  }
}