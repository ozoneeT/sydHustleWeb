"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireConsole } from "@/lib/console/dal";

/**
 * Opening a retained identity record.
 *
 * The decryption key is not here and must never be: it lives only in the
 * `disclose-identity` edge function's environment. This action proves
 * the console session, then asks that function to decrypt — which logs
 * the disclosure before it answers.
 */

const revealSchema = z.object({
  profileId: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(10, "Give a case, dispute or request reference.")
    .max(500),
});

export type RevealState = {
  error: string | null;
  /** Present only on the response that revealed it. Never persisted, never
   * cached — close the page and it is gone. */
  record: {
    profileId: string;
    provider: string;
    providerRef: string | null;
    verifiedAt: string | null;
    accountEmail: string | null;
    accountDeletedAt: string | null;
    purgeAfter: string | null;
    payload: unknown;
  } | null;
};

export async function revealIdentityRecord(
  _prev: RevealState,
  formData: FormData
): Promise<RevealState> {
  await requireConsole();

  const parsed = revealSchema.safeParse({
    profileId: formData.get("profileId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Pick an account and give a reason.",
      record: null,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const disclosureSecret = process.env.CONSOLE_DISCLOSURE_SECRET;
  if (!url || !serviceKey || !disclosureSecret) {
    return {
      error:
        "Disclosure is not configured — CONSOLE_DISCLOSURE_SECRET is missing.",
      record: null,
    };
  }

  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/disclose-identity`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "x-console-secret": disclosureSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return { error: "Could not reach the disclosure service.", record: null };
  }

  const body = (await response.json().catch(() => null)) as
    | (RevealState["record"] & { error?: string })
    | null;

  if (!response.ok || !body || body.error) {
    // The status is carried through when the body has nothing useful —
    // a bare "could not open that record" hides whether the refusal came
    // from the function, the gateway, or something in between.
    return {
      error:
        body?.error ?? `Could not open that record (HTTP ${response.status}).`,
      record: null,
    };
  }

  // So the audit trail below the form shows this read immediately — the
  // person disclosing should see their own entry appear.
  revalidatePath("/console/identity");
  return { error: null, record: body };
}
