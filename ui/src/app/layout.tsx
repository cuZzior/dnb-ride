import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DNBRIDE - Drum & Bass Cycling Events Worldwide",
  description: "Discover and join Drum & Bass cycling events happening around the world. Find rides near you, suggest videos, and connect with the global DNB community.",
  keywords: ["drum and bass", "cycling", "events", "DNB", "bike rides", "music", "community", "DNBRIDE"],
  authors: [{ name: "DNBRIDE" }],
  openGraph: {
    title: "DNBRIDE",
    description: "Drum & Bass Cycling Events Worldwide",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DNBRIDE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FF6B6B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
