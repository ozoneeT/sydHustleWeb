import { SITE_URL } from "@/lib/site";

/**
 * The sydHustle marketing email template.
 *
 * One template, filled in by slots — not an HTML box the operator types
 * into. That is the point of "standardized": every campaign that leaves
 * here has the same header, the same button, the same footer, the same
 * unsubscribe line, and none of them can be broken by a stray tag pasted
 * out of a document.
 *
 * Written the way email HTML has to be written rather than the way the
 * rest of this codebase is: tables for layout, inline styles, a 600px
 * body, no flexbox, no external CSS. Outlook renders on Word's engine and
 * ignores nearly everything else. There is deliberately no dark-mode
 * variant — clients invert it themselves, inconsistently, and a light
 * email with real contrast survives that better than a dark one does.
 *
 * Deliberately not `server-only`: it is a pure function over public values,
 * so the composer renders the live preview with the exact code that will
 * render the real thing. A preview that goes through a second
 * implementation is a preview of something else.
 */

export interface CampaignContent {
  subject: string;
  /** The grey line after the subject in an inbox list. */
  preheader?: string | null;
  heading?: string | null;
  /** Plain text. Blank lines separate paragraphs; no HTML. */
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  /** A small closing note under the body — signature, PS, housekeeping. */
  footerNote?: string | null;
  /** Custom logo width in pixels. Default is 150. */
  logoSize?: number | null;
  /** Custom banner image width in pixels. Default is 600. */
  bannerSize?: number | null;
}

export interface RenderOptions extends CampaignContent {
  /** Personalisation. Falls back to "there" so no email says "Hi ,". */
  recipientName?: string | null;
  /** Where the unsubscribe link points. Omitted only for test sends. */
  unsubscribeUrl?: string | null;
  /** True for the composer preview, which has no real recipient. */
  preview?: boolean;
}

const BRAND = {
  ink: "#0b1120",
  accent: "#0d9488",
  accentDark: "#0f766e",
  text: "#1f2937",
  muted: "#6b7280",
  hairline: "#e5e7eb",
  page: "#f4f5f7",
  card: "#ffffff",
} as const;

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** The postal address every commercial email is required to carry. */
export const POSTAL_ADDRESS =
  process.env.EMAIL_POSTAL_ADDRESS ?? "sydHustle, Ado-Ekiti, Ekiti State, Nigeria";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** First name where we have one, so "Hi Adebimpe" doesn't read as "Hi Adebimpe Obaleye". */
export function firstName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "there";
  const first = trimmed.split(/\s+/)[0];
  // ALL-CAPS entries are common in the survey data and shout in a greeting.
  if (first === first.toUpperCase() && first.length > 2) {
    return first.charAt(0) + first.slice(1).toLowerCase();
  }
  return first;
}

/**
 * `{{name}}` and `{{first_name}}` in any slot, so a campaign can address
 * people by name without the operator writing template syntax anywhere
 * but the one place they mean it.
 */
export function fillTokens(value: string, name: string | null | undefined): string {
  const full = (name ?? "").trim();
  return value
    .replace(/\{\{\s*first_?name\s*\}\}/gi, firstName(name))
    .replace(/\{\{\s*name\s*\}\}/gi, full || "there");
}

/** Blank-line-separated plain text into paragraphs, escaped. */
function paragraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      // Standalone image: ![alt](url)
      const imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        return `<img src="${escapeHtml(imgMatch[2])}" alt="${escapeHtml(imgMatch[1])}" style="display:block;width:100%;max-width:600px;height:auto;border:0;margin:24px 0;border-radius:12px;" />`;
      }
      
      // Standalone button: [button:Label](url)
      const btnMatch = block.match(/^\[button:\s*([^\]]+)\]\(([^)]+)\)$/i);
      if (btnMatch) {
        return button(btnMatch[1], btnMatch[2]);
      }
      
      // Regular text block
      let html = escapeHtml(block).replace(/\n/g, "<br />");
      
      // Inline links: [text](url)
      html = html.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        return `<a href="${url}" style="color:${BRAND.accentDark};text-decoration:underline;">${text}</a>`;
      });
      
      return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:26px;color:${BRAND.text};">${html}</p>`;
    })
    .join("");
}

/**
 * Bulletproof-ish button. A table rather than a styled anchor, because
 * Outlook drops padding on inline elements and the button collapses to a
 * bare link exactly where it matters most.
 */
function button(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td align="center" bgcolor="${BRAND.accent}" style="border-radius:999px;">
          <a href="${escapeHtml(url)}"
             style="display:inline-block;padding:14px 32px;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/**
 * Hidden preheader. The `&nbsp;&zwnj;` padding stops Gmail pulling the
 * first line of the body in after it and showing both.
 */
function preheaderBlock(text: string): string {
  return `<div style="display:none;font-size:1px;color:${BRAND.page};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
    text
  )}${"&nbsp;&zwnj;".repeat(60)}</div>`;
}

export function renderCampaignHtml(options: RenderOptions): string {
  const name = options.recipientName;
  const heading = options.heading ? fillTokens(options.heading, name) : "";
  const body = fillTokens(options.body, name);
  const preheader = options.preheader ? fillTokens(options.preheader, name) : "";
  const footerNote = options.footerNote ? fillTokens(options.footerNote, name) : "";
  const unsubscribeUrl = options.unsubscribeUrl ?? `${SITE_URL}/unsubscribe`;

  const logoWidth = options.logoSize ?? 150;
  const bannerWidth = options.bannerSize ?? 600;

  const hero = options.imageUrl
    ? `<tr><td style="padding:0;">
         <img src="${escapeHtml(options.imageUrl)}" alt="" width="${bannerWidth}"
              style="display:block;width:100%;max-width:${bannerWidth}px;height:auto;border:0;" />
       </td></tr>`
    : "";

  const cta =
    options.ctaLabel && options.ctaUrl ? button(options.ctaLabel, options.ctaUrl) : "";

  const note = footerNote
    ? `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid ${BRAND.hairline};font-family:${FONT};font-size:14px;line-height:22px;color:${BRAND.muted};">${escapeHtml(
        footerNote
      ).replace(/\n/g, "<br />")}</p>`
    : "";

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(options.subject)}</title>
<!--[if mso]><style>body,table,td,a{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.page};">
${preheader ? preheaderBlock(preheader) : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:100%;max-width:600px;background-color:${BRAND.card};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.hairline};">

        <tr>
          <td align="left" bgcolor="${BRAND.ink}" style="background-color:${BRAND.ink};padding:24px 32px;">
            <a href="${SITE_URL}" style="text-decoration:none;">
              <img src="${SITE_URL}/sydhustle-logo-dark.png" alt="sydHustle"
                   width="${logoWidth}"
                   style="display:block;width:${logoWidth}px;height:auto;border:0;" />
            </a>
          </td>
        </tr>

        ${hero}

        <tr>
          <td style="padding:32px;">
            ${
              heading
                ? `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:26px;line-height:34px;font-weight:800;color:${BRAND.ink};">${escapeHtml(
                    heading
                  )}</h1>`
                : ""
            }
            ${paragraphs(body)}
            ${cta}
            ${note}
          </td>
        </tr>

        <tr>
          <td bgcolor="#fafafa" style="background-color:#fafafa;padding:24px 32px;border-top:1px solid ${BRAND.hairline};">
            <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:20px;color:${BRAND.muted};">
              You're getting this because you took the sydHustle survey or joined the waitlist.
            </p>
            <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:20px;color:${BRAND.muted};">
              <a href="${escapeHtml(unsubscribeUrl)}" style="color:${BRAND.accentDark};text-decoration:underline;">Unsubscribe</a>
              &nbsp;·&nbsp;
              <a href="${SITE_URL}/privacy" style="color:${BRAND.accentDark};text-decoration:underline;">Privacy</a>
              &nbsp;·&nbsp;
              <a href="${SITE_URL}/support" style="color:${BRAND.accentDark};text-decoration:underline;">Support</a>
            </p>
            <p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:#9ca3af;">
              ${escapeHtml(POSTAL_ADDRESS)}
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * The plain-text alternative. Not optional: a multipart message lands
 * better than an HTML-only one, and some people genuinely read this part.
 */
export function renderCampaignText(options: RenderOptions): string {
  const name = options.recipientName;
  const unsubscribeUrl = options.unsubscribeUrl ?? `${SITE_URL}/unsubscribe`;
  const lines: string[] = [];

  if (options.heading) lines.push(fillTokens(options.heading, name), "");
  
  const rawBody = fillTokens(options.body, name).trim();
  const textBody = rawBody
    .replace(/^!\[([^\]]*)\]\(([^)]+)\)$/gm, '[Image: $1] $2')
    .replace(/^\[button:\s*([^\]]+)\]\(([^)]+)\)$/gmi, '$1: $2')
    .replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  lines.push(textBody, "");

  if (options.ctaLabel && options.ctaUrl) {
    lines.push(`${fillTokens(options.ctaLabel, name)}: ${options.ctaUrl}`, "");
  }
  if (options.footerNote) lines.push(fillTokens(options.footerNote, name), "");

  lines.push(
    "—",
    "You're getting this because you took the sydHustle survey or joined the waitlist.",
    `Unsubscribe: ${unsubscribeUrl}`,
    POSTAL_ADDRESS
  );

  return lines.join("\n");
}

/**
 * Ready-made campaigns for the things we actually send. Presets, not
 * limits — every field stays editable once one is loaded.
 */
export interface CampaignPreset {
  id: string;
  label: string;
  description: string;
  content: CampaignContent & { name: string };
}

export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: "prelaunch-invite",
    label: "Pre-launch invite",
    description: "Ask a survey respondent to create their account before launch.",
    content: {
      name: "Pre-launch sign-up invite",
      subject: "Your sydHustle account is ready to claim",
      preheader: "You helped shape it. Now come and take your spot first.",
      heading: "{{first_name}}, sydHustle is nearly here",
      body: `Hi {{first_name}},

A while back you answered our survey about earning and getting things done around campus. We read every single answer — 361 of them — and built sydHustle around what you told us.

We're opening early access to the people who helped shape it, and that means you. Claim your spot now and you'll be set up before the crowd arrives.

Takes about a minute. No payment, nothing to install yet — just your name on the list.`,
      ctaLabel: "Claim my early spot",
      ctaUrl: "https://sydhustle.com",
      footerNote: "Questions? Just reply to this email — it reaches a real person.",
      imageUrl: null,
      logoSize: null,
      bannerSize: null,
    },
  },
  {
    id: "launch-day",
    label: "Launch announcement",
    description: "The app is live — go and download it.",
    content: {
      name: "Launch day announcement",
      subject: "sydHustle is live",
      preheader: "The app you helped us build is out. Here's your link.",
      heading: "It's live, {{first_name}}",
      body: `sydHustle is officially out.

Find a Hustle near you, or post one and let someone nearby take it on. Payments are held safely until the work is done, so nobody has to trust a stranger with their money.

You told us what would make this worth using. This is it.`,
      ctaLabel: "Get the app",
      ctaUrl: "https://sydhustle.com",
      footerNote: null,
      imageUrl: null,
      logoSize: null,
      bannerSize: null,
    },
  },
  {
    id: "marketing-team",
    label: "Marketing team welcome",
    description: "For the people who said yes to joining the marketing team.",
    content: {
      name: "Marketing team welcome",
      subject: "You said you'd help us spread the word — here's how",
      preheader: "A short brief for the sydHustle campus team.",
      heading: "Welcome to the sydHustle campus team",
      body: `Hi {{first_name}},

When you took our survey you said you'd be up for helping spread the word about sydHustle on your campus. We're taking you up on it.

Here's what that looks like: a WhatsApp group for the team, some ready-made posts and flyers you can share, and a referral code that tracks the people who sign up through you.

Reply to this email and we'll add you to the group.`,
      ctaLabel: "Read the brief",
      ctaUrl: "https://sydhustle.com",
      footerNote: null,
      imageUrl: null,
      logoSize: null,
      bannerSize: null,
    },
  },
  {
    id: "blank",
    label: "Blank",
    description: "Start from nothing, in the standard layout.",
    content: {
      name: "",
      subject: "",
      preheader: "",
      heading: "",
      body: "",
      ctaLabel: "",
      ctaUrl: "",
      footerNote: "",
      imageUrl: null,
      logoSize: null,
      bannerSize: null,
    },
  },
];
