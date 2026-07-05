import "server-only";

import { resolveMx } from "node:dns/promises";

/**
 * Free, zero-third-party sanity check: confirms the email's domain actually
 * has mail servers configured. Catches typos and made-up domains
 * (e.g. "gmial.com") but can't confirm the mailbox itself exists or that the
 * submitter owns it — that's what the emailed verification code is for.
 *
 * Fails open (returns true) on lookup errors that aren't a clear "this
 * domain doesn't exist" (e.g. transient DNS timeouts), so our own
 * infrastructure hiccups never block a legitimate submission.
 */
export async function hasValidMxRecord(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain) return false;

  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return false;
    }
    console.error("MX lookup failed unexpectedly for domain:", domain, err);
    return true;
  }
}
