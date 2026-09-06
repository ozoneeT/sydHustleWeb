import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { SITE_URL } from "@/lib/site";

/**
 * Unsubscribe links carry a signed token rather than a plain email
 * address, so nobody can unsubscribe anyone else by editing a URL — and
 * so the link keeps working forever without us storing a token per send.
 *
 * The signature is over the lowercased address with a fixed purpose
 * string mixed in, so a token minted here can't be replayed against any
 * other signed thing that shares SESSION_SECRET.
 */

const PURPOSE = "email-unsubscribe:v1";

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("Missing SESSION_SECRET environment variable.");
  return value;
}

function sign(email: string): string {
  return createHmac("sha256", secret())
    .update(`${PURPOSE}:${email}`)
    .digest("base64url");
}

export function unsubscribeToken(rawEmail: string): string {
  const email = rawEmail.trim().toLowerCase();
  return `${Buffer.from(email, "utf8").toString("base64url")}.${sign(email)}`;
}

export function unsubscribeUrl(rawEmail: string): string {
  return `${SITE_URL}/unsubscribe?token=${unsubscribeToken(rawEmail)}`;
}

/** Returns the address the token was minted for, or null if it wasn't ours. */
export function emailFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let email: string;
  try {
    email = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email.includes("@")) return null;

  const expected = Buffer.from(sign(email));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return null;
  if (!timingSafeEqual(expected, given)) return null;

  return email;
}

/**
 * The headers that make one-click unsubscribe work.
 *
 * Gmail and Yahoo both require these on bulk mail now, and a missing
 * List-Unsubscribe is a fast route to the spam folder — the reader's only
 * remaining way out is the "report spam" button, which is the one signal
 * that actually damages a sending domain.
 */
export function unsubscribeHeaders(rawEmail: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${SITE_URL}/api/email/unsubscribe?token=${unsubscribeToken(
      rawEmail
    )}>, <${unsubscribeUrl(rawEmail)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
