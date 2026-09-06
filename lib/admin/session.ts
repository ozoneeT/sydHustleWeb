import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Sessions for /admin — where roles are written and staff are appointed.
 *
 * Same credentials as the console (CONSOLE_EMAIL / CONSOLE_PASSWORD), but a
 * separate cookie scoped to /admin, and deliberately shorter-lived. The
 * console session a superadmin leaves open all day can't be walked up to
 * and used to grant somebody the panic desk; that needs signing in again,
 * here.
 *
 * Staff can never reach this area: it is gated on the environment password,
 * which is not stored in any table and cannot be granted by any role.
 */

const ADMIN_COOKIE = "sh_admin";
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours.

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession() {
  const token = await new SignJWT({ scope: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_MS / 1000}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    sameSite: "lax",
    path: "/admin",
  });
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload.scope === "admin";
  } catch {
    return false;
  }
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: ADMIN_COOKIE, path: "/admin" });
}

export { ADMIN_COOKIE };
