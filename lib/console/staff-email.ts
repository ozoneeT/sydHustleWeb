import "server-only";

import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/template";
import { SITE_URL } from "@/lib/site";

/**
 * The invitation email.
 *
 * Transactional, not marketing: no unsubscribe link, no suppression-list
 * check, and it goes out through the plain `sendEmail` wrapper rather than
 * the campaign machinery. Someone being given access to the panic desk
 * should not be able to have opted out of being told about it.
 */

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export async function sendInviteEmail({
  to,
  name,
  token,
  roleNames,
  tabLabels,
}: {
  to: string;
  name: string;
  token: string;
  roleNames: string[];
  tabLabels: string[];
}): Promise<{ success: boolean; error?: string }> {
  const url = `${SITE_URL}/console/accept?token=${token}`;
  const first = name.trim().split(/\s+/)[0] || "there";

  const access =
    roleNames.length > 0
      ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:14px;color:#6b7280;">
           <strong style="color:#1f2937;">Your role:</strong> ${escapeHtml(
             roleNames.join(", ")
           )}
         </p>
         ${
           tabLabels.length > 0
             ? `<p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#6b7280;">${escapeHtml(
                 tabLabels.join(" · ")
               )}</p>`
             : ""
         }`
      : `<p style="margin:0;font-family:${FONT};font-size:14px;color:#6b7280;">Your access will be set up shortly.</p>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>Your sydHustle console invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
           style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td align="left" bgcolor="#0b1120" style="background-color:#0b1120;padding:24px 32px;">
          <img src="${SITE_URL}/sydhustle-logo-dark.png" alt="sydHustle" width="150" height="52"
               style="display:block;width:150px;height:auto;border:0;" />
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-family:${FONT};font-size:24px;line-height:32px;font-weight:800;color:#0b1120;">
            You've been given access to the sydHustle console
          </h1>
          <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:26px;color:#1f2937;">
            Hi ${escapeHtml(first)}, you've been invited to work in the sydHustle
            operations console. Set a password and you're in.
          </p>

          <div style="margin:0 0 24px;padding:16px;border-radius:12px;background:#f9fafb;border:1px solid #e5e7eb;">
            ${access}
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr>
              <td align="center" bgcolor="#0d9488" style="border-radius:999px;">
                <a href="${url}"
                   style="display:inline-block;padding:14px 32px;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">
                  Set my password
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:20px;color:#6b7280;">
            This link works once and expires in 7 days. If the button doesn't
            open, paste this into your browser:
          </p>
          <p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:#6b7280;word-break:break-all;">
            ${escapeHtml(url)}
          </p>
        </td>
      </tr>
      <tr>
        <td bgcolor="#fafafa" style="background-color:#fafafa;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:#9ca3af;">
            If you weren't expecting this, ignore it — the link does nothing
            until someone sets a password, and you can tell us at
            ${SITE_URL}/support.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `Hi ${first},`,
    "",
    "You've been invited to work in the sydHustle operations console.",
    roleNames.length > 0 ? `Your role: ${roleNames.join(", ")}` : "",
    tabLabels.length > 0 ? tabLabels.join(" · ") : "",
    "",
    "Set your password here (works once, expires in 7 days):",
    url,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendEmail({
    to,
    subject: "Your sydHustle console invitation",
    html,
    text,
  });

  return result;
}
