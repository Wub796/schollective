import { MetadataRoute } from "next";
import { sql } from "@/lib/neon/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://schollective.com").replace(/\/$/, "");
  const lastModified = new Date();

  // Static marketing routes
  const staticRoutes = [
    "",
    "/about",
    "/for-students",
    "/for-professors",
    "/features"
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8
  }));

  // Approved and complete professor profiles
  const professors = await sql`
    SELECT id, updated_at
    FROM profiles
    WHERE role = 'professor' AND status = 'approved' AND profile_complete = true;
  `;

  const professorRoutes = (professors || []).map((prof) => ({
    url: `${baseUrl}/professors/${prof.id}`,
    lastModified: prof.updated_at ? new Date(prof.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6
  }));

  return [...staticRoutes, ...professorRoutes];
}
