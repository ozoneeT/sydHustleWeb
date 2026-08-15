import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Receipt stamp verification.
 *
 * Every sydHustle receipt carries an HMAC over its own material values,
 * printed as a 16 character code and as a QR. This is the only place that
 * check can happen: the signing key lives inside the database, readable
 * only by a `security definer` function, so neither the app nor a browser
 * can verify a stamp and neither should be able to.
 *
 * PUBLIC on purpose. The receipt tells its holder to check it at
 * sydhustle.com/verify, and a landlord or a client asked to trust a
 * payment should not need an account with us to do it. Publishing the
 * ANSWER is not publishing the key: a caller learns whether one specific
 * receipt is ours, and nothing that helps them forge another.
 *
 * What keeps that from being a free oracle is downstream, in
 * `verify_receipt_stamp`: every attempt is written to an audit table that
 * doubles as a per-client rate limiter. Twenty a minute is generous for a
 * human holding a piece of paper and nowhere near enough to search a 128
 * bit tag.
 *
 * A route handler rather than a server action because the client posts to
 * it directly with the token it read out of `location.hash`. Fragments
 * never reach a server, which is exactly why the token is carried in one:
 * the signed payload holds a person's name and a Hustle title, and this
 * way neither lands in an access log, a Referer header, or an analytics
 * pipeline.
 */

/** The scan path: the whole token, as `v1.<payload>.<mac>`. */
const TokenBody = z.object({
  token: z
    .string()
    .trim()
    .min(8)
    // Long enough to hold a payload, short enough that nobody is posting a
    // novel. The real check is the signature.
    .max(4096),
});

/** The typed path: what a person can read off the sheet. */
const CodeBody = z.object({
  reference: z.string().trim().min(4).max(64),
  code: z.string().trim().min(4).max(64),
});

const Body = z.union([TokenBody, CodeBody]);

/**
 * One client, without keeping their address.
 *
 * The rate limiter needs to tell callers apart; the audit table does not
 * need to become a record of who looked at whose receipt. So the address is
 * hashed here and only the digest crosses into the database.
 *
 * `VERIFY_IP_PEPPER` is what stops that digest being reversible: there are
 * only four billion IPv4 addresses, so an unpeppered SHA-256 of one is a
 * few minutes of enumeration for anyone holding a copy of the table. A
 * missing pepper is therefore a misconfiguration, but NOT a reason to send
 * no hash at all: `stamp_check_throttled` cannot limit a caller it cannot
 * distinguish, so dropping the hash would quietly turn the rate limit off
 * on the one endpoint that most needs it. It degrades to a weaker digest
 * and complains, rather than failing open.
 */
function clientHash(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const address = forwarded.split(",")[0]?.trim();
  if (!address) return null;

  const pepper = process.env.VERIFY_IP_PEPPER;
  if (!pepper) {
    console.warn(
      "[verify] VERIFY_IP_PEPPER is not set; client digests are reversible",
    );
  }

  return createHash("sha256")
    .update(`${address}:${pepper ?? "unpeppered"}`)
    .digest("hex");
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ verdict: "malformed" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ verdict: "malformed" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const hash = clientHash(request);

  const { data, error } =
    "token" in parsed.data
      ? await supabase.rpc("verify_receipt_stamp", {
          p_token: parsed.data.token,
          p_client_hash: hash,
        })
      : await supabase.rpc("verify_receipt_code", {
          p_reference: parsed.data.reference,
          p_code: parsed.data.code,
          p_client_hash: hash,
        });

  if (error) {
    // Deliberately vague to the caller, specific in our logs. A verifier
    // that explains its own internals is a verifier being read by someone
    // who wants to get past it.
    console.error("[verify] rpc failed", error);
    return NextResponse.json({ verdict: "unavailable" }, { status: 502 });
  }

  const verdict =
    typeof data === "object" && data !== null && "verdict" in data
      ? (data as { verdict: unknown }).verdict
      : null;

  // 429 so a scanner or a script sees the throttle for what it is, rather
  // than reading "not valid" off a rate limited response.
  return NextResponse.json(data, {
    status: verdict === "rate_limited" ? 429 : 200,
  });
}
