import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Students",
  description:
    "Find verified professors, understand their research, and send structured mentorship requests — free for high school and college students on Schollective.",
  openGraph: {
    title: "For Students | Schollective",
    description:
      "Find verified professors, understand their research, and send structured mentorship requests — free for high school and college students.",
  },
  twitter: {
    title: "For Students | Schollective",
    description:
      "Find verified professors and send structured mentorship requests — free for high school and college students.",
  },
};

export default function ForStudentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
