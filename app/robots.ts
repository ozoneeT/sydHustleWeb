import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/moderator", "/console"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/sydhustle-icon.webp", "/sydhustle-logo.webp", "/sydhustle-logo-light.png"],
        disallow: ["/admin", "/dashboard", "/moderator", "/console"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/sydhustle-icon.webp", "/sydhustle-logo.webp", "/sydhustle-logo-light.png"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
