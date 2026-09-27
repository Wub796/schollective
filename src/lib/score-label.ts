/**
 * Lightweight, client-safe score label and visual styling helper.
 * Zero database, server, or large JSON dependencies.
 */
export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "High Confidence", color: "rgba(120,220,120,0.85)" };
  if (score >= 45) return { label: "Needs Review",    color: "rgba(255,200,80,0.85)"  };
  if (score >= 20) return { label: "Low Confidence",  color: "rgba(255,140,60,0.85)"  };
  return             { label: "Suspicious",           color: "rgba(255,80,80,0.85)"   };
}
