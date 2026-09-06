import { NextResponse } from "next/server";

import { deleteAdminSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await deleteAdminSession();
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
