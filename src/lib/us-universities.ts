if (typeof window !== "undefined") {
  throw new Error("us-universities.json is server-only and cannot be imported in client components.");
}

import universityData from "./us-universities.json" with { type: "json" };

/** All known US university email domains */
export const US_UNIVERSITY_DOMAINS = new Set<string>(universityData.domains);

/** All known US university official names */
export const US_UNIVERSITY_NAMES: string[] = universityData.names;