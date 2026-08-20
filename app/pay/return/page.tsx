/**
 * Where a hosted checkout hands the payer back to the app.
 *
 * This page exists because of one specific journey: paying through the
 * OPay app. The app opens Paystack's checkout inside an authentication
 * session, the payer taps Pay with OPay, and iOS switches to the OPay
 * app - which has no handle on that session. When OPay finishes it opens
 * the merchant's return URL in SAFARI, and Safari will not follow a
 * server redirect into a custom scheme like `sydhustle://`. The payer is
 * left looking at a payment page with nowhere to go, money already gone.
 *
 * A page can do what a redirect cannot: try the deep link on load, and
 * failing that, offer a button. A tap is a user gesture, and a user
 * gesture into a custom scheme is honoured by every mobile browser.
 *
 * It could not live in the Supabase function that used to serve this.
 * That gateway forces `content-type: text/plain` and a
 * `default-src 'none'; sandbox` CSP onto every response, so HTML from
 * there is shown to the user as raw source with its scripts inert. Here
 * there is no such constraint.
 *
 * Settlement never happens here. This page moves the payer, nothing else
 * - the webhook and the status poll decide whether money arrived, and
 * they do it whether or not anyone ever sees this screen.
 */

const APP_URL = "sydhustle://payment-return";

/** Only what identifies the transaction, and only from a known list -
 * this string is handed to the OS, so nothing else is carried across. */
function deepLink(params: Record<string, string | string[] | undefined>) {
  const forwarded = new URLSearchParams();
  for (const key of ["reference", "trxref", "status"]) {
    const value = params[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (single) forwarded.set(key, single);
  }
  return forwarded.size ? `${APP_URL}?${forwarded.toString()}` : APP_URL;
}

export default async function PaymentReturn({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const target = deepLink(await searchParams);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        textAlign: "center",
        background: "#0B3D2E",
        color: "#FFFFFF",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
        Payment complete
      </h1>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, opacity: 0.85 }}>
        Taking you back to sydHustle. Your wallet updates on its own - you can
        close this tab either way.
      </p>

      {/* A real link, not a scripted redirect, so it works with JavaScript
          disabled and gives the payer something to tap when the automatic
          attempt below is blocked. */}
      <a
        href={target}
        style={{
          display: "inline-block",
          padding: "15px 28px",
          borderRadius: 999,
          background: "#FFFFFF",
          color: "#0B3D2E",
          fontSize: 16,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Return to sydHustle
      </a>

      {/*
        The automatic attempt. Inside the app's own authentication session
        this fires immediately and the session closes itself, so the payer
        never sees this page at all - which is the common path, and the
        reason this runs before any delay. In Safari after an OPay return
        it may be blocked, and then the button above is the answer.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{location.replace(${JSON.stringify(target)})}catch(e){}`,
        }}
      />
    </main>
  );
}
