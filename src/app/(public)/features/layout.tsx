import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore Schollective's features: role-based integrity, structured request flow, manual academic verification, global mentor network, and real-time thread sync.",
  openGraph: {
    title: "Features | Schollective",
    description:
      "Explore Schollective's features: role-based integrity, structured request flow, manual academic verification, and real-time mentorship tools.",
  },
  twitter: {
    title: "Features | Schollective",
    description:
      "Explore Schollective's features: role-based integrity, structured request flow, and real-time mentorship tools.",
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
