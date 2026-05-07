import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CustomCursor } from "@/components/ui/CustomCursor";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Schollective — Academic Mentorship, Democratized",
  description: "Connecting students with verified professors for structured guidance and research mentorship.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased bg-[var(--navy)] text-[var(--ivory)] selection:bg-[var(--amber)] selection:text-[var(--navy)]`}
      >
        {/* Global Background Elements */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-[var(--navy)]" />
        
        {/* Film-Grain Noise Overlay (z-1 so it sits above bg but below content) */}
        <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.045] bg-[url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\"/%3E%3C/svg%3E')]" />

        {/* Interaction Layer */}
        <CustomCursor />
        
        {/* Main Application Container */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Global Notification Layer */}
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'rgba(17, 34, 64, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 146, 42, 0.2)',
              color: '#EDE8E0',
              borderRadius: '16px',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </body>
    </html>
  );
}
