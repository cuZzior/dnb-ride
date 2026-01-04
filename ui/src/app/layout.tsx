import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DnB On The Bike - Drum & Bass Cycling Events Worldwide",
  description: "Discover and join Drum & Bass cycling events happening around the world. Find rides near you, suggest videos, and connect with the global DNB community.",
  keywords: ["drum and bass", "cycling", "events", "DNB", "bike rides", "music", "community"],
  authors: [{ name: "DnB On The Bike" }],
  openGraph: {
    title: "DnB On The Bike",
    description: "Drum & Bass Cycling Events Worldwide",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DnB On The Bike",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ff3b5c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
