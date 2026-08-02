import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { hasConsoleSession } from "@/lib/console/session";

/** Every console page and action starts here; no session, no page. */
export const requireConsole = cache(async () => {
  if (!(await hasConsoleSession())) {
    redirect("/console");
  }
});
