import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Console sessions — deliberately separate from the surveyor/moderator
 * cookie. A surveyor session must never open the business console, so
 * they share nothing but the signing secret.
 *
 * Two kinds of session live in this one cookie:
 *
 *  - the superadmin, who signs in with CONSOLE_EMAIL / CONSOLE_PASSWORD and
 *    can open everything, including /admin;
 *  - a staff member, identified by `sid`, who can open only the tabs their
 *    roles grant.
 *
 * The staff token also carries `perms`, but ONLY so the proxy can redirect
 * quickly without a database round trip on every navigation. It is a cached
 * hint, never the decision: `requireConsole` re-reads the roles on every
 * request, so a permission taken away in /admin stops working immediately
 * rather than when the token expires.
 */

const CONSOLE_COOKIE = "sh_console";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours — it's the books.

export interface ConsoleTokenClaims {
  scope: "console";
  /** Absent for the superadmin, whose account isn't a database row. */
  sid?: string;
  /** Optimistic hint for the proxy only. See the note above. */
  perms?: string[];
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }
  return new TextEncoder().encode(secret);
}

export async function createConsoleSession(
  actor: { staffId?: string; permissions?: readonly string[] } = {}
) {
  const claims: ConsoleTokenClaims = { scope: "console" };
  if (actor.staffId) {
    claims.sid = actor.staffId;
    claims.perms = [...(actor.permissions ?? [])];
  }

  const token = await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_MS / 1000}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(CONSOLE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    sameSite: "lax",
    path: "/console",
  });
}

/** Cookie-token check for proxy / edge — no next/headers dependency. */
export async function readConsoleToken(
  token: string | undefined
): Promise<ConsoleTokenClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.scope !== "console") return null;
    return {
      scope: "console",
      sid: typeof payload.sid === "string" ? payload.sid : undefined,
      perms: Array.isArray(payload.perms)
        ? payload.perms.filter((p): p is string => typeof p === "string")
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function verifyConsoleToken(
  token: string | undefined
): Promise<boolean> {
  return (await readConsoleToken(token)) !== null;
}

export async function readConsoleSession(): Promise<ConsoleTokenClaims | null> {
  const cookieStore = await cookies();
  return readConsoleToken(cookieStore.get(CONSOLE_COOKIE)?.value);
}

export async function hasConsoleSession(): Promise<boolean> {
  return (await readConsoleSession()) !== null;
}

export async function deleteConsoleSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: CONSOLE_COOKIE, path: "/console" });
}

export { CONSOLE_COOKIE };
