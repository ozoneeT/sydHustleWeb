/**
 * What tells iOS that this domain speaks for the sydHustle app.
 *
 * Without it, a payer coming back from the OPay app lands in Safari on
 * `/pay/return` and has to tap a button to get home. With it, iOS
 * recognises the URL as belonging to the app and opens the app directly -
 * the page is still there and still correct, but nobody sees it.
 *
 * A route rather than a file in `public/`, for one unglamorous reason:
 * Apple requires this to be served as `application/json`, and the file
 * has no extension, so a static host guesses `application/octet-stream`
 * and iOS silently ignores it. Nothing about the failure is visible - the
 * links simply keep opening in the browser - which is exactly the kind of
 * bug worth spending a route handler to avoid.
 *
 * `paths` is narrow on purpose. Claiming `/*` would hand every link on
 * this domain to the app, including pages that only exist on the web, and
 * a marketing page that opens a half-installed app is worse than one that
 * opens a browser.
 */

const TEAM_ID = "FRT44S8JNN";
const BUNDLE_ID = "com.sydhustle.app";

export const dynamic = "force-static";

export function GET() {
  return new Response(
    JSON.stringify({
      applinks: {
        apps: [],
        details: [
          {
            appID: `${TEAM_ID}.${BUNDLE_ID}`,
            paths: ["/pay/return", "/pay/return/*"],
          },
        ],
      },
      // Declared but unused today. Both keys are cheap to serve and
      // costly to remember later: shared web credentials and App Clips
      // both read this same file, and adding either one afterwards means
      // waiting on Apple's CDN to re-fetch it.
      webcredentials: { apps: [`${TEAM_ID}.${BUNDLE_ID}`] },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        // Apple caches this aggressively through its own CDN. A day is
        // long enough to be cheap and short enough that a correction is
        // not stuck for a week.
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}
