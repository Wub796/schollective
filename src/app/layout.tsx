import type { Metadata, Viewport } from "next";
import { Mulish, Arima } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CustomCursor } from "@/components/ui/CustomCursor";

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const arima = Arima({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Schollective | Academic Mentorship for High School Students",
    template: "%s | Schollective",
  },

  description:
    "Schollective helps high school students find research mentors, understand faculty research, and send thoughtful outreach requests to professors.",

  authors: [{ name: "Schollective" }],
  creator: "Schollective",

  metadataBase: new URL("https://schollective.vercel.app"),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://schollective.vercel.app",
    siteName: "Schollective",
    title: "Schollective | Academic Mentorship for High School Students",
    description:
      "Find research mentors, understand faculty research, and send thoughtful outreach requests to professors.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Schollective | Academic Mentorship for High School Students",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Schollective | Academic Mentorship for High School Students",
    description:
      "Find research mentors and connect with professors through thoughtful academic outreach.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    google: "WGZHC_3E62I1QeoQc48lnahPoU4OeWZ96K4o1VMjKLM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mulish.variable} ${arima.variable}`} suppressHydrationWarning>
      <body className="min-h-screen scroll-smooth" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }} suppressHydrationWarning>

        {/* ── Layer 0: Film-grain noise ──────────────────────────
            Fixed, pointer-events-none. z-index: 0 via .noise-overlay
        ─────────────────────────────────────────────────────── */}
        <div className="noise-overlay" aria-hidden="true" />

        {/* ── Layer 50: Custom cursor ─────────────────────────── */}
        <CustomCursor />

        {/* ── Layer 10: Page content ──────────────────────────── */}
        <div className="relative z-[10]">
          {children}
        </div>

        {/* ── Layer 40: Toasts ────────────────────────────────── */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(11, 18, 36, 0.96)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(79, 70, 229, 0.18)",
              color: "#e8f0ff",
              borderRadius: "10px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              zIndex: "var(--z-toast, 40)" as string,
            },
          }}
        />
      </body>
    </html>
  );
}