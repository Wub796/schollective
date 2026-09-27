import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { AmplitudeAnalytics } from "@/components/analytics/AmplitudeAnalytics";
import { CookieBanner } from "@/components/CookieBanner";

/* These two faces are the site's actual type identity, self-hosted as variable
   woff2 files so the build is 100% deterministic and immune to Google Fonts
   network outages or extensionless URL slicing. */
const mulish = localFont({
  src: "../fonts/mulish.woff2",
  variable: "--font-mulish",
  display: "swap",
});

const arima = localFont({
  src: "../fonts/arima.woff2",
  variable: "--font-arima",
  display: "swap",
});

const siteUrl = "https://schollective.com";
const siteTitle = "Schollective | Academic Mentorship for High School Students";
const siteDescription =
  "Schollective helps high schoolers find active faculty and write cold emails that do not get deleted.";

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

  /* Sizes below state what the files actually are. They used to claim
     48/192/512/180, but `favicon.ico`, `favicon.png`, `apple-touch-icon.png` and
     `logo.png` are all byte-identical copies of one 400x400 PNG, so every
     declared size was wrong and the browser was told to pick a file that does
     not exist. Real per-size variants should be generated from the source art;
     until then, telling the truth means a browser scales one image instead of
     choosing among four identical ones. */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "400x400", type: "image/x-icon" },
      { url: "/logo.png", sizes: "400x400", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "400x400", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },

  verification: {
    google: "mypb73BDJvSFV-fVlRUDSUi6V10IgysV3vLPQzeYeHk",
  },
};

/* No `maximumScale`: pinning it to 1 blocks pinch-zoom (WCAG 1.4.4), and the
   layout is responsive enough not to need the lock. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf9f7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mulish.variable} ${arima.variable}`} suppressHydrationWarning>
      <body className="min-h-screen scroll-smooth" suppressHydrationWarning>
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

        <a href="#main-content" className="skip-link">Skip to content</a>

        {/* ── Amplitude Analytics & Session Replay ───────────── */}
        <AmplitudeAnalytics />

        {/* ── Layer 50: Custom cursor (opt-in via user preference) ── */}
        <CustomCursor />

        {/* ── Layer 10: Page content ──────────────────────────── */}
        <main id="main-content" className="relative z-[10]">
          {children}
        </main>

        {/* ── Layer 40: Toasts ────────────────────────────────── */}
        <CookieBanner />

        {/* Light surface: a near-black toast on a cream page was the one piece
            of UI still wearing the old dark theme. */}
        <Toaster
          position="top-right"
          visibleToasts={3}
          toastOptions={{
            style: {
              background: "var(--bg-surface-1)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-inset)",
              boxShadow: "0 12px 32px -8px rgba(15, 23, 42, 0.16)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              zIndex: "var(--z-toast, 9999)" as string,
            },
          }}
        />
      </body>
    </html>
  );
}