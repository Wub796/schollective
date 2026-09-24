/**
 * Tour step icons, and the server/client boundary they cross.
 *
 * `InteractiveOnboardingTour` is a Client Component, and the step lists are
 * declared in Server Components — `(dashboard)/dashboard/page.tsx` and
 * `(dashboard)/prof/dashboard/page.tsx`. A prop crossing that boundary is RSC
 * serialisation, which carries plain data and nothing else.
 *
 * The step icon used to be typed `LucideIcon` and written `icon: Home`. A lucide
 * icon is a function, so React received `{$$typeof: ..., render: fn}` and threw
 * "Functions cannot be passed directly to Client Components", which production
 * masked behind a digest — the browser only ever printed "An error occurred in
 * the Server Components render". Nobody could be told which prop was at fault.
 *
 * The failure was also invisible to this suite, because the only tour test
 * exercises the auto-launch predicate rather than the props: any signed-in visit
 * to a dashboard crashed, while every test passed. The two dashboard routes
 * redirect before building their JSX, so the crash was unreachable signed out —
 * which is why a route sweep of the built server found nothing either.
 *
 * These assertions keep the icon a string. If someone writes `icon: Home` again
 * the type error is the real guard; this test exists so the *reason*, and the
 * shape of the contract, survive the next refactor.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TOUR_PATH = path.join(ROOT, "src/components/features/InteractiveOnboardingTour.tsx");
const tourSource = readFileSync(TOUR_PATH, "utf8");

/** Every module under src/ that could declare a tour step list. */
function sourceFiles(dir = path.join(ROOT, "src")) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : [];
  });
}

/** The members of the `TourIcon` union. */
function tourIconNames() {
  const block = tourSource.match(/export type TourIcon =([\s\S]*?);/);
  assert.ok(block, "InteractiveOnboardingTour must export a TourIcon union");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

/** The keys of the `TOUR_ICONS` registry. */
function tourIconRegistryNames() {
  const block = tourSource.match(/const TOUR_ICONS: Record<TourIcon, LucideIcon> = \{([\s\S]*?)\n\};/);
  assert.ok(block, "InteractiveOnboardingTour must resolve names through TOUR_ICONS");
  return [...block[1].matchAll(/(?:"([^"]+)"|([A-Za-z][\w-]*))\s*:/g)].map(
    (match) => match[1] ?? match[2],
  );
}

// A declaration, not a reference: the client component types its own prop as
// `steps: TourStep[]` and holds no icons at all.
const stepFiles = sourceFiles().filter((file) => /TourStep\[\]\s*=\s*\[/.test(readFileSync(file, "utf8")));

test("the step icon is a name, not a component reference", () => {
  assert.match(
    tourSource,
    /icon\?: TourIcon;/,
    "TourStep.icon must be a TourIcon name — a component reference cannot be serialised to a Client Component",
  );
  assert.doesNotMatch(
    tourSource,
    /icon\?: LucideIcon;/,
    "a LucideIcon prop is a function prop and throws at render time",
  );
});

test("the union and the registry describe the same icon set", () => {
  const names = tourIconNames();
  const registry = tourIconRegistryNames();

  assert.ok(names.length > 0, "the union must name at least one icon");
  assert.deepEqual(
    [...names].sort(),
    [...registry].sort(),
    "every nameable icon must resolve, and every resolved icon must be nameable",
  );
});

test("every declared step passes its icon as a string literal", () => {
  assert.ok(stepFiles.length >= 2, "the student and professor dashboards both declare steps");
  const names = new Set(tourIconNames());

  for (const file of stepFiles) {
    const source = readFileSync(file, "utf8");
    const icons = [...source.matchAll(/icon:\s*([^,\n]+),/g)].map((match) => match[1].trim());

    assert.ok(icons.length > 0, `${path.relative(ROOT, file)} declares steps with icons`);

    for (const value of icons) {
      assert.match(
        value,
        /^"[^"]+"$/,
        `${path.relative(ROOT, file)}: icon ${value} must be a quoted string, not a value that cannot cross the boundary`,
      );
      assert.ok(
        names.has(value.slice(1, -1)),
        `${path.relative(ROOT, file)}: icon ${value} is not a member of TourIcon`,
      );
    }
  }
});

test("the popover renders a resolved component, not a member expression", () => {
  assert.ok(
    tourSource.includes("const CurrentStepIcon = currentStep?.icon ? TOUR_ICONS[currentStep.icon] : null;"),
    "the icon must be resolved from the registry before render",
  );
  assert.doesNotMatch(
    tourSource,
    /<currentStep\.icon/,
    "a lowercase-leading member expression is read as an intrinsic tag, not a component",
  );
});
