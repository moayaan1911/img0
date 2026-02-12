import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/layout/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://img0.xyz";
const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "img0.xyz - Minimalist Image Studio",
    template: "%s | img0.xyz",
  },
  description:
    "Minimalist Image Studio in your browser. Compress, resize, convert, and edit images with zero signup.",
  applicationName: "img0.xyz",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "image toolkit",
    "image compressor",
    "image converter",
    "image resizer",
    "background remover",
    "free image tools",
    "browser image editor",
    "img0.xyz",
  ],
  authors: [
    {
      name: "img0.xyz Community",
      url: "https://github.com/moayaan1911/img0",
    },
  ],
  creator: "img0.xyz Community",
  publisher: "img0.xyz",
  category: "technology",
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
  openGraph: {
    title: "img0.xyz - Minimalist Image Studio",
    description:
      "Privacy-first image tools that run in your browser. No signups, no paid lock-ins.",
    url: SITE_URL,
    siteName: "img0.xyz",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "img0.xyz website preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "img0.xyz - Minimalist Image Studio",
    description:
      "Edit images directly in your browser with zero upload and zero signup.",
    images: [OG_IMAGE_URL],
  },
  other: {
    monetag: "8786e6b39066648d92329bcc8686a315",
    "og:image": OG_IMAGE_URL,
    "geo.region": "GLOBAL",
    "geo.placename": "Worldwide",
    "geo.position": "0;0",
    ICBM: "0, 0",
    "twitter:image": OG_IMAGE_URL,
    "og:image:url": OG_IMAGE_URL,
    "og:image:secure_url": OG_IMAGE_URL,
    "twitter:image:src": OG_IMAGE_URL,
    "twitter:image:alt": "img0.xyz website preview",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "img0.xyz",
        url: SITE_URL,
        inLanguage: "en",
        image: OG_IMAGE_URL,
        description: "Minimalist Image Studio in your browser.",
      },
      {
        "@type": "SoftwareApplication",
        name: "img0.xyz",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web Browser",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        url: SITE_URL,
        image: OG_IMAGE_URL,
        description:
          "Privacy-first image toolkit for compression, conversion, editing, and export.",
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          src="https://quge5.com/88/tag.min.js"
          data-zone="210522"
          async
          data-cfasync="false"
        ></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
