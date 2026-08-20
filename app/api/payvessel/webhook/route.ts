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
 *  - The SIGNATURE is enforced in the edge function, because that is
 *    where the API secret lives and it must not be copied into a second
 *    environment to check it twice. It is the real control: cryptographic,
 *    and the secret never leaves Supabase.
 *  - The source IP is RECORDED here, because this is the only place the
 *    real address is visible - once forwarded, the edge function sees
 *    Vercel. It is deliberately not enforced. Payvessel publishes two
 *    addresses, but a delivery from any other one would be dropped here
 *    and logged to Vercel, which is indistinguishable from Payvessel
 *    never having called at all - and that is precisely the failure that
 *    cost a real deposit. Logging it means an unexpected address is
 *    visible; rejecting on it means silence.
 */

/** Published by Payvessel in their webhook documentation. Used to notice
 * an unexpected source, not to refuse one - see the note above. */
const PAYVESSEL_IPS = new Set(["3.255.23.38", "162.246.254.36"]);

/**
 * The signature header, under whatever name it arrives.
 *
 * Payvessel's own Node example reads `HTTP_PAYVESSEL_HTTP_SIGNATURE` -
 * the PHP `$_SERVER` spelling pasted into JavaScript - so their docs do
 * not settle what actually goes on the wire. This matters more here than
 * upstream: a name this route does not recognise is a delivery dropped
 * before Supabase ever sees it, which looks from there like Payvessel
 * never called. Every plausible spelling is accepted, plus any header
 * naming both the provider and a signature.
 */
function signatureOf(headers: Headers): { name: string; value: string } | null {
  const named = [
    "payvessel-http-signature",
    "http_payvessel_http_signature",
    "payvessel-signature",
    "x-payvessel-signature",
  ];
  for (const name of named) {
    const value = headers.get(name)?.trim();
    if (value) return { name, value };
  }
  for (const [name, value] of headers) {
    const lower = name.toLowerCase();
    if (lower.includes("payvessel") && lower.includes("signature")) {
      const trimmed = value.trim();
      if (trimmed) return { name: lower, value: trimmed };
    }
  }
  return null;
}

export async function POST(request: Request) {
  const signature = signatureOf(request.headers);
  if (!signature) {
    // Logged with the header names, because "which header did they
    // actually send" is the only question this failure raises and there
    // is no second chance to ask it - Payvessel does not replay on
    // demand.
    console.error(
      `[payvessel-proxy] no signature header. headers=${[...request.headers.keys()].join(",")}`,
    );
    return NextResponse.json({ error: "Missing signature." }, { status: 401 });
  }

  // First entry is the originating client; the rest are proxies.
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const source =
    forwarded.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "";

  if (source && !PAYVESSEL_IPS.has(source)) {
    // Recorded, not rejected. If this appears in the logs alongside a
    // valid signature, add the address to the list above.
    console.warn(`[payvessel-proxy] delivery from unlisted address ${source}`);
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
        // Forwarded under the canonical name whatever it arrived as, so
        // the edge function has one thing to look for.
        "payvessel-http-signature": signature.value,
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
