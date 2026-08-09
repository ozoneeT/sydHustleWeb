import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CONSOLE_COOKIE,
  verifyConsoleToken,
} from "@/lib/console/session";
import { decryptSession, SESSION_COOKIE } from "@/lib/moderator/session";

// Optimistic check only — verifies the session cookie is present and valid,
// but the real authorization (role-based routing between /dashboard and
// /admin) happens in each page's Data Access Layer (lib/moderator/dal.ts).
// Console panel routes are gated here so the panel layout can stay sync and
// navigations can show loading.tsx immediately.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/console/")) {
    // Login POST handler stays public; everything else under /console/* needs
    // an operator session.
    if (pathname !== "/console/login") {
      const token = request.cookies.get(CONSOLE_COOKIE)?.value;
      if (!(await verifyConsoleToken(token))) {
        return NextResponse.redirect(new URL("/console", request.url));
      }
    }
    return NextResponse.next();
  }

  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(cookie);

  if (!session) {
    return NextResponse.redirect(new URL("/moderator", request.url));
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/console/:path*"],
};
