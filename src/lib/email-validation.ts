/**
 * Signup email validation — the single implementation.
 *
 * This logic used to exist twice: once in `validators.ts` (which also consulted
 * the 4,744-line US university domain list) and once in `validators-client.ts`
 * (which did not). The two copies shared ~120 lines of duplicated domain sets
 * and had already drifted, so the live client-side rule recognised strictly
 * fewer institutions than the server-side one. Worse, the server copy had zero
 * callers — nothing enforced any of this, and a direct POST to
 * `/api/auth/sign-up/email` bypassed the disposable-domain block entirely.
 *
 * The fix is one core function whose only variable is which academic-domain
 * sets it is given, so the client can stay light while the server is strict,
 * without the rules themselves ever diverging:
 *   - `validators-client.ts` calls it with the small curated sets.
 *   - `validators.ts` calls it with those plus US_UNIVERSITY_DOMAINS.
 *   - `auth.ts` enforces it on account creation (see `assertSignupEmailAllowed`).
 */

import { KNOWN_ACADEMIC_DOMAINS, ACADEMIC_SUFFIXES } from "./academic-data";

export interface EmailValidationResult {
  /** Whether to allow signup to proceed */
  ok: boolean;
  /** Short, user-facing message to display inline */
  message: string;
  /** Visual state for the input field */
  state: "idle" | "valid" | "warn" | "error";
}

/** Accepts `local@domain.tld`, rejecting whitespace and missing parts. */
const FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

/**
 * Validates an email address for signup.
 *
 * Returns:
 *   ok: true   + state "valid"  -> institutional / recognised academic email
 *   ok: true   + state "warn"   -> personal email (allowed but flagged)
 *   ok: false  + state "error"  -> disposable / invalid format -> block signup
 *
 * @param extraAcademicDomains additional domains to treat as institutional.
 *        The server passes the full US university list here; the client omits
 *        it so that list never reaches the browser bundle.
 */
export function validateEmailCore(
  email: unknown,
  role: "student" | "professor",
  extraAcademicDomains?: ReadonlySet<string>,
): EmailValidationResult {
  if (typeof email !== "string") {
    return { ok: false, message: "Please enter a valid email address.", state: "error" };
  }

  const trimmed = email.trim().toLowerCase();

  // 1. Format check
  if (!trimmed || !FORMAT_RE.test(trimmed)) {
    return { ok: false, message: "Please enter a valid email address.", state: "error" };
  }

  const domain = trimmed.split("@")[1] ?? "";

  // 2. Disposable email block
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      message: "Disposable email addresses are not allowed. Please use a real email.",
      state: "error",
    };
  }

  // 3. Institutional / academic email
  const isAcademic =
    KNOWN_ACADEMIC_DOMAINS.has(domain) ||
    (extraAcademicDomains?.has(domain) ?? false) ||
    ACADEMIC_SUFFIXES.some((sfx) => domain.endsWith(sfx));

  if (isAcademic) {
    return { ok: true, message: "Institutional email recognised ✓", state: "valid" };
  }

  // 4. Personal email — block professors, warn students
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

  // 5. Unknown domain — allow but note it is unverified
  return { ok: true, message: "Email looks valid.", state: "valid" };
}

/**
 * True when the address is outright rejected for any role.
 *
 * Account creation cannot know yet whether the person will become a professor
 * (the role is assigned later, during onboarding), so this enforces only the
 * role-independent rules: format and the disposable-domain block. The
 * professor-specific institutional requirement is enforced at the point the
 * role is actually granted, in the profile update route.
 */
export function isSignupEmailAllowed(email: unknown): EmailValidationResult {
  return validateEmailCore(email, "student");
}
