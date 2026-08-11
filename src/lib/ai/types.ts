/**
 * Schollective AI Academic Intelligence Suite — Types & Interfaces
 */

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
  suggestedBioRewrite?: string;        // 1-click AI polished bio
  suggestedInterests?: string[];       // Recommended academic interest tags
  outreachTip?: string;               // Level-specific advice for reaching out to faculty
  outreachReadiness: "ready" | "needs_work" | "incomplete";
}

export interface ProfessorMatch {
  professorId: string;
  matchScore: number;                 // 0-100
  matchTier?: "Best Fit" | "Strong Match" | "Potential Alignment";
  matchReasons: string[];
  keyOverlaps: string[];
  suggestedOutreachAngle: string;
  outreachSubjectLine?: string;       // Custom email/message subject line
  conversationStarter?: string;       // Specific opener for the research request
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
