/**
 * US University Database — auto-generated from Hipo dataset
 * 2349 institutions, 2394 unique email domains
 */

import universityData from "./us-universities.json" with { type: "json" };

/** All known US university email domains */
export const US_UNIVERSITY_DOMAINS = new Set<string>(universityData.domains);

/** All known US university official names */
export const US_UNIVERSITY_NAMES: string[] = universityData.names;