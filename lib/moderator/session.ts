import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SESSION_COOKIE = "sh_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SurveyorRole = "surveyor" | "admin";

export interface SessionPayload extends JWTPayload {
  surveyorId: string;
  role: SurveyorRole;
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_MS / 1000}s`)
    .sign(getSecretKey());
}

export async function decryptSession(
  session: string | undefined
): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.surveyorId === "string" &&
      (payload.role === "surveyor" || payload.role === "admin")
    ) {
      return payload as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSession(surveyorId: string, role: SurveyorRole) {
  const session = await encryptSession({ surveyorId, role });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionCookieValue() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export { SESSION_COOKIE };
