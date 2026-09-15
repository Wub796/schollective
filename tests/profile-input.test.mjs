/**
 * The profile write gate in src/lib/profile-input.ts.
 *
 * The completion tests are the regression guard for a production outage: once
 * `profile_complete` became a privileged field, the onboarding form's request to
 * finish setup was dropped and nothing else set it, so every new account looped
 * between /dashboard and /onboarding. The rules below say who may complete, when
 * — and that a client alone can never mark an empty profile complete.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  PRIVILEGED_PROFILE_FIELDS,
  meetsProfileRequirements,
  resolveProfileCompletion,
  sanitiseProfileBody,
} from "../src/lib/profile-input.ts";

const student = { first_name: "Ada", education_level: "high-school-senior" };
const professor = { first_name: "Jiwoo", last_name: "Kim", institution: "MIT", expertise_fields: ["Genomics"] };

test("a request body can never set a privileged field", () => {
  const body = Object.fromEntries(PRIVILEGED_PROFILE_FIELDS.map((field) => [field, "x"]));
  const out = sanitiseProfileBody({ ...body, profile_complete: true, role: "admin", status: "approved", bio: "<b>hi</b>" });
  for (const field of PRIVILEGED_PROFILE_FIELDS) {
    assert.ok(!(field in out), `${field} leaked through sanitisation`);
  }
  assert.equal(out.bio, "hi");
});

test("required fields differ by role", () => {
  assert.equal(meetsProfileRequirements("student", student), true);
  assert.equal(meetsProfileRequirements("student", { first_name: "Ada" }), false);
  assert.equal(meetsProfileRequirements("student", { first_name: "  ", education_level: "college" }), false);
  assert.equal(meetsProfileRequirements("professor", professor), true);
  assert.equal(meetsProfileRequirements("professor", { ...professor, expertise_fields: [] }), false);
  assert.equal(meetsProfileRequirements("professor", { ...professor, expertise_fields: ["  "] }), false);
  assert.equal(meetsProfileRequirements("professor", { ...professor, institution: "" }), false);
  assert.equal(meetsProfileRequirements("admin", professor), false, "admins are not completed through this route");
});

test("onboarding completes a new student who filled in the required fields", () => {
  assert.equal(
    resolveProfileCompletion({ role: "student", previousRole: "student", alreadyComplete: false, requested: true, merged: student }),
    true,
  );
});

test("signup seeding a profile does not skip onboarding", () => {
  // The signup page saves names and education level before onboarding runs,
  // without asking to complete; the student must still see onboarding.
  assert.equal(
    resolveProfileCompletion({ role: "student", previousRole: "student", alreadyComplete: false, requested: false, merged: student }),
    false,
  );
});

test("a client cannot mark an empty profile complete", () => {
  assert.equal(
    resolveProfileCompletion({ role: "student", previousRole: "student", alreadyComplete: false, requested: true, merged: {} }),
    false,
  );
  assert.equal(
    resolveProfileCompletion({ role: "professor", previousRole: "student", alreadyComplete: false, requested: true, merged: { first_name: "X" } }),
    false,
  );
});

test("a professor completing onboarding is complete; an edit never revokes it", () => {
  assert.equal(
    resolveProfileCompletion({ role: "professor", previousRole: "student", alreadyComplete: false, requested: true, merged: professor }),
    true,
  );
  assert.equal(
    resolveProfileCompletion({ role: "professor", previousRole: "professor", alreadyComplete: true, requested: false, merged: { first_name: "Jiwoo" } }),
    true,
  );
});

test("changing role re-applies the new role's requirements", () => {
  assert.equal(
    resolveProfileCompletion({ role: "professor", previousRole: "student", alreadyComplete: true, requested: false, merged: student }),
    false,
    "a completed student who becomes a professor must set up the faculty profile",
  );
});
