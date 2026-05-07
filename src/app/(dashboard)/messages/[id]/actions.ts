"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(requestId: string, content: string) {
  if (!content.trim()) return;

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Insert message
    const { error } = await supabase
      .from("messages")
      .insert({
        request_id: requestId,
        sender_id: user.id,
        content: content.trim()
      });

    if (error) throw error;

    // Update request timestamp
    await supabase
      .from("requests")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", requestId);

    revalidatePath(`/messages/${requestId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to send message." };
  }
}
