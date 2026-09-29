import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Manrope, Syne } from "next/font/google";
import { AiStylistWidget } from "@/components/AiStylistWidget";
import { CartDrawer } from "@/components/CartDrawer";
import { FlashBanner } from "@/components/FlashBanner";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SearchModal } from "@/components/SearchModal";
import { CommerceProvider } from "@/context/CommerceProvider";
import "./globals.css";

const display = Syne({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "VALENCE // Autonomous Luxury Commerce", template: "%s — VALENCE" },
  description: "Technical uniform for weather and rooms. Limited runs, global dispatch, matte hardware.",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <CommerceProvider>
          <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:bg-lime focus:px-3 focus:py-2 focus:text-obsidian">
            Skip to content
          </a>
          <div className="sticky top-0 z-40">
            <FlashBanner />
            <Navbar />
          </div>
          <main id="content">{children}</main>
          <Footer />
          <CartDrawer />
          <SearchModal />
          <AiStylistWidget />
        </CommerceProvider>
      </body>
    </html>
  );
}
