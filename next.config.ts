import type { NextConfig } from "next";

// Only set when Vercel provides a real deploy id — never emit `?dpl=undefined`.
const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID;
const deploymentId =
  vercelDeploymentId && /^[a-zA-Z0-9_-]+$/.test(vercelDeploymentId)
    ? vercelDeploymentId
    : undefined;

const nextConfig: NextConfig = {
  ...(deploymentId ? { deploymentId } : {}),
  // The Terms shipped at /terms before the policies center existed, so
  // that URL is in the wild. Permanent, so crawlers consolidate on the
  // new address.
  async redirects() {
    return [
      { source: "/terms", destination: "/legal/terms", permanent: true },
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
