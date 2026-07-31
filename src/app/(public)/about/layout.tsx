import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Schollective's mission to connect high school students with verified professors and research mentors through structured academic outreach.",
  openGraph: {
    title: "About Us | Schollective",
    description:
      "Learn about Schollective's mission to connect high school students with verified professors and research mentors through structured academic outreach.",
  },
  twitter: {
    title: "About Us | Schollective",
    description:
      "Learn about Schollective's mission to connect high school students with verified professors and research mentors.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
