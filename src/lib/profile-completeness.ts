/**
 * Professor profile completeness utility.
 *
 * A profile is "complete" when it has all fields needed to appear
 * credible in the student-facing directory.
 */

export interface CompletenessResult {
  complete: boolean;
  missingFields: string[];
}

export function computeProfileComplete(profile: any): CompletenessResult {
  const missingFields: string[] = [];

  if (!profile.first_name || !profile.first_name.trim()) {
    missingFields.push("First Name");
  }
  if (!profile.last_name || !profile.last_name.trim()) {
    missingFields.push("Last Name");
  }
  if (!profile.institution || !profile.institution.trim()) {
    missingFields.push("Institution");
  }
  if (!profile.expertise_fields || !Array.isArray(profile.expertise_fields) || profile.expertise_fields.filter(Boolean).length === 0) {
    missingFields.push("Expertise Fields");
  }

  return {
    complete: missingFields.length === 0,
    missingFields,
  };
}

export async function updateProfileCompleteness(supabase: any, profileId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, institution, expertise_fields, role")
      .eq("id", profileId)
      .single();

    if (!profile || profile.role !== "professor") return false;

    const { complete } = computeProfileComplete(profile);

    const { error } = await supabase
      .from("profiles")
      .update({ profile_complete: complete })
      .eq("id", profileId);

    if (error) {
      console.error("[profile-completeness] Failed to update profile_complete:", error.message);
      return false;
    }

    return complete;
  } catch (err) {
    console.error("[profile-completeness] Error:", err);
    return false;
  }
}
