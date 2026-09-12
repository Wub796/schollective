/**
 * Client-safe signup validation.
 *
 * Kept as a separate entry point from `validators.ts` purely to keep the
 * 4,744-line US university domain list — and the professor scoring and message
 * filtering logic — out of the browser bundle. The validation RULES are shared:
 * both files delegate to `validateEmailCore`, so the two can no longer drift.
 */

import { validateEmailCore, type EmailValidationResult } from "./email-validation";

export type { EmailValidationResult };

/**
 * Inline signup feedback. Deliberately the lighter of the two configurations:
 * it recognises the curated academic domains and suffixes but not the full US
 * university list, so an institutional address outside the curated set shows
 * "Email looks valid." rather than the recognised-institution state.
 *
 * This is advisory only. Enforcement lives on the server
 * (`isSignupEmailAllowed`, called from the Better Auth create hook).
 */
export function validateEmail(
  email: string,
  role: "student" | "professor",
): EmailValidationResult {
  return validateEmailCore(email, role);
}
