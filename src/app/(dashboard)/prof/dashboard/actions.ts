"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateRequestStatus(requestId: string, status: 'active' | 'closed') {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Update the request status
    const { error } = await supabase
      .from("requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("professor_id", user.id);

    if (error) throw error;

    revalidatePath("/prof/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update request status." };
  }
}

export async function toggleAvailability() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    revalidatePath("/prof/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to toggle availability." };
  }
}
