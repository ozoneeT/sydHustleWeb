import { NextResponse } from "next/server";

/**
 * Payvessel's webhook, received on our own domain and forwarded to the
 * edge function that settles it.
 *
 * This exists for one reason: Payvessel requires the webhook URL to be on
 * the domain registered as the business website, and rejects a
 * `*.supabase.co` address. So the payment logic stays where it belongs -
 * next to the service-role key, in `payvessel-webhook` - and this route is
 * a pipe.
 *
 * Being a pipe is the whole design constraint. The signature Payvessel
 * sends is an HMAC over the RAW request body, so this must forward the
 * exact bytes it received and never parse, re-serialise, or "tidy" them.
 * Reading the body as text and posting that string is deliberate; calling
 * `request.json()` here would break every signature.
 *
 * The security split, which is worth stating because it is not obvious:
 *  - The IP allowlist is enforced HERE, because this is the only place
 *    the real source address is visible. Once the request is forwarded,
 *    the edge function sees Vercel, not Payvessel.
 *  - The SIGNATURE is enforced in the edge function, because that is
 *    where the API secret lives and it must not be copied into a second
 *    environment to check it twice.
 *
 * The signature is the real control: it is cryptographic, and the secret
 * never leaves Supabase. The IP check is defence in depth on top.
 */

/** Published by Payvessel in their webhook documentation. */
const PAYVESSEL_IPS = new Set(["3.255.23.38", "162.246.254.36"]);

export async function POST(request: Request) {
  const signature = request.headers.get("payvessel-http-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 401 });
  }

  // First entry is the originating client; the rest are proxies.
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const source =
    forwarded.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "";

  if (source && !PAYVESSEL_IPS.has(source)) {
    console.error(`[payvessel-proxy] rejected delivery from ${source}`);
    return NextResponse.json({ error: "Unrecognised source." }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("[payvessel-proxy] NEXT_PUBLIC_SUPABASE_URL is not set");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  // Raw, exactly as received. See the note above.
  const rawBody = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${supabaseUrl}/functions/v1/payvessel-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "payvessel-http-signature": signature,
      },
      body: rawBody,
    });
  } catch (error) {
    // A failure to reach Supabase must NOT read as "handled" to Payvessel,
    // or the delivery is never retried and the deposit never settles.
    console.error("[payvessel-proxy] upstream unreachable:", error);
    return NextResponse.json({ error: "Upstream unreachable." }, { status: 502 });
  }

  // The upstream status is passed through rather than flattened to 200:
  // Payvessel decides whether to retry from it, and a settle failure has
  // to show in their dashboard as failed rather than disappearing here.
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
