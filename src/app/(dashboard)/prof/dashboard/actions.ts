"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { checkRateLimit, sanitiseText, isValidUuid, LIMITS } from "@/lib/security";

export async function updateRequestStatus(requestId: string, status: "active" | "declined") {
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
    return { error: "Invalid request ID." };
  }
  if (status !== "active" && status !== "declined") {
    return { error: "Invalid status." };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Rate limit: 20 status changes per minute
    const rate = checkRateLimit(`status:${user.id}`, 20, 60 * 1000);
    if (!rate.allowed) {
      return { error: `Please slow down. Try again in ${rate.retryAfterSeconds}s.` };
    }

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
      .eq("id", reqId)
      .eq("professor_id", user.id);

    if (error) throw error;
    revalidatePath("/prof/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update request status." };
  }
}

export async function markRequestViewed(requestId: string) {
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
    return { error: "Invalid request ID." };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: request } = await supabase
      .from("requests")
      .select("status, created_at")
      .eq("id", reqId)
      .single();

    if (request && request.status === "pending") {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(request.created_at) < oneHourAgo) {
        const { error } = await supabase
          .from("requests")
          .update({
            status: "viewed",
            viewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", reqId)
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

export async function toggleAvailability(isAccepting: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Rate limit: 5 toggles per minute
    const rate = checkRateLimit(`toggle:${user.id}`, 5, 60 * 1000);
    if (!rate.allowed) {
      return { error: `Please wait ${rate.retryAfterSeconds}s before toggling again.` };
    }

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

  // Sanitise all string inputs
  const safeType = type; // union type — no sanitisation needed
  const safeTitle = sanitiseText(title, LIMITS.topic);
  const safeBody = body ? sanitiseText(body, LIMITS.messageContent) : null;
  const safeRequestId = requestId && isValidUuid(requestId) ? requestId : null;

  if (!safeTitle) return; // don't store empty notifications

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: safeType,
    title: safeTitle,
    body: safeBody,
    request_id: safeRequestId,
  });
  if (error) console.error("[notification]", error.message);
}

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