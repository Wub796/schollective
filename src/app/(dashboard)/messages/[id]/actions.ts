"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { filterMessage } from "@/lib/validators";

export async function sendMessage(requestId: string, content: string) {
  if (!content.trim()) return;

  // ── Message filter ──────────────────────────────────────────
  const filter = filterMessage(content);
  if (!filter.allowed) {
    return { error: filter.reason ?? "Message blocked by content filter." };
  }

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Fetch request to verify it's active
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("status, student_id, professor_id")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) return { error: "Thread not found." };
    if (request.status !== "active") {
      return { error: "This thread is not active and cannot receive messages." };
    }
    if (request.student_id !== user.id && request.professor_id !== user.id) {
      return { error: "Unauthorized: You are not a participant in this thread." };
    }

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

export async function closeRequest(requestId: string) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Fetch request to verify user is a participant
    const { data: request } = await supabase
      .from("requests")
      .select("student_id, professor_id")
      .eq("id", requestId)
      .single();

    if (!request) return { error: "Request not found" };
    if (request.student_id !== user.id && request.professor_id !== user.id) {
      return { error: "Unauthorized: You are not a participant in this thread." };
    }

    // Update the request status to closed
    const { error } = await supabase
      .from("requests")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) throw error;

    revalidatePath(`/messages/${requestId}`);
    revalidatePath("/dashboard");
    revalidatePath("/prof/dashboard");
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to close request." };
  }
}
