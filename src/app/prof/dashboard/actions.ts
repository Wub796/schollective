"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function updateRequestStatus(requestId: string, status: 'active' | 'closed') {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Unauthorized" };

  // Update the request status
  const { error } = await supabase
    .from("requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("professor_id", session.user.id);

  if (error) return { error: error.message };

  revalidatePath("/prof/dashboard");
  return { success: true };
}

export async function toggleAvailability() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Unauthorized" };

  revalidatePath("/prof/dashboard");
  return { success: true };
}
