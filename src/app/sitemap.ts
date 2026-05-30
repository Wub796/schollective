import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://schollective.com";

  // Static marketing routes
  const staticRoutes = [
    "",
    "/about",
    "/for-students",
    "/for-professors",
    "/features"
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8
  }));

  // Approved and complete professor profiles
  const { data: professors } = await supabase
    .from("profiles")
    .select("id, updated_at")
    .eq("role", "professor")
    .eq("status", "approved")
    .eq("profile_complete", true);

  const professorRoutes = (professors || []).map((prof) => ({
    url: `${baseUrl}/professors/${prof.id}`,
    lastModified: prof.updated_at ? new Date(prof.updated_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6
  }));

  return [...staticRoutes, ...professorRoutes];
}
