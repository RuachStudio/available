import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import StickyAudioButton from "./components/ StickyAudioButton";
import DonateFloatingButton from "./components/DonateFloatingButton";

const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.godscoffeecall.com"),
  title: "AVAILABLE Conference – GodsCoffeeCall.com",
  description: "Join us for the AVAILABLE Conference. Register now at GodsCoffeeCall.com",
  alternates: {
    canonical: "https://www.godscoffeecall.com",
  },
  openGraph: {
    title: "AVAILABLE Conference",
    description: "Join us for the AVAILABLE Conference. Register now at GodsCoffeeCall.com",
    url: "https://www.godscoffeecall.com",
    type: "website",
    images: [
      {
        url: "/images/available-conference-flyer-og.jpg",
        width: 1200,
        height: 630,
        alt: "AVAILABLE Conference flyer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AVAILABLE Conference",
    description: "Join us for the AVAILABLE Conference. Register now at GodsCoffeeCall.com",
    images: ["/images/available-conference-flyer-og.jpg"],
  },
  other: facebookAppId
    ? {
        "fb:app_id": facebookAppId,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="https://godscoffeecall.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            top: "10px",
            left: "10px",
            zIndex: 1000,
            cursor: "pointer",
          }}
        >
          <Image src="/logo/logo.png" alt="God's Coffee Call" width={60} height={60} />
        </a>
        <StickyAudioButton />
        <DonateFloatingButton />
        {children}
      </body>
    </html>
  );
}
