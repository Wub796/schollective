import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Faculty",
  description:
    "Fewer cold emails. Every request arrives with the student's topic, coursework and goal, you choose who to accept, and declining takes one click.",
  openGraph: {
    title: "For Faculty | Schollective",
    description:
      "Requests arrive with the student's topic, coursework and goal. You accept or decline each one, and accepted requests open a single thread.",
  },
  twitter: {
    title: "For Faculty | Schollective",
    description:
      "Requests arrive with the student's topic, coursework and goal. Accept or decline each one.",
  },
};

export default function ForProfessorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
