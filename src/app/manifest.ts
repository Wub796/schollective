import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Schollective",
    short_name: "Schollective",
    description: "Academic mentorship and research outreach for students.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfdfd",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
