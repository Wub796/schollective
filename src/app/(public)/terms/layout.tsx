import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of the Schollective platform — including eligibility, academic integrity, user content, and professor verification.",
  openGraph: {
    title: "Terms of Service | Schollective",
    description:
      "The terms that govern your use of the Schollective platform — including eligibility, academic integrity, and verification.",
  },
  twitter: {
    title: "Terms of Service | Schollective",
    description:
      "The terms that govern your use of the Schollective platform.",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
