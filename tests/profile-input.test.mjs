/**
 * The profile write gate in src/lib/profile-input.ts.
 *
 * The completion tests are the regression guard for a production outage: once
 * `profile_complete` became a privileged field, the onboarding form's request to
 * finish setup was dropped and nothing else set it, so every new account looped
 * between /dashboard and /onboarding. The rules below say who may complete, when
 * — and that a client alone can never mark an empty profile complete.
 *
 * The rest guard the two ways a save used to report success and store nothing:
 * a cleared field kept its old value, and an uploaded avatar's link was
 * sanitised to an empty string.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CLEARABLE_PROFILE_TEXT_FIELDS,
  PRIVILEGED_PROFILE_FIELDS,
  blankedRequiredField,
  meetsProfileRequirements,
  rejectedProfileField,
  resolveProfileCompletion,
  sanitiseProfileBody,
  sanitiseProfileFormData,
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

const OWN_AVATAR = "/api/storage/avatar/avatars/user_1/1757937600000.jpg";

test("an uploaded avatar is stored as a path to the route that serves it", () => {
  const withCacheBuster = `${OWN_AVATAR}?t=1757937600123`;
  assert.equal(sanitiseProfileBody({ avatar_url: withCacheBuster }, "user_1").avatar_url, withCacheBuster);
  assert.equal(
    sanitiseProfileBody({ avatar_url: "https://lh3.googleusercontent.com/a/photo" }, "user_1").avatar_url,
    "https://lh3.googleusercontent.com/a/photo",
  );
});

test("an avatar that is not the caller's own upload is refused, never silently dropped", () => {
  for (const avatar_url of [
    OWN_AVATAR.replace("user_1", "user_2"),
    "/api/storage/avatar/../secrets.txt",
    `${OWN_AVATAR}?t=1&x=2`,
    "javascript:alert(1)",
    "http://example.com/a.png",
  ]) {
    const body = { avatar_url };
    const clean = sanitiseProfileBody(body, "user_1");
    assert.equal(clean.avatar_url, undefined, avatar_url);
    assert.equal(rejectedProfileField(body, clean)?.field, "avatar_url", avatar_url);
  }
});

test("a field sent empty is a clear, not a rejection", () => {
  const body = { preferred_name: "", bio: "   ", major: "Biology" };
  const clean = sanitiseProfileBody(body);
  assert.equal(clean.preferred_name, "");
  assert.equal(clean.bio, "");
  assert.equal(clean.major, "Biology");
  assert.equal(rejectedProfileField(body, clean), null);
});

test("typed input that sanitises to nothing is refused with the field named", () => {
  const markup = { bio: "<b></b>" };
  assert.deepEqual(rejectedProfileField(markup, sanitiseProfileBody(markup)), {
    field: "bio",
    message: "Bio could not be saved as entered.",
  });
  const link = { portfolio_url: "my portfolio" };
  assert.match(rejectedProfileField(link, sanitiseProfileBody(link))?.message ?? "", /^Portfolio link must be a web address/);
  const form = new FormData();
  form.set("lab_website", "javascript:alert(1)");
  assert.equal(rejectedProfileField(form, sanitiseProfileFormData(form))?.field, "lab_website");
});

test("a saved profile cannot blank a field its role requires", () => {
  assert.equal(blankedRequiredField("student", student, sanitiseProfileBody({ first_name: " " }))?.field, "first_name");
  assert.equal(blankedRequiredField("professor", professor, sanitiseProfileBody({ expertise_fields: [] }))?.field, "expertise_fields");
  assert.equal(blankedRequiredField("student", student, sanitiseProfileBody({ major: "" })), null, "optional fields clear freely");
  assert.equal(
    blankedRequiredField("student", { first_name: "Ada" }, sanitiseProfileBody({ education_level: "" })),
    null,
    "a field an older profile never had can stay empty",
  );
  assert.equal(blankedRequiredField("student", student, sanitiseProfileBody({ avatar_url: OWN_AVATAR })), null, "fields not sent are untouched");
});

test("upsertProfile clears every clearable column instead of keeping the stored value", () => {
  const source = readFileSync(new URL("../src/lib/neon/profiles.ts", import.meta.url), "utf8");
  for (const field of CLEARABLE_PROFILE_TEXT_FIELDS) {
    assert.ok(
      source.includes(
        `${field} = CASE WHEN '${field}' = ANY(\${cleared}::text[]) THEN NULL ELSE COALESCE(EXCLUDED.${field}, profiles.${field}) END`,
      ),
      `${field} is written with a bare COALESCE, so clearing it would report success and keep the old value`,
    );
  }
});
