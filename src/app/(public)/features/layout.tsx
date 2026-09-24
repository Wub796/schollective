import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description:
    "What Schollective does: roles fixed at signup, a three-field request instead of a blank email, manual review of every professor, group requests, one thread per request, and named request states.",
  openGraph: {
    title: "Features | Schollective",
    description:
      "What Schollective does: a structured request form, manual review of every professor profile, group requests, and one thread per request.",
  },
  twitter: {
    title: "Features | Schollective",
    description:
      "What Schollective does: a structured request form, reviewed professor profiles, and one thread per request.",
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
