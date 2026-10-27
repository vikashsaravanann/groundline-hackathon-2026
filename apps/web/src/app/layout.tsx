import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Groundline — See It. Understand It. Get It Ready.",
  description:
    "Groundline is a human-guided visual AI co-pilot that turns a product image and a goal into reviewable digital assistance.",
  openGraph: {
    title: "Groundline — See It. Understand It. Get It Ready.",
    description:
      "A human-guided visual AI co-pilot: turn a camera snapshot and a simple goal into structured, reviewable digital assistance.",
    type: "website",
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
