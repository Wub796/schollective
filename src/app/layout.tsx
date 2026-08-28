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

const siteUrl = "https://schollective.com";
const siteTitle = "Schollective | Academic Mentorship for High School Students";
const siteDescription =
  "Schollective helps high school students find verified research mentors, understand faculty research, and send thoughtful outreach requests to professors.";

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: "%s | Schollective",
  },

  description: siteDescription,

  keywords: [
    "academic mentorship",
    "research mentors",
    "high school research",
    "professor outreach",
    "student research opportunities",
    "faculty research",
  ],

  authors: [{ name: "Schollective" }],
  creator: "Schollective",

  metadataBase: new URL(siteUrl),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Schollective",
    title: siteTitle,
    description: siteDescription,
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
    title: siteTitle,
    description: siteDescription,
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

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },

  verification: {
    google: "mypb73BDJvSFV-fVlRUDSUi6V10IgysV3vLPQzeYeHk",
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
        {/* JSON-LD structured data for Google rich results + knowledge panel */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Schollective",
              url: siteUrl,
              description: siteDescription,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://schollective.com/professors?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

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