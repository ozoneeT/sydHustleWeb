import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "sydHustle — Your side hustle, sorted.",
  description:
    "sydHustle is in development — a platform for students who want to earn extra and students who need help getting things done. Join the waitlist and take our survey.",
  openGraph: {
    title: "sydHustle — Your side hustle, sorted.",
    description:
      "Join the waitlist and take our survey. Help us build something students actually want — whether you're earning or need a hand.",
    url: "https://sydhustle.com",
    siteName: "sydHustle",
  },
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
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
