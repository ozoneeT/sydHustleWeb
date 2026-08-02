"use client";

import { useEffect } from "react";
import { unstable_isUnrecognizedActionError } from "next/navigation";

const RELOAD_GUARD = "sydhustle:stale-action-reload";

function looksLikeStaleServerAction(error: unknown): boolean {
  if (unstable_isUnrecognizedActionError(error)) return true;
  if (!(error instanceof Error)) return false;
  return (
    error.name === "UnrecognizedActionError" ||
    error.message.includes("was not found on the server") ||
    error.message.includes("failed-to-find-server-action")
  );
}

function reloadOnceForStaleDeploy() {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD) === "1") return;
    sessionStorage.setItem(RELOAD_GUARD, "1");
  } catch {
    // sessionStorage can be blocked; still attempt one reload.
  }
  window.location.reload();
}

/**
 * Free alternative to Vercel Skew Protection: when a tab still has JS from an
 * older deploy, Server Action IDs no longer match. Reload once to pick up the
 * current build instead of leaving the user on a dead error page.
 */
export function StaleDeploymentReloader() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(RELOAD_GUARD);
    } catch {
      // ignore
    }

    const onError = (event: ErrorEvent) => {
      if (looksLikeStaleServerAction(event.error)) {
        event.preventDefault();
        reloadOnceForStaleDeploy();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (looksLikeStaleServerAction(event.reason)) {
        event.preventDefault();
        reloadOnceForStaleDeploy();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
