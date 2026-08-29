import { sql } from '@/lib/neon/db';

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

export async function updateProfileCompleteness(profileId: string): Promise<boolean> {
  try {
    const profiles = await sql`
      SELECT first_name, last_name, institution, expertise_fields, role
      FROM profiles
      WHERE id = ${profileId}
      LIMIT 1;
    `;
    const profile = profiles[0];

    if (!profile || profile.role !== "professor") return false;

    const { complete } = computeProfileComplete(profile);

    await sql`
      UPDATE profiles
      SET profile_complete = ${complete}
      WHERE id = ${profileId};
    `;

    return complete;
  } catch (err) {
    console.error("[profile-completeness] Error:", err);
    return false;
  }
}
