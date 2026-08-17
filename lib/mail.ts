import nodemailer from "nodemailer";

let transporter: any = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    // 465 = implicit SSL. SMTP_SECURE="true" can force SSL on other ports.
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    // SMTP_REQUIRE_TLS="true" forces STARTTLS on port 587 (strict providers).
    requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    // Fail fast instead of hanging a registration request.
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
  return transporter;
}

/**
 * Sends an email. If SMTP is not configured, logs the email to the console
 * so password-reset flows still work in development/sandbox.
 */
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.log(`\n=== [MAIL DEV MODE] To: ${to} | Subject: ${subject} ===\n${html}\n=====================\n`);
    return true;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || "EcomStore <no-reply@example.com>",
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[MAIL ERROR]", err);
    return false;
  }
}

export function buildLink(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

/** Professional OTP verification email with branding, expiry and a security notice. */
export async function sendOtpEmail(
  to: string,
  name: string,
  otp: string,
  expiresInMinutes = 10
): Promise<boolean> {
  const storeName = process.env.NEXT_PUBLIC_APP_NAME || "NovaCart";
  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#6d28d9;padding:24px 32px;">
              <span style="font-size:22px;font-weight:bold;color:#ffffff;">${storeName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;">Verify your email</h2>
              <p style="margin:0 0 20px;color:#52525b;font-size:14px;line-height:1.6;">
                Hi ${name},<br/>
                Use the one-time passcode below to finish creating your ${storeName} account.
                This code expires in <strong>${expiresInMinutes} minutes</strong>.
              </p>
              <div style="background-color:#f4f4f5;border:1px dashed #d4d4d8;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#6d28d9;">${otp}</span>
              </div>
              <p style="margin:0 0 16px;color:#52525b;font-size:13px;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email — your account will not be created.
              </p>
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                Security notice: never share this code with anyone. ${storeName} will never ask for your passcode.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return sendMail(to, `Your ${storeName} verification code`, html);
}
