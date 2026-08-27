import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Students",
  description:
    "Find active university researchers, understand their recent publications, and send concise inquiries that respect faculty time.",
  openGraph: {
    title: "For Students | Schollective",
    description:
      "Find active university researchers, understand their recent publications, and send concise inquiries that respect faculty time.",
  },
  twitter: {
    title: "For Students | Schollective",
    description:
      "Find active university researchers, understand their recent publications, and send concise inquiries that respect faculty time.",
  },
};

export default function ForStudentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
