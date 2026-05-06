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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <CustomCursor />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'rgba(17, 34, 64, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(155, 175, 192, 0.15)',
              color: '#EDE8E0',
              borderRadius: '16px',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
