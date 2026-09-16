import type { NextConfig } from "next";

// Only set when Vercel provides a real deploy id — never emit `?dpl=undefined`.
const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID;
const deploymentId =
  vercelDeploymentId && /^[a-zA-Z0-9_-]+$/.test(vercelDeploymentId)
    ? vercelDeploymentId
    : undefined;

const nextConfig: NextConfig = {
  ...(deploymentId ? { deploymentId } : {}),
  images: {
    // Next 16 only serves the qualities listed here. The app screenshots
    // are fine detail on a small device screen and visibly mush at 75.
    qualities: [75, 88],
  },
  // The Terms shipped at /terms before the policies center existed, so
  // that URL is in the wild. Permanent, so crawlers consolidate on the
  // new address.
  async redirects() {
    return [
      { source: "/terms", destination: "/legal/terms", permanent: true },
      // The student survey is over and its page is gone, but Google has
      // the URL indexed and shows it as a sitelink. A 301 to the landing
      // page retires it properly: a 404 would sit in Search Console as an
      // error for months, and anyone following the old result would hit a
      // dead end instead of the thing they were looking for.
      { source: "/survey", destination: "/", permanent: true },
      // The survey list had its own address and its own password before it
      // became a console tab. The bookmark is in use, so it still lands.
      {
        source: "/surveylist",
        destination: "/console/surveylist",
        permanent: true,
      },
      {
        source: "/surveylist/:path*",
        destination: "/console/surveylist",
        permanent: true,
      },
    ];
  },
  // Apex redirects to www; allow both so remaining Server Actions stay CSRF-safe.
  experimental: {
    serverActions: {
      allowedOrigins: ["sydhustle.com", "www.sydhustle.com"],
    },
  },
};

export default nextConfig;
