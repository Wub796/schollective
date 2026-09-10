/**
 * Generic-outreach rejection for mentorship requests.
 *
 * The for-professors landing page promises that "the outreach editor rejects
 * generic mass messages, requiring students to cite specific papers or methods
 * relevant to your group." This module is that promise: a deterministic,
 * zero-cost heuristic (no AI) that runs before a request is created.
 *
 * Deliberately tuned for precision over recall — a false "generic" verdict
 * blocks a genuine student, while a missed template only costs a professor a
 * few seconds. Signals that discriminate a real, individualised inquiry:
 *   - references to a specific paper, course, method, dataset or tool
 *   - first-person specificity (my project, our lab results)
 *   - concrete numbers (GPA, years, sample sizes, deadlines)
 *   - sustained effort (long enough background + goals, varied sentences)
 */

/** Minimum combined length of background+goals before the check applies. */
const MIN_TOTAL_LENGTH = 240;
/** Minimum distinct words in the combined text — template blasts reuse few. */
const MIN_DISTINCT_WORDS = 40;
/** A request whose goals section is shorter than this is not a real ask. */
const MIN_GOALS_LENGTH = 80;

/** Phrases that scream copy-pasted outreach blasts. */
const TEMPLATE_PATTERNS: RegExp[] = [
  /dear (?:professor|doctor|dr\.?|sir|madam)/i,
  /i am writing to (?:inquire|express|reach out)/i,
  /i hope this (?:email|message) finds you well/i,
  /i would be (?:honou?red|grateful|privileged) to (?:join|be (?:a )?part of|work under)/i,
  /your (?:esteemed|renowned|prestigious) (?:lab|research|group|institution)/i,
  /i have (?:always been|long been) (?:passionate|fascinated) about/i,
  /opportunity to (?:learn from|grow under|contribute to) your/i,
  /(?:kindly|please) consider (?:my|this) (?:application|request|profile)/i,
  /i came across your (?:profile|page) and (?:was|am) (?:very )?impressed/i,
  /cold ?email/i,
];

/**
 * Specificity signals — if enough of these appear, the request cites concrete
 * detail and should never be rejected, no matter how templated it sounds.
 */
const SPECIFICITY_PATTERNS: RegExp[] = [
  /\b(?:paper|preprint|article|publication|thesis|dissertation)\b/i,
  /\b(?:arxiv|doi|pubmed|ieee|acm|nature|science|cell|pnas)\b/i,
  /\b(?:figure|table|appendix|section \d|equation|theorem|lemma)\b/i,
  /\b(?:method|methodology|protocol|pipeline|framework|algorithm|model|dataset|benchmark)\b/i,
  /\b(?:course|class|seminar|lab rotation|independent study)\b/i,
  /\b(?:gpa|gre|grade)\b|\b\d(?:\.\d+)?\s?\/\s?\d/i,
  /\b\d+\s?(?:hours?|participants?|samples?|patients?|students?|runs?|trials?|iterations?|epochs)\b/i,
  /\b(?:python|pytorch|tensorflow|r\s|matlab|spss|stata|numpy|pandas|gis|autodesk|solidworks|ros)\b/i,
  /\b(?:my|our)\s+(?:project|research|thesis|experiment|results|data|analysis|paper|coursework)\b/i,
  /\b(?:replicate|extend|reproduce|apply|adapt)\b[^.!?]*\b(?:method|approach|model|findings|results|technique)\b/i,
  /\b(?:fall|spring|summer|winter)\s*20\d\d\b/i,
];

export interface GenericCheckResult {
  /** true when the request may proceed */
  allowed: boolean;
  /** User-visible reason when rejected */
  reason?: string;
}

/**
 * Returns why the request looks like a mass-mail template, or `allowed`.
 *
 * @param background The student's academic background section.
 * @param goals      The student's mentorship goals section.
 */
export function checkGenericOutreach(background: string, goals: string): GenericCheckResult {
  const combined = `${background}\n${goals}`.trim();

  // Short requests are handled by the length validators upstream; don't
  // double-punish with a confusing "generic" message on top.
  if (combined.length < MIN_TOTAL_LENGTH) {
    return { allowed: true };
  }

  const templateHits = TEMPLATE_PATTERNS.filter((rx) => rx.test(combined)).length;

  // A couple of stock phrases in an otherwise specific message is normal
  // writing; only near-total template composition is rejected outright.
  if (templateHits >= 3) {
    return {
      allowed: false,
      reason:
        "This reads like a copy-pasted template. Professors only see personalized requests — mention their specific research, a paper, or a method you want to discuss.",
    };
  }

  // Weakly templated but also content-thin: goals that never state what the
  // student actually wants to do.
  if (templateHits >= 1 && goals.trim().length < MIN_GOALS_LENGTH) {
    return {
      allowed: false,
      reason:
        "Your mentorship goals are too brief to send. Describe what you want to work on — a specific question, project, or paper of theirs.",
    };
  }

  // Long text that still names nothing concrete: blast volume with no signal.
  const words = combined.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [];
  const distinctWords = new Set(words).size;
  const specificityHits = SPECIFICITY_PATTERNS.filter((rx) => rx.test(combined)).length;

  if (distinctWords >= MIN_DISTINCT_WORDS && specificityHits === 0) {
    return {
      allowed: false,
      reason:
        "Add specifics so the professor knows you read their work: cite a paper, name a method or course, or describe your own project.",
    };
  }

  return { allowed: true };
}
