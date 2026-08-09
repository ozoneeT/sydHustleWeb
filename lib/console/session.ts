import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Console sessions — deliberately separate from the surveyor/moderator
 * cookie. A surveyor session must never open the business console, so
 * they share nothing but the signing secret.
 */

const CONSOLE_COOKIE = "sh_console";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours — it's the books.

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }
  return new TextEncoder().encode(secret);
}

export async function createConsoleSession() {
  const token = await new SignJWT({ scope: "console" })
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
export async function verifyConsoleToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload.scope === "console";
  } catch {
    return false;
  }
}

export async function hasConsoleSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyConsoleToken(cookieStore.get(CONSOLE_COOKIE)?.value);
}

export async function deleteConsoleSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: CONSOLE_COOKIE, path: "/console" });
}

export { CONSOLE_COOKIE };
