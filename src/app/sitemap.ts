import { MetadataRoute } from "next";
import { getServerlessDbUrl, sql } from "@/lib/neon/db";

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

  // Approved and complete professor profiles. This runs during `next build`,
  // where the database may not be reachable yet — a sitemap missing its
  // professor entries is worth far more than a failed deploy.
  let professors: Record<string, any>[] = [];
  try {
    const dbUrl = getServerlessDbUrl();
    if (dbUrl) {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database query timed out in sitemap")), 3000)
      );
      professors = await Promise.race([
        sql`
          SELECT id, updated_at
          FROM profiles
          WHERE role = 'professor' AND status = 'approved' AND profile_complete = true;
        `,
        timeoutPromise,
      ]);
    }
  } catch (error) {
    console.error("[sitemap] Could not list professor profiles:", error);
  }

  const professorRoutes = (professors || []).map((prof) => ({
    url: `${baseUrl}/professors/${prof.id}`,
    lastModified: prof.updated_at ? new Date(prof.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6
  }));

  return [...staticRoutes, ...professorRoutes];
}
