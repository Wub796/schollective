import { getGeminiClient } from "./client";
import { SafetyCheckResult } from "./types";
import { filterMessage, scoreProfessorApplication } from "../validators";

export interface ScanContentOptions {
  userRole?: "student" | "professor" | "admin";
  senderId?: string;
  recipientId?: string;
  recentCountInLastMinute?: number;
}

/**
 * Scans content (messages, profile text, outreach requests) for bots, toxicity, and academic scams.
 */
export async function scanContentForSafety(
  content: string,
  options?: ScanContentOptions
): Promise<SafetyCheckResult> {
  const text = (content || "").trim();

  // 1. Instant heuristic layer from validators engine
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

  // 2. Gemini AI Deep Content Safety Layer
  const gemini = getGeminiClient();
  if (gemini && text.length > 15) {
    try {
      const prompt = `You are an automated Trust & Safety AI monitoring an academic platform (Schollective).
Analyze the following text for:
1. Bot / Automated Script activity (robotic text, generic spam patterns).
2. Toxic / Abusive language or Harassment.
3. Commercial Spam or Phishing.
4. Academic Scams (contract cheating, selling essays/theses, grade manipulation).

TEXT TO EVALUATE:
"${text}"

Return a strictly formatted JSON object:
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
  "reasons": ["array of human readable violation explanations if flagged"],
  "actionTaken": "pass" | "warn" | "flag" | "block"
}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resText = response.text;
      if (resText) {
        return JSON.parse(resText) as SafetyCheckResult;
      }
    } catch (err) {
      console.warn("[scanContentForSafety] Gemini API call failed or unconfigured, returning heuristic result:", err);
    }
  }

  // Fallback Rule-Based Safety Response
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

  // Check email domain
  if (!email) {
    botConfidence += 40;
    flags.push("Missing email address");
  }

  // Check name patterns (e.g. random strings like "asdfgh" or numbers in names)
  if (/\d+/.test(firstName) || /\d+/.test(lastName)) {
    botConfidence += 35;
    flags.push("Numeric characters in name fields");
  }

  if (firstName.length > 0 && firstName === lastName) {
    botConfidence += 25;
    flags.push("Identical first and last name");
  }

  // Random string character distribution test
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
