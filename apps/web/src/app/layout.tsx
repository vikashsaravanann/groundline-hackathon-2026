import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Set NEXT_PUBLIC_SITE_URL to the verified HTTPS origin so social preview URLs
// and the canonical URL are absolute. No hostname is assumed during local builds.
const metadataBase = SITE_URL;

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  ...(metadataBase ? { alternates: { canonical: "/" } } : {}),
  title: "Groundline — Human-Guided Vision-to-Action AI",
  description:
    "Groundline transforms safe product images and typed goals into reviewable AI-assisted digital tasks, with human control.",
  openGraph: {
    title: "Groundline — Human-Guided Vision-to-Action AI",
    description:
      "Groundline transforms safe product images and typed goals into reviewable AI-assisted digital tasks, with human control.",
    type: "website",
    siteName: "Groundline",
    images: metadataBase ? [
      {
        url: new URL("/brand/groundline-approved-original.png", metadataBase),
        width: 1254,
        height: 1254,
        alt: "Groundline — Vision-to-action AI",
      },
    ] : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: "Groundline — Human-Guided Vision-to-Action AI",
    description:
      "Groundline transforms safe product images and typed goals into reviewable AI-assisted digital tasks, with human control.",
    images: metadataBase
      ? [new URL("/brand/groundline-approved-original.png", metadataBase)]
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full">
        <div aria-hidden className="app-canvas" />
        {children}
      </body>
    </html>
  );
}
