import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Faculty",
  description:
    "Fewer generic cold emails. Schollective replaces unvetted email blasts with structured academic inquiries with verified coursework and research questions.",
  openGraph: {
    title: "For Faculty | Schollective",
    description:
      "Fewer generic cold emails. Schollective replaces unvetted email blasts with structured academic inquiries with verified coursework and research questions.",
  },
  twitter: {
    title: "For Faculty | Schollective",
    description:
      "Fewer generic cold emails. Schollective replaces unvetted email blasts with structured academic inquiries with verified coursework and research questions.",
  },
};

export default function ForProfessorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
