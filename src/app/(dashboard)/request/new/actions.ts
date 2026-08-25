"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitiseText, isValidUuid, LIMITS } from "@/lib/security";

export async function submitMentorshipRequest(formData: FormData) {
  const supabase = await createClient();

  // 1. Authenticate Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Unauthorized" };

  const profId = sanitiseText(formData.get("prof_id"), 100);
  const topic = sanitiseText(formData.get("topic"), LIMITS.topic);
  const background = sanitiseText(formData.get("background"), LIMITS.background);
  const goals = sanitiseText(formData.get("goals"), LIMITS.goal);

  if (!profId || !isValidUuid(profId)) {
    return { error: "Invalid professor ID." };
  }
  if (!topic) {
    return { error: "Please provide a topic for your request." };
  }
  if (!background) {
    return { error: "Please describe your academic background." };
  }
  if (!goals) {
    return { error: "Please describe your mentorship goals." };
  }

  // 1.5. Rate Limiting Check: Max 5 requests per 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("student_id", session.user.id)
    .gt("created_at", twentyFourHoursAgo);

  if (countError) return { error: "Failed to check request rate limit." };
  if (count !== null && count >= 5) {
    return { error: "Daily request limit reached. You can send up to 5 requests per day.", limitReached: true };
  }

  // 2. Transactional Insertion
  const { data: request, error: requestError } = await supabase
    .from("requests")
    .insert({
      student_id: session.user.id,
      professor_id: profId,
      status: "pending",
      topic,
      expected_outcome: goals,
    })
    .select()
    .single();

  if (requestError) return { error: requestError.message };

  // Concatenate message content
  const initialMessageContent = [
    `**Academic Background:**`,
    background,
    ``,
    `**Mentorship Goals:**`,
    goals,
  ].join("\n").trim();

  // Insert Initial Message
  const { error: messageError } = await supabase
    .from("messages")
    .insert({
      request_id: request.id,
      sender_id: session.user.id,
      content: initialMessageContent,
    });

  if (messageError) {
    console.error("Initial message error:", messageError);
  }

  revalidatePath("/dashboard");
  return { success: true };
}