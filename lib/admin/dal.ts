import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { hasAdminSession } from "@/lib/admin/session";

/**
 * Every /admin page and every action that writes a role or appoints a
 * member of staff starts here. There is no permission to check — this area
 * has exactly one occupant.
 */
export const requireAdmin = cache(async () => {
  if (!(await hasAdminSession())) {
    redirect("/admin");
  }
});
