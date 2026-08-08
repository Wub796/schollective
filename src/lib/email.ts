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

/** Shared shell so both emails look like they come from the same product. */
function layout(heading: string, body: string, ctaLabel: string, ctaUrl: string): string {
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
        This link expires shortly. If you did not request it, you can ignore this email.
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
