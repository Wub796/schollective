/**
 * Transactional email over the Resend REST API.
 *
 * Uses `fetch` rather than an SDK so it runs unchanged inside a Cloudflare
 * Worker. Set RESEND_API_KEY and EMAIL_FROM to enable delivery; without them
 * the message is logged instead of sent, so local development still works and
 * a missing key never breaks a signup.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn(
      `[email] Not configured — set RESEND_API_KEY and EMAIL_FROM to deliver mail. ` +
        `Would have sent "${subject}" to ${to}.`,
    );
    console.warn(`[email] Body:\n${text}`);
    return false;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, text }),
    });

    if (!response.ok) {
      // Resend explains rejections (unverified domain, invalid recipient) in the body.
      console.error(`[email] Resend returned ${response.status}:`, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Send failed:", error);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Shared shell so every email looks like it comes from the same product.
 *
 * `footer` is overridable because the default line ("this link expires shortly")
 * is false for an account-disabled notice: that link is good for the whole grace
 * window, and telling someone their only way back has expired would be a lie
 * that costs them their account.
 */
function layout(
  heading: string,
  body: string,
  ctaLabel: string,
  ctaUrl: string,
  footer = "This link expires shortly. If you did not request it, you can ignore this email.",
): string {
  const safeUrl = escapeHtml(ctaUrl);
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#fdfdfd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a">
    <table role="presentation" style="max-width:480px;margin:0 auto;border-collapse:collapse">
      <tr><td style="padding-bottom:28px;font-size:16px;font-weight:800;letter-spacing:-0.02em">Schollective</td></tr>
      <tr><td style="padding-bottom:12px;font-size:24px;font-weight:800;letter-spacing:-0.03em">${escapeHtml(heading)}</td></tr>
      <tr><td style="padding-bottom:28px;font-size:14px;line-height:1.7;color:#475569">${escapeHtml(body)}</td></tr>
      <tr><td style="padding-bottom:28px">
        <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;border-radius:100px;background:#4f46e5;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none">${escapeHtml(ctaLabel)}</a>
      </td></tr>
      <tr><td style="font-size:12px;line-height:1.7;color:#94a3b8">
        If the button does not work, copy this link into your browser:<br />
        <span style="word-break:break-all">${safeUrl}</span>
      </td></tr>
      <tr><td style="padding-top:28px;font-size:11px;color:#cbd5e1">
        ${escapeHtml(footer)}
      </td></tr>
    </table>
  </body>
</html>`;
}

export function passwordResetEmail(url: string): Omit<SendEmailInput, "to"> {
  return {
    subject: "Reset your Schollective password",
    html: layout(
      "Reset your password",
      "We received a request to reset the password on your Schollective account. Choose a new one using the link below.",
      "Reset password",
      url,
    ),
    text: `Reset your Schollective password:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
  };
}

/**
 * Sent when someone disables their own account. It is the record of the promise
 * the grace window makes, so it names the date the data goes and the one thing
 * that stops it.
 */
export function accountDisabledEmail({
  restoreUrl,
  purgeDateLabel,
  graceDays,
}: {
  restoreUrl: string;
  purgeDateLabel: string;
  graceDays: number;
}): Omit<SendEmailInput, "to"> {
  return {
    subject: "Your Schollective account is disabled — here is how to get it back",
    html: layout(
      "Your account is disabled",
      `Nothing has been deleted yet. Your profile is hidden from the directory and your mentorship threads are closed, but you can bring all of it back by signing in and choosing Restore my account — any time in the next ${graceDays} days.`,
      "Restore my account",
      restoreUrl,
      `If you do nothing, this account and its data are permanently deleted after ${purgeDateLabel}. ` +
        "This is the only reminder we send. If you did not disable this account, sign in and restore it now.",
    ),
    text:
      `Your Schollective account is disabled.\n\n` +
      `Nothing has been deleted yet: your profile is hidden from the directory and your mentorship threads are closed. ` +
      `You can bring all of it back by signing in and choosing "Restore my account" any time in the next ${graceDays} days:\n\n` +
      `${restoreUrl}\n\n` +
      `If you do nothing, this account and its data are permanently deleted after ${purgeDateLabel}. ` +
      `This is the only reminder we send.`,
  };
}

/**
 * Tells the team that a beta report landed.
 *
 * Deliberately a notification and not the transport: the report is stored in
 * `feedback_reports` (db/migrations/0013) before this is attempted, so a
 * rejected address or a missing key costs a heads-up and nothing else. The
 * footer says so, because the cheapest way to lose a report is for the reader
 * to believe this email *is* the report and delete it.
 */
export function feedbackReportEmail({
  categoryLabel,
  reporterLabel,
  message,
  pagePath,
  adminUrl,
}: {
  categoryLabel: string;
  reporterLabel: string;
  message: string;
  pagePath: string | null;
  adminUrl: string;
}): Omit<SendEmailInput, "to"> {
  const where = pagePath ? `from ${pagePath}` : "without naming a page";

  return {
    subject: `[Beta feedback] ${categoryLabel} from ${reporterLabel}`,
    html: layout(
      `New ${categoryLabel.toLowerCase()}`,
      `${reporterLabel} wrote this ${where}: ${message}`,
      "Open the feedback queue",
      adminUrl,
      "Sent by the beta feedback form. The report itself is stored in the admin queue whether or not this email arrives, and this link does not expire.",
    ),
    text:
      `New ${categoryLabel.toLowerCase()} from ${reporterLabel} ${where}:\n\n` +
      `${message}\n\n` +
      `The report is stored in the admin queue: ${adminUrl}`,
  };
}

export function verificationEmail(url: string): Omit<SendEmailInput, "to"> {
  return {
    subject: "Confirm your Schollective email",
    html: layout(
      "Confirm your email",
      "Confirm this address to finish setting up your Schollective account.",
      "Confirm email",
      url,
    ),
    text: `Confirm your Schollective email address:\n\n${url}`,
  };
}
