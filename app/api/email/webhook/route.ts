import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Resend's delivery events, which is where every number past "sent" on the
 * campaign dashboard comes from.
 *
 * Two of them also write to the suppression list, and that is the part
 * that matters most: a hard bounce or a spam complaint must never be
 * mailed again, and waiting for a human to notice is how a sending domain
 * gets burned. Those two suppress automatically, here, within seconds.
 *
 * Signed with Svix (Resend's webhook provider). Verified by hand rather
 * than with the `svix` package — it is one HMAC over
 * `${id}.${timestamp}.${body}`, and a dependency for that is not worth the
 * bundle. The signing secret is `whsec_` + base64, and the base64 part is
 * the key.
 */

const TOLERANCE_SECONDS = 5 * 60;

/** Every id in a `v1,<sig>` list is checked, because Svix rotates keys by
 * sending two signatures during the overlap. */
function signatureMatches(
  secret: string,
  id: string,
  timestamp: string,
  body: string,
  header: string
): boolean {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);

  return header
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter(Boolean)
    .some((candidate) => {
      const given = Buffer.from(candidate);
      return (
        given.length === expectedBuf.length && timingSafeEqual(given, expectedBuf)
      );
    });
}

/** What each Resend event does to a recipient row. */
const STATUS_BY_EVENT: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "sent",
};

/** Statuses a later event must not walk backwards over. */
const RANK: Record<string, number> = {
  pending: 0,
  failed: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  bounced: 6,
  complained: 7,
};

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Tracking is optional. Without a secret we cannot trust anything that
    // arrives here, so nothing is written.
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const body = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");

  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "unsigned" }, { status: 400 });
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) {
    return NextResponse.json({ error: "stale" }, { status: 400 });
  }

  if (!signatureMatches(secret, id, timestamp, body, signature)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: {
      email_id?: string;
      to?: string[];
      /** Resend classifies bounces; only a permanent one is a dead address. */
      bounce?: { type?: string; subType?: string };
    };
  };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }

  const type = event.type ?? "";
  const status = STATUS_BY_EVENT[type];
  const emailId = event.data?.email_id;
  if (!status || !emailId) {
    // An event we don't track is not an error — answering 2xx stops Svix
    // retrying it forever.
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerSupabaseClient();

  const { data: row } = await supabase
    .from("email_campaign_recipients")
    .select("id, email, status, campaign_id")
    .eq("resend_id", emailId)
    .maybeSingle();

  if (!row) return NextResponse.json({ ok: true });

  if ((RANK[status] ?? 0) > (RANK[row.status] ?? 0)) {
    await supabase
      .from("email_campaign_recipients")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  // A complaint always suppresses. A bounce only does when it's permanent
  // — a full mailbox or a mail server having a bad afternoon is a
  // "Transient" bounce, and striking that address off for good would lose
  // a real reader over a temporary problem.
  const transient = event.data?.bounce?.type?.toLowerCase() === "transient";
  const suppress =
    type === "email.complained" || (type === "email.bounced" && !transient);

  if (suppress) {
    await supabase.from("email_unsubscribes").upsert(
      {
        email: row.email,
        reason: type === "email.bounced" ? "bounced" : "complained",
        campaign_id: row.campaign_id,
      },
      { onConflict: "email" }
    );
  }

  return NextResponse.json({ ok: true });
}
