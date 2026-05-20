import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send a branded HTML email.
 * @param {{ to: string, subject: string, html: string }} options
 */
export default async function sendEmail({ to, subject, html }) {
    await transporter.sendMail({
        from: `"Graphite" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
}

/**
 * Build branded password-reset email HTML.
 */
export function buildResetEmail(name, resetUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#660033 0%,#4d0026 100%);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Graphite</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Professional Networking Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;font-weight:700;">Reset your password</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
              Hi <strong>${name}</strong>, we received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr><td align="center" style="background:#660033;border-radius:8px;">
                <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                  Reset Password
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 12px;color:#9ca3af;font-size:12px;line-height:1.5;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;word-break:break-all;color:#660033;font-size:12px;">${resetUrl}</p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
              If you didn't request this, you can safely ignore this email — your password will remain unchanged.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;">
            <p style="margin:0;color:#d1d5db;font-size:11px;">© ${new Date().getFullYear()} Graphite Professional. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
