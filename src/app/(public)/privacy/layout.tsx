import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Schollective collects, uses, and protects your data — including data sharing, retention, security, and your privacy rights.",
  openGraph: {
    title: "Privacy Policy | Schollective",
    description:
      "How Schollective collects, uses, and protects your data — including data sharing, retention, and your privacy rights.",
  },
  twitter: {
    title: "Privacy Policy | Schollective",
    description:
      "How Schollective collects, uses, and protects your data.",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
