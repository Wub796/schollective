"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { isFeedbackStatus } from "@/lib/feedback";
import { isValidId } from "@/lib/security";
import { runAs } from "@/lib/neon/user-context";
import { deleteFeedbackReport, setFeedbackStatus } from "@/lib/neon/feedback";
import { internalError } from "@/lib/utils";

/**
 * Admin actions on the feedback queue.
 *
 * Both start with `requireAdmin()`, not with a page-level guard: a server action
 * is a publicly invokable endpoint whose id ships in the client bundle, so the
 * page redirect protects the page and nothing else. The update and delete
 * policies on `feedback_reports` are `USING (app_is_admin())` as well, so the
 * same rule is enforced by Postgres underneath (db/migrations/0013).
 */

export async function updateFeedbackStatus(id: string, status: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  if (!isValidId(id) || !isFeedbackStatus(status)) {
    return { error: "That report could not be found." };
  }

  try {
    const changed = await runAs(auth.user.id, async () => setFeedbackStatus(id, status));
    if (!changed) return { error: "That report could not be updated." };

    revalidatePath("/admin/feedback");
    return { success: true as const };
  } catch (err: unknown) {
    return { error: internalError("updateFeedbackStatus", err, "Update failed.") };
  }
}

export async function removeFeedbackReport(id: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  if (!isValidId(id)) return { error: "That report could not be found." };

  try {
    const deleted = await runAs(auth.user.id, async () => deleteFeedbackReport(id));
    if (!deleted) return { error: "That report could not be removed." };

    revalidatePath("/admin/feedback");
    return { success: true as const };
  } catch (err: unknown) {
    return { error: internalError("removeFeedbackReport", err, "Removal failed.") };
  }
}
