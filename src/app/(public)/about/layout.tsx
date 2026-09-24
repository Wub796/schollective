import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Why Schollective exists: what cold emailing costs both sides, how professor profiles get reviewed, and the five students who built it.",
  openGraph: {
    title: "About Us | Schollective",
    description:
      "Why Schollective exists, how professor profiles get reviewed, and who built it.",
  },
  twitter: {
    title: "About Us | Schollective",
    description:
      "Why Schollective exists, how professor profiles get reviewed, and who built it.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
