import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/moderator/session";

// Optimistic check only — verifies the session cookie is present and valid,
// but the real authorization (role-based routing between /dashboard and
// /admin) happens in each page's Data Access Layer (lib/moderator/dal.ts).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(cookie);

  if (!session) {
    return NextResponse.redirect(new URL("/moderator/login", request.url));
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
