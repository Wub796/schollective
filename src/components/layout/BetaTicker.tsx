"use client";

import { useState } from "react";
import { Pause, Play, Rocket } from "lucide-react";

/**
 * The rolling beta notice in the top bar.
 *
 * WHY HERE. A beta build that never says it is a beta produces the wrong kind of
 * bug report ("this is broken") instead of the useful one ("this is broken, here
 * is where"), and this is the one surface every signed-in page shares.
 *
 * It now shares a desktop bar with the notification island, which sits in the
 * centre of it as a layer of its own rather than a box inside it. That is the
 * arrangement worth keeping: the statement runs the full width of the bar and
 * passes behind the chip, going under the ink and coming out the other side, so
 * the chip reads as something sitting in the bar rather than a gap in the
 * sentence. The width note below is about the one limit left on it.
 *
 * WHY IT CAN BE PAUSED. Text that moves on its own and loops indefinitely is
 * exactly what WCAG 2.2.2 covers: it must be stoppable. Hovering pauses it, but
 * that is no use to a keyboard or touch user, so the control is a real button
 * next to the text. `prefers-reduced-motion` gets a static line instead — the
 * first message is written to stand alone for precisely that case, which is why
 * the summary is the first item and the detail follows it. That line is also
 * offset clear of the chip, because text only escapes a chip it is passing under
 * while it is moving.
 *
 * WHY IT IS HIDDEN BELOW 1024px. The same media query that reveals the
 * hamburger is the one that hides this: on a phone the nav is three controls
 * that all earn their space, and a marquee squeezed between them would be
 * unreadable rather than informative.
 *
 * WHY FOUR COPIES, AND WHY IT IS STILL CAPPED. A marquee reads correctly only
 * while the visible window is narrower than the repeated unit: past that, the
 * same sentence is on screen twice at once. One pass of these four messages
 * measures about 2300px, and `.beta-ticker` — which spans the bar now, so it is
 * limited by the display rather than by the island — is capped so that the text
 * inside it stays under that whatever the window is. Four copies animated by
 * -25% (exactly one copy, and a quarter is exact in floating point, so no
 * sub-pixel seam) keep the loop exact however the cap is tuned.
 */

const MESSAGES = [
  "Schollective is in open beta — expect rough edges while we finish it. Bugs and ideas go in Settings → Feedback.",
  "Every beta report is read by the people who build this, and it decides what we work on next.",
  "Still being built: profiles, discovery and mentorship threads may shift shape while the beta lasts.",
  "Hit something broken? Settings → Feedback takes a minute and saves us hours.",
];

export function BetaTicker() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="beta-ticker">
      <span className="beta-ticker-badge">
        <Rocket size={9} aria-hidden="true" />
        Beta
      </span>

      <div className="beta-ticker-window">
        {/* Four identical groups: the animation moves the track by exactly one
            group's width, so the loop has no visible seam. */}
        <div className="beta-ticker-track" data-paused={paused ? "true" : "false"}>
          {[0, 1, 2, 3].map((copy) => (
            <div className="beta-ticker-group" key={copy} aria-hidden={copy > 0 || undefined}>
              {MESSAGES.map((text) => (
                <span className="beta-ticker-item" key={text}>
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="beta-ticker-pause"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        aria-label={paused ? "Resume the beta announcement" : "Pause the beta announcement"}
        title={paused ? "Resume the announcement" : "Pause the announcement"}
      >
        {paused ? <Play size={9} aria-hidden="true" /> : <Pause size={9} aria-hidden="true" />}
      </button>
    </div>
  );
}
