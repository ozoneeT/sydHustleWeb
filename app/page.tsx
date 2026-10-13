import type { Metadata } from "next";
import { ClosingCta } from "@/components/home/ClosingCta";
import { Coverage } from "@/components/home/Coverage";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Hero } from "@/components/home/Hero";
import { MarketingHeader } from "@/components/home/MarketingHeader";
import { Showcase } from "@/components/home/Showcase";
import { SiteFooter } from "@/components/home/SiteFooter";
import { Statement } from "@/components/home/Statement";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME}: Get it done by someone nearby`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/**
 * Two listings for one product, so the page declares both. Google reads
 * `MobileApplication` for the app pack; separate platform entries point
 * visitors and crawlers to the corresponding live store listing.
 */
const appJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: SITE_NAME,
    operatingSystem: "iOS",
    applicationCategory: "BusinessApplication",
    url: APP_STORE_URL,
    installUrl: APP_STORE_URL,
    offers: { "@type": "Offer", price: 0, url: APP_STORE_URL },
    description: SITE_DESCRIPTION,
    image: absoluteUrl("/sydhustle-icon.webp"),
  },
  {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: SITE_NAME,
    operatingSystem: "Android",
    applicationCategory: "BusinessApplication",
    url: PLAY_STORE_URL,
    installUrl: PLAY_STORE_URL,
    offers: { "@type": "Offer", price: 0, url: PLAY_STORE_URL },
    description: SITE_DESCRIPTION,
    image: absoluteUrl("/sydhustle-icon.webp"),
  },
];

export default function Home() {
  return (
    <div className="marketing flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <MarketingHeader />
      <main className="flex-1">
        <Hero />
        <Statement
          words={[
            "The",
            "easiest",
            "way",
            "to",
            "get",
            "things",
            "done.",
            "Ever.",
          ]}
          accentFrom={7}
        />
        <Showcase />
        <Coverage />
        <FeatureGrid />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
