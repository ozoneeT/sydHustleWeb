import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Free skew recovery (not Vercel Pro Skew Protection): tag assets/requests
  // with this deploy so a stale client hard-reloads instead of calling dead
  // Server Action IDs. On Vercel this is always set at build time.
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || undefined,
};

export default nextConfig;
