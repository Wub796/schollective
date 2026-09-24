import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Students",
  description:
    "Find researchers whose work matches your interests, read the publications listed on their profiles, and send a request that says what you have done and what you want to learn.",
  openGraph: {
    title: "For Students | Schollective",
    description:
      "Find researchers whose work matches your interests, read the publications on their profiles, and send a request they can actually answer.",
  },
  twitter: {
    title: "For Students | Schollective",
    description:
      "Find researchers whose work matches your interests and send a request they can actually answer.",
  },
};

export default function ForStudentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
