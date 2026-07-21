export const SITE_URL = "https://sydhustle.com";
export const SITE_NAME = "sydHustle";

export const SITE_DESCRIPTION =
  "sydHustle connects students who want to earn extra with students who need help getting things done. Join the waitlist and take our survey.";

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
    alt: "sydHustle logo — geometric teal S icon with sydHustle wordmark on black",
  },
  logoLight: {
    path: "/sydhustle-logo-light.png",
    width: 1054,
    height: 367,
    alt: "sydHustle logo — geometric teal S icon with sydHustle wordmark on light background",
  },
} as const;

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
