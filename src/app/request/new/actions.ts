"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function submitMentorshipRequest(formData: FormData) {
  const supabase = await createClient();

  // 1. Authenticate Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Unauthorized" };

  const profId = formData.get("prof_id") as string;
  const topic = formData.get("topic") as string;
  const background = formData.get("background") as string;
  const goals = formData.get("goals") as string;

  if (!profId || !topic || !background || !goals) {
    return { error: "Missing required fields" };
  }

  // 2. Transactional Insertion
  // Insert Request
  const { data: request, error: requestError } = await supabase
    .from("requests")
    .insert({
      student_id: session.user.id,
      professor_id: profId,
      status: "pending",
      topic: topic,
      expected_outcome: goals
    })
    .select()
    .single();

  if (requestError) return { error: requestError.message };

  // Concatenate message content
  const initialMessageContent = `
**Academic Background:**
${background}

**Mentorship Goals:**
${goals}
  `.trim();

  // Insert Initial Message
  const { error: messageError } = await supabase
    .from("messages")
    .insert({
      request_id: request.id,
      sender_id: session.user.id,
      content: initialMessageContent
    });

  if (messageError) {
    console.error("Initial message error:", messageError);
  }

  revalidatePath("/dashboard");
  return { success: true };
}
