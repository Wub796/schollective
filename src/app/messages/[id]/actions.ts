"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { filterMessage } from "@/lib/validators";
import { checkRateLimit, sanitiseText, isValidUuid, LIMITS } from "@/lib/security";

/** Max messages a user can send in a 60-second window */
const MESSAGE_RATE_LIMIT = 15;

export async function sendMessage(requestId: string, content: string) {
  // ── Validate & sanitise inputs ─────────────────────────────────
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
    return { error: "Invalid request ID." };
  }

  const sanitisedContent = sanitiseText(content, LIMITS.messageContent);
  if (!sanitisedContent) {
    return { error: "Message cannot be empty." };
  }

  // ── Content filter ─────────────────────────────────────────────
  const filter = filterMessage(sanitisedContent);
  if (!filter.allowed) {
    return { error: filter.reason ?? "Message blocked by content filter." };
  }

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // ── Rate limit: 15 messages per minute per user ──────────────
    const rateCheck = checkRateLimit(`msg:${user.id}`, MESSAGE_RATE_LIMIT, 60 * 1000);
    if (!rateCheck.allowed) {
      return {
        error: `You're sending messages too quickly. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
        rateLimited: true,
      };
    }

    // Fetch request to verify it's active
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("status, student_id, professor_id")
      .eq("id", reqId)
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
        request_id: reqId,
        sender_id: user.id,
        content: sanitisedContent,
      });

    if (error) throw error;

    // Update request timestamp
    await supabase
      .from("requests")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", reqId);

    revalidatePath(`/messages/${reqId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to send message." };
  }
}

export async function closeRequest(requestId: string) {
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
      .select("student_id, professor_id")
      .eq("id", reqId)
      .single();

    if (!request) return { error: "Request not found" };
    if (request.student_id !== user.id && request.professor_id !== user.id) {
      return { error: "Unauthorized: You are not a participant in this thread." };
    }

    const { error } = await supabase
      .from("requests")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", reqId);

    if (error) throw error;

    revalidatePath(`/messages/${reqId}`);
    revalidatePath("/dashboard");
    revalidatePath("/prof/dashboard");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to close request." };
  }
}

export async function markRead(requestId: string) {
  const reqId = sanitiseText(requestId, 100);
  if (!reqId || !isValidUuid(reqId)) {
    return { error: "Invalid request ID." };
  }

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("request_id", reqId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (error) throw error;

    revalidatePath(`/messages/${reqId}`);
    revalidatePath("/dashboard");
    revalidatePath("/prof/dashboard");

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to mark messages as read." };
  }
}