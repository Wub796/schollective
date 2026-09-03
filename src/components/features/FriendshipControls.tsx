"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Clock, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { ActionPill } from "@/components/ui/ActionPill";
import {
  blockStudent,
  cancelFriendRequest,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
  unblockStudent,
} from "@/app/(dashboard)/friends/actions";
import type { FriendshipState } from "@/lib/people";

type Result = { success: true; state?: FriendshipState } | { error: string };

/** Runs one action at a time, surfaces its error, and refreshes the server data on success. */
function useFriendAction(onState?: (state: FriendshipState) => void) {
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);

  const run = async (key: string, action: () => Promise<Result>, successMessage?: string) => {
    setRunning(key);
    try {
      const result = await action();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      if (result.state && onState) onState(result.state);
      if (successMessage) toast.success(successMessage);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setRunning(null);
    }
  };

  return { running, run };
}

interface FriendshipControlsProps {
  studentId: string;
  /** Used in confirmations and toasts. */
  studentName: string;
  initialState: FriendshipState;
  /** Offer Block alongside the other actions. */
  showBlock?: boolean;
}

/** The friend actions that make sense for where the viewer stands with a student. */
export function FriendshipControls({ studentId, studentName, initialState, showBlock = false }: FriendshipControlsProps) {
  const [state, setState] = useState<FriendshipState>(initialState);
  const { running, run } = useFriendAction(setState);

  // A refresh after someone else's action (they accepted, or cancelled) is the
  // source of truth; local state only bridges the gap until it arrives.
  useEffect(() => setState(initialState), [initialState]);

  const busy = running !== null;

  const block = () => {
    const confirmed = confirm(
      `Block ${studentName}? They won't be able to find you, send you friend requests or invite you to collaborate, and any pending requests between you are withdrawn.`,
    );
    if (confirmed) void run("block", () => blockStudent(studentId), `${studentName} is blocked.`);
  };

  return (
    <>
      {state === "none" && (
        <ActionPill
          tone="primary"
          icon={<UserPlus size={12} aria-hidden="true" />}
          loading={running === "add"}
          disabled={busy}
          onClick={() => run("add", () => sendFriendRequest(studentId), "Friend request sent.")}
        >
          Add Friend
        </ActionPill>
      )}

      {state === "outgoing" && (
        <ActionPill
          tone="quiet"
          icon={<Clock size={12} aria-hidden="true" />}
          loading={running === "cancel"}
          disabled={busy}
          title="Cancel this friend request"
          onClick={() => run("cancel", () => cancelFriendRequest(studentId))}
        >
          Requested · Cancel
        </ActionPill>
      )}

      {state === "incoming" && (
        <>
          <ActionPill
            tone="primary"
            icon={<Check size={12} aria-hidden="true" />}
            loading={running === "accept"}
            disabled={busy}
            onClick={() => run("accept", () => respondToFriendRequest(studentId, "accept"), `You and ${studentName} are now friends.`)}
          >
            Accept
          </ActionPill>
          <ActionPill
            tone="quiet"
            icon={<X size={12} aria-hidden="true" />}
            loading={running === "decline"}
            disabled={busy}
            onClick={() => run("decline", () => respondToFriendRequest(studentId, "decline"))}
          >
            Decline
          </ActionPill>
        </>
      )}

      {state === "friends" && (
        <ActionPill
          tone="quiet"
          icon={<UserMinus size={12} aria-hidden="true" />}
          loading={running === "remove"}
          disabled={busy}
          onClick={() => {
            if (confirm(`Remove ${studentName} from your friends?`)) {
              void run("remove", () => removeFriend(studentId));
            }
          }}
        >
          Remove
        </ActionPill>
      )}

      {showBlock && (
        <ActionPill
          tone="danger"
          icon={<Ban size={12} aria-hidden="true" />}
          loading={running === "block"}
          disabled={busy}
          aria-label={`Block ${studentName}`}
          title={`Block ${studentName}`}
          onClick={block}
        >
          Block
        </ActionPill>
      )}
    </>
  );
}

export function UnblockButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const { running, run } = useFriendAction();
  return (
    <ActionPill
      tone="quiet"
      loading={running !== null}
      onClick={() => run("unblock", () => unblockStudent(studentId), `${studentName} is unblocked.`)}
    >
      Unblock
    </ActionPill>
  );
}
