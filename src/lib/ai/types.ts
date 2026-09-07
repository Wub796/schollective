/**
 * Schollective AI Academic Intelligence Suite — Types & Interfaces
 */

export interface PillarScores {
  academic_rigor: number;         // 0-100 (Curved)
  domain_alignment: number;       // 0-100 (Curved)
  leadership_initiative: number;  // 0-100 (Curved)
  completeness: number;           // 0-100 (Structural checklist)
}

export interface ProfileReviewOutput {
  status: "Ready for Outreach" | "Needs Edits";
  summary: string;                // Exactly 2 sentences. Max 22 words each.
  pillar_scores: PillarScores;
  strengths: string[];            // 2-3 genuine, concrete hooks
  flags: string[];                // 2-3 specific issues (vagueness, inflation, disconnects)
  next_steps: string[];           // 2-3 actionable rewrites naming specific tools/metrics
  recommended_topics: string[];   // 3-4 clickable technical sub-field tags
}

/** Legacy shape preserved for backwards compatibility with historical cached items */
export interface ProfileReviewResult {
  overallScore: number;       // 0-100
  clarityScore: number;       // 0-100
  academicToneScore: number;  // 0-100
  alignmentScore: number;     // 0-100
  completenessScore: number;  // 0-100
  summary: string;
  strengths: string[];
  improvements: Array<{
    field: string;
    issue: string;
    suggestion: string;
  }>;
  suggestedInterests?: string[];       // Recommended academic interest tags to explore
  outreachReadiness: "ready" | "needs_work" | "incomplete";
}

export interface ProfessorMatch {
  professorId: string;
  matchScore: number;                 // 0-100
  matchTier?: "Best Fit" | "Strong Match" | "Potential Alignment";
  matchReasons: string[];
  keyOverlaps: string[];
  suggestedOutreachAngle: string;
}

export interface RecommenderResult {
  recommendations: ProfessorMatch[];
  generatedAt: string;
  totalEvaluated: number;
}

export interface SafetyCheckResult {
  allowed: boolean;
  flagged: boolean;
  riskScore: number;                  // 0-100
  categories: {
    bot: boolean;
    toxic: boolean;
    spam: boolean;
    academicScam: boolean;
  };
  reasons: string[];
  actionTaken: "pass" | "warn" | "flag" | "block";
}
