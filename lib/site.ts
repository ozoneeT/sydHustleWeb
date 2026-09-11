export const SITE_URL = "https://sydhustle.com";
export const SITE_NAME = "sydHustle";

export const SITE_DESCRIPTION =
  "Post a Hustle and get it done by someone nearby, or browse skilled Hustlers with real ratings. Money locks in escrow before work starts. Download sydHustle on iOS and Android.";

/**
 * Where the app actually lives.
 *
 * The iOS id and the Android package come from the mobile repo's
 * `app.json` (`ios.appStoreUrl` / `android.playStoreUrl`) — keep them in
 * step with it, since the store listings and the universal links in
 * `associatedDomains` are the same two identities.
 */
export const APP_STORE_URL = "https://apps.apple.com/app/id6799896230";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.sydhustle.app";
export const SUPPORT_EMAIL = "support@sydhustle.com";

/** Brand assets — crawlable public URLs for Google Image / Knowledge Graph */
export const BRAND_ASSETS = {
  icon: {
    path: "/sydhustle-icon.webp",
    width: 510,
    height: 756,
    alt: "sydHustle app icon — geometric teal S mark",
  },
  logo: {
    path: "/sydhustle-logo.webp",
    width: 789,
    height: 166,
    alt: "sydHustle logo: geometric teal S icon with sydHustle wordmark on black",
  },
  logoLight: {
    path: "/sydhustle-logo-light.png",
    width: 1054,
    height: 367,
    alt: "sydHustle logo: geometric teal S icon with sydHustle wordmark on light background",
  },
} as const;

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
