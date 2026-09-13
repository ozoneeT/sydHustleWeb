"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

/**
 * Logging out, with something to look at while it happens.
 *
 * A native POST to a route handler, so React has no pending state to lend
 * it — same reason the sign-in form tracks its own. Signing out clears a
 * cookie and redirects, which is quick on a desk and not always quick on a
 * phone, and a button that does nothing visible for two seconds is a
 * button people press twice.
 */
export function TeamLogoutButton() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action="/team/logout"
      method="post"
      onSubmit={() => setSubmitting(true)}
    >
      <button
        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-60"
        disabled={submitting}
        type="submit"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        )}
        <span className="hidden sm:inline">
          {submitting ? "Signing out…" : "Log out"}
        </span>
      </button>
    </form>
  );
}
