import { getGeminiClient } from "./client";
import { SafetyCheckResult } from "./types";
import { filterMessage } from "../validators";

export interface ScanContentOptions {
  userRole?: "student" | "professor" | "admin";
  senderId?: string;
  recipientId?: string;
  recentCountInLastMinute?: number;
}

/**
 * Scans content for safety with strict factual accuracy & zero false positive blocks on academic dialogue.
 */
export async function scanContentForSafety(
  content: string,
  options?: ScanContentOptions
): Promise<SafetyCheckResult> {
  const text = (content || "").trim();

  // 1. Fast Heuristic Filter Layer
  const filterRes = filterMessage(text, {
    recentMessageCount: options?.recentCountInLastMinute,
    rateLimit: 10,
  });

  if (!filterRes.allowed) {
    return {
      allowed: false,
      flagged: true,
      riskScore: 95,
      categories: {
        bot: false,
        toxic: filterRes.layer === 1,
        spam: filterRes.layer === 2,
        academicScam: false,
      },
      reasons: [filterRes.reason || "Content blocked by safety filter"],
      actionTaken: "block",
    };
  }

  // 2. Gemini AI Deep Content Moderation
  const gemini = getGeminiClient();
  if (gemini && text.length > 15) {
    try {
      const prompt = `You are a Trust & Safety AI monitoring an academic platform (Schollective).
EVALUATION PRINCIPLES:
- Allow all normal academic dialogue, scientific references, paper URLs, and student outreach.
- Flag ONLY explicit harassment, hate speech, commercial phishing spam, or contract cheating / essay selling scams.

TEXT TO EVALUATE:
"${text}"

Return ONLY a valid JSON object matching this schema:
{
  "allowed": boolean,
  "flagged": boolean,
  "riskScore": number (0-100),
  "categories": {
    "bot": boolean,
    "toxic": boolean,
    "spam": boolean,
    "academicScam": boolean
  },
  "reasons": ["factual explanations of violations if flagged"],
  "actionTaken": "pass" | "warn" | "flag" | "block"
}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 300,
          temperature: 0.1, // Very low temperature for safety evaluation consistency
        },
      });

      const resText = response.text;
      if (resText) {
        const cleanedText = resText.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleanedText) as SafetyCheckResult;
        parsed.riskScore = Math.max(0, Math.min(100, parsed.riskScore || 0));
        return parsed;
      }
    } catch (err) {
      console.warn("[scanContentForSafety] Gemini safety check failed or unconfigured, returning heuristic result:", err);
    }
  }

  const warning = filterRes.warning || false;
  return {
    allowed: true,
    flagged: warning,
    riskScore: warning ? 45 : 10,
    categories: {
      bot: false,
      toxic: warning,
      spam: false,
      academicScam: false,
    },
    reasons: warning ? ["Message contains language requiring review"] : [],
    actionTaken: warning ? "warn" : "pass",
  };
}

/**
 * Scans a user profile for automated bot creation signatures.
 */
export function scanProfileForBotBehavior(profile: {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  institution?: string | null;
  expertise_fields?: string[] | string | null;
}): { isBot: boolean; botConfidence: number; flags: string[] } {
  const flags: string[] = [];
  let botConfidence = 0;

  const email = (profile.email || "").toLowerCase().trim();
  const firstName = (profile.first_name || "").trim();
  const lastName = (profile.last_name || "").trim();

  if (!email) {
    botConfidence += 40;
    flags.push("Missing email address");
  }

  if (/\d+/.test(firstName) || /\d+/.test(lastName)) {
    botConfidence += 35;
    flags.push("Numeric characters in name fields");
  }

  if (firstName.length > 0 && firstName === lastName) {
    botConfidence += 25;
    flags.push("Identical first and last name");
  }

  if (firstName.length > 8 && !/[aeiouy]/i.test(firstName)) {
    botConfidence += 45;
    flags.push("Name lacks vowels (gibberish pattern)");
  }

  const isBot = botConfidence >= 60;

  return {
    isBot,
    botConfidence: Math.min(100, botConfidence),
    flags,
  };
}
