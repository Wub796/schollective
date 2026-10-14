/**
 * The score badge's label and colour, kept out of `validators.ts`.
 *
 * `validators.ts` imports the 4,744-line US university domain list, so anything
 * that imports it from a client component drags that whole list into the browser
 * bundle. The review table needs only this mapping, so it lives here where it
 * costs nothing. This is the same reason `validators-client.ts` exists.
 */

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "High Confidence", color: "rgba(120,220,120,0.85)" };
  if (score >= 45) return { label: "Needs Review",    color: "rgba(255,200,80,0.85)"  };
  if (score >= 20) return { label: "Low Confidence",  color: "rgba(255,140,60,0.85)"  };
  return             { label: "Suspicious",           color: "rgba(255,80,80,0.85)"   };
}
