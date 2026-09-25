"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { isValidId } from "@/lib/security";
import { isSafetyReportStatus } from "@/lib/youth-protection";
import { runAs } from "@/lib/neon/user-context";
import {
  deleteSafetyReport,
  listSafetyEvidence,
  setSafetyReportStatus,
} from "@/lib/neon/youth-protection";
import { internalError } from "@/lib/utils";

/**
 * Admin actions on the safety queue.
 *
 * Both start with `requireAdmin()`, not with a page-level guard: a server action
 * is a publicly invokable endpoint whose id ships in the client bundle, so the
 * page redirect protects the page and nothing else. The update and delete
 * policies on `safety_reports` are `USING (app_is_admin())` as well, so the same
 * rule is enforced by Postgres underneath (db/migrations/0014).
 *
 * There is no action for editing a report's text or removing its evidence. A
 * report is a record of what somebody said at a moment, and the copy of the
 * thread is the reason the record is worth anything; an interface that could
 * rewrite either would make both worthless the moment anyone doubted them. An
 * admin can record what they did in `admin_note` and close the report.
 */

/**
 * The messages copied into one report, fetched when an admin opens it.
 *
 * On demand rather than with the queue, because the queue would otherwise carry
 * every copied transcript in the product: two hundred reports with two hundred
 * messages each is a payload nobody reads and every admin pays for.
 */
export async function loadSafetyEvidence(reportId: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  if (!isValidId(reportId)) return { error: "That report could not be found." };

  try {
    const evidence = await runAs(auth.user.id, async () => listSafetyEvidence(reportId));
    return { success: true as const, evidence };
  } catch (err: unknown) {
    return { error: internalError("loadSafetyEvidence", err, "Could not load the evidence.") };
  }
}

export async function updateSafetyStatus(id: string, status: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  if (!isValidId(id) || !isSafetyReportStatus(status)) {
    return { error: "That report could not be found." };
  }

  try {
    const changed = await runAs(auth.user.id, async () => setSafetyReportStatus(id, status));
    if (!changed) return { error: "That report could not be updated." };

    revalidatePath("/admin/safety");
    revalidatePath("/admin/dashboard");
    return { success: true as const };
  } catch (err: unknown) {
    return { error: internalError("updateSafetyStatus", err, "Update failed.") };
  }
}

/**
 * Deletes a report and, with it, the evidence copied into it.
 *
 * Offered, and deliberately not the easy button: the queue's own copy is the
 * only copy that survives the accounts being deleted, so this is the one action
 * in the admin surface that destroys something unrecoverable. It stays because
 * a report containing a child's account of abuse is data about a child, and a
 * parent asking for it to be removed is a request the platform has to be able to
 * honour.
 */
export async function removeSafetyReport(id: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { error: auth.error };

  if (!isValidId(id)) return { error: "That report could not be found." };

  try {
    const deleted = await runAs(auth.user.id, async () => deleteSafetyReport(id));
    if (!deleted) return { error: "That report could not be removed." };

    revalidatePath("/admin/safety");
    revalidatePath("/admin/dashboard");
    return { success: true as const };
  } catch (err: unknown) {
    return { error: internalError("removeSafetyReport", err, "Removal failed.") };
  }
}
