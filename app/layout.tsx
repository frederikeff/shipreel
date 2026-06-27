import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShipReel — AI video producer",
  description:
    "Tell ShipReel a topic, pick a cartoon host, and it scripts, voices, renders and ships a multi-format social reel — with you approving before it posts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a12] text-zinc-100 [background-image:radial-gradient(60%_50%_at_50%_-10%,rgba(124,92,255,0.18),transparent_60%),radial-gradient(40%_40%_at_100%_0%,rgba(56,189,248,0.10),transparent_60%)]">
        {children}
      </body>
    </html>
  );
}
