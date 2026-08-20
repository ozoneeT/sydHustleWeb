/**
 * Android's half of the same promise: this domain vouches for the app,
 * so `/pay/return` opens sydHustle instead of Chrome.
 *
 * The fingerprint is the whole security model. Android only honours the
 * link if the certificate that signed the installed app hashes to one of
 * the values below - which is why it cannot be hardcoded here and read
 * from the environment instead. There are usually TWO worth listing:
 *
 *   * the Play App Signing certificate, which signs what real users
 *     install (Play Console, App integrity, App signing)
 *   * the upload / local build certificate, so an internally distributed
 *     build behaves the same way as production
 *
 * `ANDROID_CERT_FINGERPRINTS` takes them comma-separated, in the
 * `AA:BB:CC:...` form both consoles print. Set it in Vercel; nothing here
 * needs redeploying to add a second one later.
 *
 * With none set this serves an empty `relation` list rather than
 * inventing a value: Android then declines to verify, links open in the
 * browser, and payments still work. An assetlinks file naming the wrong
 * certificate fails exactly as silently but is harder to notice.
 */

const PACKAGE_NAME = "com.sydhustle.app";

function fingerprints(): string[] {
  return (process.env.ANDROID_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^[0-9A-F]{2}(:[0-9A-F]{2}){31}$/.test(value));
}

export const dynamic = "force-dynamic";

export function GET() {
  const certs = fingerprints();
  if (certs.length === 0) {
    console.warn(
      "[assetlinks] ANDROID_CERT_FINGERPRINTS is unset or malformed - Android app links will not verify",
    );
  }

  return new Response(
    JSON.stringify(
      certs.map((sha256) => ({
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: [sha256],
        },
      })),
    ),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
