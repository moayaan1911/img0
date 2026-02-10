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
  metadataBase: new URL("https://img0.xyz"),
  title: {
    default: "img0.xyz - Free Client-Side Image Toolkit",
    template: "%s | img0.xyz",
  },
  description:
    "Minimalist image studio in your browser. Compress, resize, convert, and edit images with zero upload and zero signup.",
  openGraph: {
    title: "img0.xyz - Free Client-Side Image Toolkit",
    description:
      "Privacy-first image tools that run in your browser. No signups, no servers, no nonsense.",
    url: "https://img0.xyz",
    siteName: "img0.xyz",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "img0.xyz - Free Client-Side Image Toolkit",
    description:
      "Edit images directly in your browser with zero upload and zero signup.",
  },
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
        {children}
      </body>
    </html>
  );
}
