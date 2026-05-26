import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CustomCursor } from "@/components/ui/CustomCursor";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Schollective — Academic Mentorship, Democratized",
    template: "%s — Schollective",
  },
  description:
    "Connecting students with verified professors for structured guidance and research mentorship.",
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
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-black text-white min-h-screen selection:bg-white selection:text-black scroll-smooth" suppressHydrationWarning>

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
              background: "rgba(17, 17, 17, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#f2f2f0",
              borderRadius: "10px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
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