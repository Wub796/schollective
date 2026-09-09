import { test } from "node:test";
import assert from "node:assert/strict";

function shouldLaunchTour({ forceTour, completed, suppressAutoLaunch }) {
  return Boolean(forceTour || (!completed && !suppressAutoLaunch));
}

test("Admin Preview: does NOT show tour even if completed is false", () => {
  const result = shouldLaunchTour({
    forceTour: false,
    completed: false,
    suppressAutoLaunch: true,
  });
  assert.equal(result, false, "Preview button must not launch product tour");
});

test("Admin Test Tour: DOES show tour when forced via ?tour=true", () => {
  const result = shouldLaunchTour({
    forceTour: true,
    completed: false,
    suppressAutoLaunch: true,
  });
  assert.equal(result, true, "Test Tour button must launch product tour");
});

test("Normal first-time student/faculty: DOES show tour when completed is false", () => {
  const result = shouldLaunchTour({
    forceTour: false,
    completed: false,
    suppressAutoLaunch: false,
  });
  assert.equal(result, true, "First-time user must see onboarding tour");
});

test("Normal returning student/faculty: does NOT show tour once completed", () => {
  const result = shouldLaunchTour({
    forceTour: false,
    completed: true,
    suppressAutoLaunch: false,
  });
  assert.equal(result, false, "Returning user must not see onboarding tour again");
});
