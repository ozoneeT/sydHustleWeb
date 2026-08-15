import type { MetadataRoute } from "next";
import { absoluteUrl, BRAND_ASSETS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const brandImages = [
    absoluteUrl(BRAND_ASSETS.logo.path),
    absoluteUrl(BRAND_ASSETS.logoLight.path),
    absoluteUrl(BRAND_ASSETS.icon.path),
  ];

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      images: brandImages,
    },
    {
      url: `${SITE_URL}/policies_center`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/policies_center/community_standard`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/survey`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      images: brandImages,
    },
    {
      // Listed because people will search for it rather than type the
      // address off a receipt they were sent. The page itself is a shell:
      // every verdict depends on a token that arrives in the URL fragment,
      // which no crawler ever sees.
      url: `${SITE_URL}/verify`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
