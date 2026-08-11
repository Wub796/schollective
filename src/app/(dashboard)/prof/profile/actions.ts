"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateProfProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized: Please log in." };
    }

    const adminClient = createAdminClient();

    const rawExpertise = (formData.get("expertise_fields") as string) || "";
    const expertiseFields = rawExpertise.split(",").map((s) => s.trim()).filter(Boolean);

    const rawStudentTypes = (formData.get("accepting_student_types") as string) || "";
    const acceptingStudentTypes = rawStudentTypes.split(",").map((s) => s.trim()).filter(Boolean);

    const rawPublications = (formData.get("publications") as string) || "";
    const publications = rawPublications.split("\n").map((s) => s.trim()).filter(Boolean);

    const payload: Record<string, any> = {
      first_name: (formData.get("first_name") as string || "").trim(),
      last_name: (formData.get("last_name") as string || "").trim(),
      preferred_name: (formData.get("preferred_name") as string || "").trim(),
      institution: (formData.get("institution") as string || "").trim(),
      department: (formData.get("department") as string || "").trim(),
      academic_title: (formData.get("academic_title") as string || "").trim(),
      bio: (formData.get("bio") as string || "").trim(),
      lab_website: (formData.get("lab_website") as string || "").trim(),
      office_hours: (formData.get("office_hours") as string || "").trim(),
      expertise_fields: expertiseFields,
      accepting_student_types: acceptingStudentTypes,
      publications: publications,
      is_accepting_requests: formData.get("is_accepting_requests") === "true",
      updated_at: new Date().toISOString(),
    };

    let { error: updateError } = await adminClient
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    // Schema Resilience Fallback: If custom DB lacks new columns, retry with core fields
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
