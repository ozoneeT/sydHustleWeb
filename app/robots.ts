import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /team is the contributors' ledger — signed-in, private, and of
        // no use to a searcher. It shipped after this list was written.
        disallow: ["/admin", "/console", "/team"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/sydhustle-icon.webp", "/sydhustle-logo.webp", "/sydhustle-logo-light.png"],
        disallow: ["/admin", "/console", "/team"],
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
