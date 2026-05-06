"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function sendMessage(requestId: string, content: string) {
  if (!content.trim()) return;

  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  // Insert message
  const { error } = await supabase
    .from("messages")
    .insert({
      request_id: requestId,
      sender_id: session.user.id,
      content: content.trim()
    });

  if (error) {
    console.error("Message send error:", error);
    throw new Error(error.message);
  }

  // Update request timestamp
  await supabase
    .from("requests")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath(`/messages/${requestId}`);
  return { success: true };
}
