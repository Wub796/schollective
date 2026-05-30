"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateRequestStatus(requestId: string, status: "active" | "closed") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

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

/**
 * Toggles the professor's is_accepting_requests field.
 * @param isAccepting - the NEW desired state
 */
export async function toggleAvailability(isAccepting: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("profiles")
      .update({ is_accepting_requests: isAccepting, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .eq("role", "professor");

    if (error) throw error;
    revalidatePath("/prof/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to toggle availability." };
  }
}

/**
 * Creates a notification for a user.
 * Called server-side after accept/decline/new-request events.
 */
export async function createNotification({
  userId, type, title, body, requestId,
}: {
  userId: string;
  type: "request_accepted" | "request_declined" | "new_request" | "message";
  title: string;
  body?: string;
  requestId?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id:    userId,
    type,
    title,
    body:       body ?? null,
    request_id: requestId ?? null,
  });
  if (error) console.error("[notification]", error.message);
}

/**
 * Marks all unread notifications as read for the current user.
 */
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/dashboard");
  revalidatePath("/prof/dashboard");
}
