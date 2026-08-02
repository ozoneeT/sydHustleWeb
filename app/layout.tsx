import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StaleDeploymentReloader } from "@/components/StaleDeploymentReloader";
import {
  absoluteUrl,
  BRAND_ASSETS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Your side hustle, sorted.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "sydHustle",
    "syd hustle",
    "student side hustle",
    "student jobs",
    "campus tasks",
    "earn as a student",
    "student marketplace",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      {
        url: BRAND_ASSETS.icon.path,
        type: "image/webp",
        sizes: `${BRAND_ASSETS.icon.width}x${BRAND_ASSETS.icon.height}`,
      },
    ],
    apple: [{ url: "/apple-icon" }],
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Your side hustle, sorted.`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: BRAND_ASSETS.logo.path,
        width: BRAND_ASSETS.logo.width,
        height: BRAND_ASSETS.logo.height,
        alt: BRAND_ASSETS.logo.alt,
      },
      {
        url: BRAND_ASSETS.logoLight.path,
        width: BRAND_ASSETS.logoLight.width,
        height: BRAND_ASSETS.logoLight.height,
        alt: BRAND_ASSETS.logoLight.alt,
      },
      {
        url: BRAND_ASSETS.icon.path,
        width: BRAND_ASSETS.icon.width,
        height: BRAND_ASSETS.icon.height,
        alt: BRAND_ASSETS.icon.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Your side hustle, sorted.`,
    description: SITE_DESCRIPTION,
    images: [BRAND_ASSETS.logo.path],
  },
  category: "business",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl(BRAND_ASSETS.icon.path),
    width: BRAND_ASSETS.icon.width,
    height: BRAND_ASSETS.icon.height,
    caption: BRAND_ASSETS.icon.alt,
  },
  image: [
    absoluteUrl(BRAND_ASSETS.logo.path),
    absoluteUrl(BRAND_ASSETS.logoLight.path),
    absoluteUrl(BRAND_ASSETS.icon.path),
  ],
  description: SITE_DESCRIPTION,
  sameAs: [],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(BRAND_ASSETS.icon.path),
    },
  },
  image: [
    {
      "@type": "ImageObject",
      contentUrl: absoluteUrl(BRAND_ASSETS.logo.path),
      name: "sydHustle logo",
      description: BRAND_ASSETS.logo.alt,
      width: BRAND_ASSETS.logo.width,
      height: BRAND_ASSETS.logo.height,
    },
    {
      "@type": "ImageObject",
      contentUrl: absoluteUrl(BRAND_ASSETS.logoLight.path),
      name: "sydHustle logo light background",
      description: BRAND_ASSETS.logoLight.alt,
      width: BRAND_ASSETS.logoLight.width,
      height: BRAND_ASSETS.logoLight.height,
    },
    {
      "@type": "ImageObject",
      contentUrl: absoluteUrl(BRAND_ASSETS.icon.path),
      name: "sydHustle icon",
      description: BRAND_ASSETS.icon.alt,
      width: BRAND_ASSETS.icon.width,
      height: BRAND_ASSETS.icon.height,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <StaleDeploymentReloader />
        {children}
      </body>
    </html>
  );
}
