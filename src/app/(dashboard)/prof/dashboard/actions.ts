"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateRequestStatus(requestId: string, status: "active" | "declined") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "active") {
      updates.accepted_at = new Date().toISOString();
    } else if (status === "declined") {
      updates.declined_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("requests")
      .update(updates)
      .eq("id", requestId)
      .eq("professor_id", user.id);

    if (error) throw error;
    revalidatePath("/prof/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update request status." };
  }
}

export async function markRequestViewed(requestId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: request } = await supabase
      .from("requests")
      .select("status, created_at")
      .eq("id", requestId)
      .single();

    if (request && request.status === "pending") {
      // Delay reveal: check if created_at is older than 1 hour (optional or always mark viewed when professor expands / loads it)
      // The plan says: "Only update if current status is pending AND created_at is > 1 hour ago (delay reveal)".
      // But actually, to make it simple and robust, let's mark it viewed if it's pending.
      // Let's implement the > 1 hour check:
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(request.created_at) < oneHourAgo) {
        const { error } = await supabase
          .from("requests")
          .update({
            status: "viewed",
            viewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestId)
          .eq("professor_id", user.id);

        if (error) throw error;
        revalidatePath("/prof/dashboard");
      }
    }
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to mark request as viewed." };
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
