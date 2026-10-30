import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AccessProvider } from "@/components/access/AccessProvider";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import VisitBeacon from "@/components/VisitBeacon";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], axes: ["opsz"], variable: "--font-inter" });

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(host ? `https://${host}` : "http://localhost:3000"),
  title: { default: `${SITE_NAME}: play the simulations from the videos`, template: `%s · ${SITE_NAME}` },
  description: "Got a hunch? Let's crunch it. Play the simulations from the Hunch Crunch videos, right in your browser.",
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AccessProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <VisitBeacon />
        </AccessProvider>
      </body>
    </html>
  );
}
