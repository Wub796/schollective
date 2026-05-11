/**
 * Schollective Validation Engine
 * ─────────────────────────────────────────────────────────────────
 * Zero-dependency, zero-cost algorithms for:
 *   1. Professor application scoring
 *   2. Message content filtering
 */

import {
  KNOWN_ACADEMIC_DOMAINS,
  ACADEMIC_SUFFIXES,
  INSTITUTION_KEYWORDS,
  ACADEMIC_DISCIPLINES,
} from "./academic-data";
import { US_UNIVERSITY_DOMAINS } from "./us-universities";

// ─────────────────────────────────────────────────────────────────
// EMAIL VALIDATION
// ─────────────────────────────────────────────────────────────────

/**
 * Well-known disposable / throwaway email providers.
 * Blocks accounts created purely to bypass verification.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "guerrillamail.de", "guerrillamail.biz", "guerrillamail.info",
  "tempmail.com", "temp-mail.org", "temp-mail.io", "throwam.com",
  "trashmail.com", "trashmail.me", "trashmail.net", "trashmail.at",
  "trashmail.io", "trashmail.xyz",
  "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf",
  "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr",
  "courriel.fr.nf", "moncourrier.fr.nf", "monemail.fr.nf",
  "monmail.fr.nf",
  "sharklasers.com", "guerrillamailblock.com", "grr.la",
  "spam4.me", "spamgourmet.com", "spamgourmet.net", "spamgourmet.org",
  "dispostable.com", "maildrop.cc", "mailnull.com", "mailnew.com",
  "fakeinbox.com", "mailcatch.com", "mailscrap.com", "junk1.com",
  "throwaway.email", "throwam.com", "burnermail.io",
  "10minutemail.com", "10minutemail.net", "10minutemail.org",
  "10minutemail.de", "10minemail.com", "10mail.org",
  "20minutemail.com", "20minutemail.it",
  "mailnesia.com", "emailondeck.com", "tempinbox.com",
  "spamhereplease.com", "spamhere.net", "no-spam.ws",
  "spambox.us", "spambox.info", "spambox.irishspringrealty.com",
  "spamgob.com", "spamslicer.com", "spamthisplease.com",
  "discard.email", "discardmail.com", "discardmail.de",
  "spamfree24.org", "spamfree.eu", "nobulk.com",
  "get2mail.fr", "get1mail.com", "gotmail.com", "gotmail.net",
  "gotmail.org", "filzmail.com", "binkmail.com", "bobmail.info",
  "chammy.info", "devnullmail.com", "deagot.com",
  "fakemailgenerator.com", "fakemailgenerator.net",
  "gishpuppy.com", "hmamail.com", "incognitomailabs.com",
  "jetable.com", "jetable.net", "jetable.org", "jetable.de",
  "kasmail.com", "killmail.com", "killmail.net",
  "klassmaster.com", "klzlk.com", "kurzepost.de",
  "lifebyfood.com", "link2mail.net", "litedrop.com",
  "lol.ovpn.to", "lortemail.dk", "m21.cc",
  "mail4trash.com", "mailbidon.com", "mailbucket.org",
  "mailchop.com", "mailexpire.com", "mailf5.com",
  "mailfall.com", "mailfsck.com", "mailimate.com",
  "mailme.lv", "mailme24.com", "mailmetrash.com",
  "mailmoat.com", "mailnew.com", "mailpoof.com",
  "mailseal.de", "mailshell.com", "mailsiphon.com",
  "mailslite.com", "mailtemp.info", "mailtome.de",
  "mailtrash.net", "mailtv.net", "mailzilla.com",
  "mailzilla.org", "mega.zik.dj",
  "meltmail.com", "messagebeamer.de", "mierdamail.com",
  "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf",
  "mt2009.com", "mt2014.com", "mypartyclip.de", "myphantomemail.com",
  "neomailbox.com", "nepwk.com", "nervmich.net", "nervtmich.net",
  "netmails.com", "netmails.net",
  "nwytg.com", "objectmail.com", "obobbo.com",
  "odnorazovoe.ru", "oneoffmail.com",
  "onewaymail.com", "ordinaryamerican.net",
  "owlpic.com", "pjjkp.com", "plexolan.de",
  "politikerclub.de", "postacin.com", "punkass.com",
  "putthisinyourspamdatabase.com", "quickinbox.com",
  "rcpt.at", "recode.me", "regbypass.comsafe-mail.net",
  "rklips.com", "rmqkr.net", "royal.net",
  "rrohio.com", "rtskm.cfd", "s0ny.net",
  "safersignup.de", "safetymail.info", "safetypost.de",
  "sandelf.de", "schafmail.de",
  "sendspamhere.com", "senseless-entertainment.com",
  "shootmail.com", "shortmail.net", "sibmail.com",
  "sinnlos-mail.de", "slapsfromlastnight.com",
  "smellfear.com", "snakemail.com", "sneakemail.com",
  "sofimail.com", "sofort-mail.de", "sogetthis.com",
  "soisz.com", "spam.la", "spamfree24.de",
  "spamgob.com", "spamherelots.com", "spamhereplease.com",
  "spamoff.de", "spamspot.com", "spamstack.net",
  "spamthis.co.uk", "spamtroll.net", "speed.1s.fr",
  "splynemodoror.cf", "squizzy.de", "stinkefinger.net",
  "stop-my-spam.com", "stuffmail.de", "supergreatmail.com",
  "superstachel.de", "sweetxxx.de", "tafmail.com",
  "tagyourself.com", "tefl.ro", "temporaryemail.net",
  "temporaryemail.us", "temporaryforwarding.com",
  "temporaryinbox.com", "thanksnospam.info",
  "thismailwillself-destruct.com", "throwam.com",
  "tilien.com", "tittbit.in", "tmailinator.com",
  "toiea.com", "toomail.biz", "topranklist.de",
  "tradermail.info", "trash-amil.com", "trash-mail.at",
  "trash-mail.com", "trash-mail.de", "trash-mail.ga",
  "trash-mail.io", "trash-mail.xyz",
  "trashcanmail.com", "trashdevil.com", "trashdevil.de",
  "trashemail.de", "trashimail.com", "trashinbox.com",
  "trashmail.at", "trashmail.com",
  "trashmail.io", "trashmail.me", "trashmail.net",
  "trashmail.xyz",
  "tyldd.com", "uggsrock.com", "uroid.com",
  "valemail.net", "vctel.com", "veryrealemail.com",
  "vidchart.com", "viditag.com", "viewcastmedia.com",
  "viewcastmedia.net", "viewcastmedia.org",
  "vinernet.com", "viralplays.com", "vkcode.ru",
  "vomoto.com", "vpn.st", "vsimcard.com",
  "vtxmail.us", "wam.co.za", "watchfull.net",
  "watchironman3onlinefreefullmovie.com",
  "webemail.me", "webm4il.info", "wegwerfmail.de",
  "wegwerfmail.net", "wegwerfmail.org", "welikecookies.com",
  "whyspam.me", "wilemail.com", "willhackforfood.biz",
  "willselfdestruct.com", "wmail.cf", "writeme.us",
  "wronghead.com", "wuzupmail.net", "xagloo.com",
  "xemaps.com", "xents.com", "xmaily.com",
  "xoxox.cc", "xyzfree.net", "yapped.net",
  "yeah.net", "yomail.info", "youmailr.com",
  "yourdomain.com", "ypmail.webarnak.fr.eu.org",
  "yuurok.com", "zehnminutenmail.de", "zetmail.com",
  "zippymail.info", "zoemail.com", "zoemail.net",
  "zoemail.org", "zombo.com", "zomg.info",
]);

/** Well-known personal email providers (not disposable, but not institutional) */
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.uk", "yahoo.co.in", "yahoo.fr", "yahoo.de",
  "yahoo.es", "yahoo.it", "yahoo.ca", "yahoo.com.au",
  "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de",
  "hotmail.it", "hotmail.es",
  "outlook.com", "outlook.co.uk", "outlook.fr",
  "live.com", "live.co.uk",
  "msn.com",
  "icloud.com", "me.com", "mac.com",
  "protonmail.com", "protonmail.ch", "proton.me",
  "aol.com", "aim.com",
  "mail.com", "inbox.com", "gmx.com", "gmx.net", "gmx.de",
  "zoho.com", "yandex.com", "yandex.ru",
]);

export interface EmailValidationResult {
  /** Whether to allow signup to proceed */
  ok: boolean;
  /** Short, user-facing message to display inline */
  message: string;
  /** Visual state for the input field */
  state: "idle" | "valid" | "warn" | "error";
}

/**
 * Validates an email address for signup.
 *
 * Returns:
 *   ok: true   + state "valid"  → institutional / recognised academic email
 *   ok: true   + state "warn"   → personal email (allowed but flagged)
 *   ok: false  + state "error"  → disposable / invalid format → block signup
 */
export function validateEmail(email: string, role: "student" | "professor"): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  // ── 1. Format check ─────────────────────────────────────────────
  const FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!trimmed || !FORMAT_RE.test(trimmed)) {
    return { ok: false, message: "Please enter a valid email address.", state: "error" };
  }

  const domain = trimmed.split("@")[1] ?? "";

  // ── 2. Disposable email block ────────────────────────────────────
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      message: "Disposable email addresses are not allowed. Please use a real email.",
      state: "error",
    };
  }

  // ── 3. Institutional / academic email ───────────────────────────
  const isAcademic =
    US_UNIVERSITY_DOMAINS.has(domain) ||
    KNOWN_ACADEMIC_DOMAINS.has(domain) ||
    ACADEMIC_SUFFIXES.some((sfx) => domain.endsWith(sfx));

  if (isAcademic) {
    return { ok: true, message: "Institutional email recognised ✓", state: "valid" };
  }

  // ── 4. Personal email — warn professors, allow students ─────────
  if (PERSONAL_DOMAINS.has(domain)) {
    if (role === "professor") {
      return {
        ok: false,
        message: "Professors must use an institutional email (e.g. name@university.edu).",
        state: "error",
      };
    }
    return {
      ok: true,
      message: "Personal email accepted for students. An institutional email is preferred.",
      state: "warn",
    };
  }

  // ── 5. Unknown domain — allow but note it's unverified ──────────
  return {
    ok: true,
    message: "Email looks valid.",
    state: "valid",
  };
}


// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type ScoreLevel = "high" | "medium" | "low" | "suspicious";

export interface ProfessorScore {
  /** 0–100 composite legitimacy score */
  score: number;
  /** Human-readable tier */
  level: ScoreLevel;
  /** Array of positive signals found */
  signals: string[];
  /** Array of red flags found */
  flags: string[];
  /** Per-category breakdown */
  breakdown: {
    email:       number;
    institution: number;
    expertise:   number;
    name:        number;
  };
}

export interface MessageFilterResult {
  /** true = message is clean and should be saved */
  allowed: boolean;
  /** Which layer caught it (1 = hard block, 2 = soft/spam, 3 = anomaly flag) */
  layer?: 1 | 2 | 3;
  /** User-visible reason if blocked or flagged */
  reason?: string;
  /** If true, message goes through but is anomalous */
  warning?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// PROFESSOR VALIDATION ALGORITHM
// ─────────────────────────────────────────────────────────────────

/**
 * Scores a professor application on a 0–100 scale.
 * Higher = more likely to be a legitimate academic.
 *
 * Breakdown:
 *   Email       — up to 35 pts
 *   Institution — up to 30 pts
 *   Expertise   — up to 25 pts
 *   Name        — up to 10 pts
 */
export function scoreProfessorApplication(input: {
  email:            string;
  institution:      string | null | undefined;
  expertise_fields: string[] | string | null | undefined;
  first_name:       string | null | undefined;
  last_name:        string | null | undefined;
}): ProfessorScore {
  const signals: string[] = [];
  const flags:   string[] = [];
  const breakdown = { email: 0, institution: 0, expertise: 0, name: 0 };

  const email       = (input.email ?? "").toLowerCase().trim();
  const institution = (input.institution ?? "").toLowerCase().trim();
  const firstName   = (input.first_name ?? "").trim();
  const lastName    = (input.last_name ?? "").trim();

  // Normalise expertise to an array of lowercase strings
  let expertiseFields: string[] = [];
  if (Array.isArray(input.expertise_fields)) {
    expertiseFields = input.expertise_fields.map((f) => f.toLowerCase().trim());
  } else if (typeof input.expertise_fields === "string" && input.expertise_fields.trim()) {
    expertiseFields = input.expertise_fields
      .split(",")
      .map((f) => f.toLowerCase().trim())
      .filter(Boolean);
  }

  // ── Email scoring (max 35) ─────────────────────────────────────

  const emailDomain = email.split("@")[1] ?? "";

  if (!email || !emailDomain) {
    flags.push("No email provided");
  } else if (US_UNIVERSITY_DOMAINS.has(emailDomain) || KNOWN_ACADEMIC_DOMAINS.has(emailDomain)) {
    // Matches either the full US university database or the curated global list
    breakdown.email = 35;
    signals.push(`Recognised institution domain: ${emailDomain}`);
  } else if (ACADEMIC_SUFFIXES.some((sfx) => emailDomain.endsWith(sfx))) {
    breakdown.email = 28;
    signals.push(`Academic email suffix (.edu / .ac.xx etc.)`);
  } else if (emailDomain.includes("edu") || emailDomain.includes("ac.")) {
    breakdown.email = 20;
    signals.push("Email contains academic indicator");
  } else if (["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "protonmail.com"].includes(emailDomain)) {
    breakdown.email = 0;
    flags.push("Personal email provider — no institutional affiliation");
  } else {
    // Unknown domain — small base score, might be a small college
    breakdown.email = 8;
    signals.push("Non-standard domain (unverified)");
  }

  // ── Institution scoring (max 30) ───────────────────────────────

  if (!institution) {
    breakdown.institution = 0;
    flags.push("Institution field is empty");
  } else {
    let instScore = 0;

    // Keyword match
    const matchedKeyword = INSTITUTION_KEYWORDS.find((kw) => institution.includes(kw));
    if (matchedKeyword) {
      instScore += 20;
      signals.push(`Institution contains academic keyword: "${matchedKeyword}"`);
    }

    // Does the institution name appear in the email domain?
    // e.g. "Stanford University" → domain contains "stanford"
    const instWords = institution.replace(/[^a-z\s]/g, "").split(/\s+/).filter((w) => w.length > 3);
    const domainMatch = instWords.some((word) => emailDomain.includes(word));
    if (domainMatch) {
      instScore += 10;
      signals.push("Institution name consistent with email domain");
    }

    // Plausible length
    if (institution.length >= 5 && institution.length <= 80) {
      instScore += 5;
    } else if (institution.length > 80) {
      flags.push("Institution name unusually long");
      instScore -= 5;
    }

    // Suspicious patterns
    if (/\d{4,}/.test(institution)) {
      flags.push("Institution contains suspicious numbers");
      instScore -= 5;
    }

    breakdown.institution = Math.max(0, Math.min(30, instScore));
  }

  // ── Expertise scoring (max 25) ─────────────────────────────────

  if (expertiseFields.length === 0) {
    breakdown.expertise = 0;
    flags.push("No expertise fields provided");
  } else {
    let expScore = 0;

    // Base for providing at least something
    expScore += 8;

    // Score per recognised discipline (up to 5 checked)
    const recognised = expertiseFields
      .slice(0, 5)
      .filter((field) => {
        return (
          ACADEMIC_DISCIPLINES.has(field) ||
          Array.from(ACADEMIC_DISCIPLINES).some(
            (d) => field.includes(d) || d.includes(field)
          )
        );
      });

    expScore += Math.min(recognised.length * 5, 17);

    if (recognised.length > 0) {
      signals.push(`${recognised.length} recognised academic discipline(s)`);
    } else {
      flags.push("Expertise fields don't match known academic disciplines");
    }

    // Penalty for overly generic single-word fields
    const vagueCount = expertiseFields.filter(
      (f) => f.split(" ").length === 1 && f.length < 4
    ).length;
    if (vagueCount > 0) {
      expScore -= vagueCount * 3;
      flags.push(`${vagueCount} vague/short expertise field(s)`);
    }

    breakdown.expertise = Math.max(0, Math.min(25, expScore));
  }

  // ── Name scoring (max 10) ──────────────────────────────────────

  if (firstName && lastName) {
    breakdown.name = 8;
    if (firstName.length >= 2 && lastName.length >= 2) {
      breakdown.name = 10;
      signals.push("Full name provided");
    }
  } else if (firstName) {
    breakdown.name = 4;
    flags.push("Last name missing");
  } else {
    breakdown.name = 0;
    flags.push("Name incomplete");
  }

  // ── Final score ────────────────────────────────────────────────

  const score = Math.min(
    100,
    breakdown.email + breakdown.institution + breakdown.expertise + breakdown.name
  );

  let level: ScoreLevel;
  if (score >= 70)      level = "high";
  else if (score >= 45) level = "medium";
  else if (score >= 20) level = "low";
  else                  level = "suspicious";

  return { score, level, signals, flags, breakdown };
}

// ─────────────────────────────────────────────────────────────────
// MESSAGE FILTER ALGORITHM
// ─────────────────────────────────────────────────────────────────

/**
 * Hard-block terms — regex with word boundaries.
 *
 * Why regex instead of string includes():
 *   "dick" (string) → blocks "dictionary", "Frederick", "Benedick"
 *   /\bdick\b/i     → only matches the standalone word
 *
 * This list is intentionally short. Every entry must be unambiguously
 * abusive with zero legitimate academic use. When in doubt, move it
 * to SOFT_BLOCK_TERMS instead.
 */
const HARD_BLOCK_TERMS: RegExp[] = [
  /\bnigger\b/i,
  /\bfaggot\b/i,
  /\bcunt\b/i,
  /\bkill\s+yourself\b/i,
  /\bkys\b/i,
  /\bgo\s+die\b/i,
  /\bsend\s+nudes?\b/i,
  // Explicit threats with first-person "I will/I'll kill you"
  /\bi\s*(?:'ll|will)\s+kill\s+you\b/i,
];

/**
 * Soft-block terms — only block when the message is SHORT (≤ 80 chars).
 *
 * Rationale: In a short message "fuck you" is unambiguous.
 * In a 200-char academic message, profanity may appear in a quote,
 * a literary reference, or a word like "battlefield". We allow it
 * through as a warning in that case rather than blocking legitimate
 * academic content.
 */
const SOFT_BLOCK_TERMS: RegExp[] = [
  /\bfuck\b/i,
  /\bshit\b/i,
  /\bbitch\b/i,
  /\basshole\b/i,
  /\bbastard\b/i,
  /\bslut\b/i,
  /\bwhore\b/i,
  /\bretard\b/i,
];

/**
 * Weighted spam signals. Each match adds its weight to a spam score.
 * The message is only blocked when the TOTAL score >= SPAM_BLOCK_THRESHOLD.
 *
 * This prevents individual legitimate elements from triggering false positives:
 *   - One URL (sharing a research paper): free, score += 0
 *   - Two URLs: score += 1
 *   - Three URLs: score += 2  (still under threshold alone)
 *   - Spam phrase "click here": score += 4  (nearly a block on its own)
 *   - Long number (13+ digits): score += 3
 *
 * A professor sharing two paper links + one email address = score 1 + 0 = 1 → passes.
 * A spammer with "click here buy now FREE money": score 4+4+4 = 12 → blocked.
 */
const SPAM_SIGNALS: Array<{ pattern: RegExp; weight: number; label: string }> = [
  // URLs — first one is FREE (see scoring logic below), extras are 1pt each
  { pattern: /https?:\/\//gi, weight: 1, label: "url" },
  // Unambiguous commercial spam vocabulary
  {
    pattern: /\b(buy now|click here|free money|make money fast|earn \$|wire transfer|western union)\b/gi,
    weight: 4,
    label: "spam phrase",
  },
  // 8+ consecutive identical characters (e.g. "!!!!!!!!" or "aaaaaaaa")
  // Note: "......" (6 dots) does NOT match because {7,} requires 8+
  { pattern: /(.)\1{7,}/g, weight: 2, label: "repeated chars" },
  // Very long digit sequences (13+ digits → likely a card or bank number)
  { pattern: /\b\d{13,}\b/g, weight: 3, label: "long number" },
  // Phone number patterns: 555-867-5309 / (555) 867.5309
  { pattern: /\b\d{3}[\s\-.]\d{3}[\s\-.]\d{4}\b/g, weight: 2, label: "phone number" },
];

/** Total spam signal weight required to block a message */
const SPAM_BLOCK_THRESHOLD = 5;

/**
 * Filters a message before it is saved to the database.
 *
 * Design philosophy — allow normal academic messaging:
 *  ✅ Paper URLs ("Here's the arxiv link: https://...")
 *  ✅ Short replies ("OK", "Thanks", "See you at 3pm")
 *  ✅ Acronyms in caps ("Check the NASA/MIT/DNA study")
 *  ✅ Technical jargon, equations, code snippets
 *  ✅ Informal language that isn't abusive
 *  ✅ Email addresses shared for follow-up coordination
 *
 * Block clearly abusive content:
 *  ❌ Slurs (word-boundary matched, not substring)
 *  ❌ Direct threats ("I will kill you", "go die")
 *  ❌ Short profanity-only messages ("fuck you")
 *  ❌ Obvious commercial spam phrases
 *  ❌ Messages sent too fast (rate limiting)
 *
 * Flag but allow borderline content (warning = true):
 *  ⚠️  Profanity in long messages (context uncertain)
 *  ⚠️  Very long all-caps messages (>40 chars, >85% uppercase)
 */
export function filterMessage(
  content: string,
  options?: {
    /** Number of messages this user sent in the last 60 seconds */
    recentMessageCount?: number;
    /** Max messages per minute before rate-limiting kicks in */
    rateLimit?: number;
  }
): MessageFilterResult {
  const text  = content.trim();
  const lower = text.toLowerCase();
  const { recentMessageCount = 0, rateLimit = 15 } = options ?? {};

  // ── Guard: empty message ───────────────────────────────────────
  if (!text) {
    return { allowed: false, layer: 1, reason: "Message cannot be empty." };
  }

  // ── Layer 1: Hard block — slurs and direct threats ─────────────
  // Uses regex with word boundaries to avoid false positives on
  // words that merely contain a blocked substring.
  for (const rx of HARD_BLOCK_TERMS) {
    if (rx.test(lower)) {
      return {
        allowed: false,
        layer:   1,
        reason:  "Your message contains content that violates our community guidelines.",
      };
    }
  }

  // ── Layer 2: Soft block — profanity in short messages ──────────
  // We only hard-block profanity when the message is short (≤ 80 chars),
  // because short messages have no context. In longer messages we flag
  // instead so a professor quoting a literary reference isn't silenced.
  const profanityMatch = SOFT_BLOCK_TERMS.find((rx) => rx.test(text));
  if (profanityMatch) {
    if (text.length <= 80) {
      return {
        allowed: false,
        layer:   2,
        reason:  "Please keep your messages respectful and professional.",
      };
    }
    // Longer message — allow but flag for potential review
    return {
      allowed: true,
      layer:   2,
      warning: true,
      reason:  "Message may contain inappropriate language.",
    };
  }

  // ── Rate limit ─────────────────────────────────────────────────
  // Default: 15 messages per minute. This is generous enough for
  // active mentorship sessions but catches automated flooding.
  if (recentMessageCount >= rateLimit) {
    return {
      allowed: false,
      layer:   2,
      reason:  "You're sending messages too quickly. Please slow down.",
    };
  }

  // ── Layer 3: Weighted spam score ───────────────────────────────
  let spamScore = 0;

  for (const { pattern, weight, label } of SPAM_SIGNALS) {
    // Re-create regex to reset lastIndex for global patterns
    const rx = new RegExp(pattern.source, pattern.flags);
    const matches = text.match(rx);
    if (!matches || matches.length === 0) continue;

    if (label === "url") {
      // The FIRST URL in a message is completely free — sharing one paper
      // link is normal. Each URL beyond the first adds weight.
      const extraUrls = Math.max(0, matches.length - 1);
      spamScore += extraUrls * weight;
    } else {
      spamScore += weight * matches.length;
    }
  }

  if (spamScore >= SPAM_BLOCK_THRESHOLD) {
    return {
      allowed: false,
      layer:   2,
      reason:  "Your message was flagged as potential spam. Please keep messages relevant to your mentorship.",
    };
  }

  // ── Layer 4: Soft anomaly flags (pass through with warning) ────
  // Flag LONG messages that are almost entirely uppercase.
  // We deliberately avoid flagging short messages because:
  //   "OK"     → 100% caps, totally fine
  //   "DNA"    → 100% caps, technical term
  //   "NASA"   → 100% caps, acronym
  //   "MIT AI" → 100% caps, institution + field
  // We only flag when the message is both long (>40 chars) AND
  // has enough letters (>15) AND is almost all caps (>85%).
  const letters   = text.replace(/[^a-zA-Z]/g, "");
  const capsRatio = letters.length > 0
    ? (text.replace(/[^A-Z]/g, "").length / letters.length)
    : 0;

  if (capsRatio > 0.85 && text.length > 40 && letters.length > 15) {
    return {
      allowed: true,
      layer:   3,
      warning: true,
      reason:  "Message appears to be written entirely in caps.",
    };
  }

  // ── All clear ──────────────────────────────────────────────────
  return { allowed: true };
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Returns a short badge label and colour hint for a given score */
export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "High Confidence", color: "rgba(120,220,120,0.85)" };
  if (score >= 45) return { label: "Needs Review",    color: "rgba(255,200,80,0.85)"  };
  if (score >= 20) return { label: "Low Confidence",  color: "rgba(255,140,60,0.85)"  };
  return             { label: "Suspicious",           color: "rgba(255,80,80,0.85)"   };
}
