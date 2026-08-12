import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";
import AuthGuard from "@/components/AuthGuard";
import ConditionalShell from "@/components/ConditionalShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "Mednoris",
  title: {
    default: "Mednoris",
    template: "%s | Mednoris",
  },
  description:
    "Mednoris is a privacy-first healthcare platform for patient-owned medical records, secure consultations, verified doctors, and hospital records management.",
  keywords: [
    "Mednoris",
    "digital healthcare platform",
    "patient medical records",
    "health records management",
    "telemedicine",
    "verified doctors",
    "hospital records system",
    "secure medical data",
    "healthcare software",
    "privacy-first healthcare",
  ],
  authors: [{ name: "Mednoris" }],
  creator: "Mednoris",
  publisher: "Mednoris",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Mednoris",
    title: "Mednoris",
    description:
      "Patient-owned health records, secure consultations, verified doctors, and hospital records management in one privacy-first platform.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Mednoris platform logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mednoris",
    description:
      "Patient-owned health records, secure consultations, verified doctors, and hospital records management.",
    images: ["/logo.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Mednoris",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/logo.png`,
      description:
        "A privacy-first healthcare platform for patient-owned medical records, verified doctors, and hospital records management.",
    },
    {
      "@type": "WebSite",
      name: "Mednoris",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      potentialAction: {
        "@type": "SearchAction",
        target: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
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
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8f7fb] text-primary font-serif">
        <Script
          id="umami"
          src="https://cloud.umami.is/script.js"
          data-website-id="d28bec8f-c656-4afa-8cae-1e2551e41eed"
          strategy="afterInteractive"
        />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Providers>
          <AuthGuard>
            <ConditionalShell>
              {children}
            </ConditionalShell>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
