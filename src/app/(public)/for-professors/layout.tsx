import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Professors",
  description:
    "Join Schollective to mentor motivated students. Get discovered by high school researchers, manage mentorship requests, and guide the next generation of academics.",
  openGraph: {
    title: "For Professors | Schollective",
    description:
      "Join Schollective to mentor motivated students. Get discovered, manage requests, and guide the next generation of researchers.",
  },
  twitter: {
    title: "For Professors | Schollective",
    description:
      "Join Schollective to mentor motivated students and guide the next generation of researchers.",
  },
};

export default function ForProfessorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
