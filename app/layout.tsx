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
    "sydHustle is in development. Join the waitlist and take our survey to help shape the future of student side hustles.",
  openGraph: {
    title: "sydHustle — Your side hustle, sorted.",
    description:
      "Join the waitlist and take our survey. Help us build something students actually want.",
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
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
