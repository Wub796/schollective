/**
 * The notification island's shape and motion rules.
 *
 * None of these are visible to the compiler, and every one of them has already
 * been wrong once: the chip shrank to a stub on a short label, the droplet was
 * sized from state so it teleported into place, and a `filter` blur animated on
 * top of the card's `backdrop-filter` made the browser re-blur the page behind it
 * on every frame. They are one-line changes to make and very hard to see in a
 * diff, so they are asserted here.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** Source with its comments removed, so prose cannot satisfy or break a match. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/[^\n]*$/gm, "");
}

const ISLAND = stripComments(
  readFileSync(new URL("../src/components/features/notifications/DynamicIsland.tsx", import.meta.url), "utf8"),
);
const CSS = stripComments(readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8"));

/**
 * The opening tags of everything that draws a goo blob.
 *
 * Found by their class and read outwards, rather than by matching the whole tag:
 * these carry comments inside them, and a pattern tight enough to survive that
 * would break on the next reflow.
 */
function gooBlobTags(source) {
  const tags = [];
  const MARKER = 'className="island-goo-blob';
  for (let at = source.indexOf(MARKER); at > -1; at = source.indexOf(MARKER, at + 1)) {
    const open = source.lastIndexOf("<motion.", at);
    const close = source.indexOf("/>", at);
    if (open > -1 && close > -1) tags.push(source.slice(open, close + 2));
  }
  return tags;
}

test("the chip is one length in every state, and the narrow bar lifts the floor", () => {
  const pill = CSS.match(/(?:^|\n)\.island-pill \{([\s\S]*?)\n\}/);
  assert.ok(pill, ".island-pill is gone — the island has nowhere to draw its chip");

  const floor = pill[1].match(/min-width:\s*([\d.]+)rem/);
  assert.ok(floor, "the chip has no minimum length, so a short label pulls it in to a stub");
  assert.ok(Number(floor[1]) >= 8, `a ${floor[1]}rem floor is not a floor`);

  // Below the narrow breakpoint the bar is the hamburger, the wordmark and the
  // chip, and the floor does not fit between them: measured at 390px the chip
  // would overlap the wordmark. The breakpoint has to lift it. Any breakpoint in
  // this range counts, so moving it is allowed and removing it is not.
  const narrow = [...CSS.matchAll(/@media \(max-width: (\d+)px\) \{([\s\S]*?)\n\}/g)].filter(
    (match) => Number(match[1]) >= 400 && Number(match[1]) <= 768,
  );
  assert.ok(narrow.length > 0, "there is no narrow-bar breakpoint at all");
  assert.ok(
    narrow.some((match) => /\.island-pill \{[^}]*min-width:\s*0/.test(match[2])),
    "nothing lifts the chip's minimum length on a narrow bar, where it does not fit",
  );
});

test("the droplet stretches into place instead of appearing there", () => {
  const blobs = gooBlobTags(ISLAND);
  assert.equal(blobs.length, 2, "the droplet is two forms — the chip and the body — and there should be one element for each");

  for (const tag of blobs) {
    assert.match(tag, /animate=\{/, "a blob with no `animate` is drawn at one size forever, whatever the body does");
    // The bug this guards is sizing a blob from the box measured for the element
    // it copies: that moves the droplet the instant the box is read, so it lands
    // while the card fades in somewhere else and the two never read as one body.
    assert.doesNotMatch(
      tag,
      /style=\{\{\s*(width|height|top)\b/,
      "a blob sized by inline style cannot animate — its size has to come from motion",
    );
  }
});

test("each blob starts from the chip, which is the shape a droplet grows out of", () => {
  // `initial` is what framer reads when the element mounts, and the card's blob
  // mounts only when a body does — so this is the whole of the stretch.
  assert.match(
    ISLAND,
    /initial=\{\{ width: pillBox\.width, height: pillBox\.height, top: pillBox\.top \}\}/,
    "the body's blob no longer starts at the chip, so it will appear at its full size",
  );
});

test("nothing the browser has to re-rasterize every frame is animated", () => {
  // Both bodies carry a `backdrop-filter`, so a `filter` blur animating on the
  // same element makes the page behind it re-blur on every frame. The goo layer
  // is what blurs — its `filter` is a static `url(#…)`, which is why this looks
  // for `blur(` rather than for `filter`.
  assert.doesNotMatch(
    ISLAND,
    /filter:\s*["'`]?blur\(/,
    "animating a filter on a backdrop-filtered card is what makes the arrival stutter",
  );

  // And the card only arrives: if a transform is animated on the body, the goo
  // underneath it — which is positioned from the measured box, not the animated
  // one — is left behind by however far the transform travels.
  assert.match(ISLAND, /transformOrigin: "top center"|y: reduceMotion \? 0 : -10/, "the body's arrival has lost its motion");
});

test("the chip is in the first paint, not waiting for the bundle", () => {
  // src/components/ui/entrance.ts documents what a framer `initial` of
  // `opacity: 0` costs: framer resolves it during server rendering, so the
  // element ships invisible and only appears once the bundle has hydrated. The
  // chip is the one control that is always supposed to be on screen, and the
  // shell renders it on every page — so a fade there is an empty top bar on
  // every hard load. A transform-only entrance has no such failure mode: if the
  // animation never runs, the capsule is still there.
  const open = ISLAND.indexOf("<motion.button");
  const body = ISLAND.indexOf("</motion.button>");
  assert.ok(open > -1 && body > open, "the chip is no longer a motion element");

  const chip = ISLAND.slice(open, body);
  assert.match(chip, /initial=\{\{/, "the chip has lost its entrance");
  assert.doesNotMatch(chip, /opacity:\s*0/, "a chip that starts at `opacity: 0` is missing from the server-rendered page");
});

test("the queue only advances once the outgoing body has left", () => {
  // `advance` is called by nothing else, so dropping either half of this leaves
  // the next notification waiting behind one that is no longer on screen.
  assert.match(ISLAND, /mode="wait"/, "without `wait` two bodies are mounted at once, and one measured box cannot describe both");
  assert.match(ISLAND, /onExitComplete=\{advance\}/, "nothing promotes the next notification when a card retires");
});
