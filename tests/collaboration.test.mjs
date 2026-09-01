/**
 * Group-thread rules in src/lib/collaboration.ts.
 *
 * The same membership transitions are enforced in the database by
 * `guard_request_member_change` (db/migrations/0008). The table below is the
 * specification both implement; if either side changes, this is where the
 * disagreement should surface first, as a failing test rather than an action
 * that offers a button the database then refuses.
 */

import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/lib/collaboration.ts";
import { MEMBER_STATUSES, REQUEST_STATUSES } from "../src/lib/status.ts";

const ALLOWED = {
  self: ["invited->joined", "invited->declined", "joined->left"],
  lead: ["invited->removed", "joined->removed", "declined->invited", "left->invited", "removed->invited"],
  professor: ["invited->removed", "joined->removed"],
};

test("membership transitions match the specification exactly", () => {
  for (const actor of Object.keys(ALLOWED)) {
    for (const from of MEMBER_STATUSES) {
      for (const to of MEMBER_STATUSES) {
        const expected = ALLOWED[actor].includes(`${from}->${to}`);
        assert.equal(
          C.isAllowedMemberTransition(actor, from, to),
          expected,
          `${actor}: ${from} -> ${to} should be ${expected ? "allowed" : "refused"}`,
        );
      }
    }
  }
});

test("a removed student can never re-admit themself", () => {
  for (const to of MEMBER_STATUSES) {
    assert.equal(C.isAllowedMemberTransition("self", "removed", to), false, `self: removed -> ${to}`);
  }
});

test("joining and inviting need an open request; leaving and declining never do", () => {
  assert.equal(C.transitionNeedsOpenRequest("joined"), true);
  assert.equal(C.transitionNeedsOpenRequest("invited"), true);
  for (const to of ["declined", "left", "removed"]) {
    assert.equal(C.transitionNeedsOpenRequest(to), false, to);
  }
});

test("only the lead invites, and only into an open request", () => {
  for (const status of REQUEST_STATUSES) {
    const open = ["pending", "viewed", "active"].includes(status);
    assert.equal(C.canInviteCollaborators("lead", status), open, `lead on ${status}`);
    assert.equal(C.canInviteCollaborators("member", status), false);
    assert.equal(C.canInviteCollaborators("professor", status), false);
    assert.equal(C.canInviteCollaborators(null, status), false);
  }
});

test("the lead and professor remove live memberships; members do not remove anyone", () => {
  for (const role of ["lead", "professor"]) {
    assert.equal(C.canRemoveMember(role, "invited"), true);
    assert.equal(C.canRemoveMember(role, "joined"), true);
    assert.equal(C.canRemoveMember(role, "left"), false);
  }
  assert.equal(C.canRemoveMember("member", "joined"), false);
  assert.equal(C.canRemoveMember(null, "joined"), false);
});

test("closing is for the lead and professor on an unfinished thread; members leave", () => {
  assert.equal(C.canCloseThread("lead", "active"), true);
  assert.equal(C.canCloseThread("professor", "pending"), true);
  assert.equal(C.canCloseThread("member", "active"), false, "a member must not end everyone's thread");
  assert.equal(C.canCloseThread("lead", "closed"), false);
  assert.equal(C.canCloseThread("lead", "declined"), false);
  assert.equal(C.canLeaveThread("member"), true);
  assert.equal(C.canLeaveThread("lead"), false, "the lead closes rather than leaves");
  assert.equal(C.canLeaveThread("professor"), false);
});

test("threadAudience is everyone on the thread except the actor, each once", () => {
  const thread = { student_id: "lead0001", professor_id: "prof0001" };
  assert.deepEqual(C.threadAudience(thread, ["mem00001", "mem00002"], "mem00001"), ["lead0001", "prof0001", "mem00002"]);
  assert.deepEqual(C.threadAudience(thread, [], "prof0001"), ["lead0001"]);
  assert.deepEqual(C.threadAudience(thread, ["lead0001", "mem00001", "mem00001"], "outsider"), ["lead0001", "prof0001", "mem00001"]);
});

test("collaborator ids from a form drop junk, the lead and duplicates", () => {
  const { ids, overLimit } = C.normaliseCollaboratorIds(
    ["stu_ben_0002", "stu_ben_0002", "lead0001", "", "x", 42, null, "<script>", "stu_dev_0004"],
    "lead0001",
  );
  assert.deepEqual(ids, ["stu_ben_0002", "stu_dev_0004"]);
  assert.equal(overLimit, false);
});

test("an over-limit selection is flagged, not silently truncated", () => {
  const values = Array.from({ length: C.MAX_COLLABORATORS + 1 }, (_, i) => `student0${i}0`);
  const { ids, overLimit } = C.normaliseCollaboratorIds(values, "lead0001");
  assert.equal(ids.length, C.MAX_COLLABORATORS + 1);
  assert.equal(overLimit, true);
});

test("remaining slots never go negative", () => {
  assert.equal(C.remainingCollaboratorSlots(0), C.MAX_COLLABORATORS);
  assert.equal(C.remainingCollaboratorSlots(C.MAX_COLLABORATORS), 0);
  assert.equal(C.remainingCollaboratorSlots(C.MAX_COLLABORATORS + 3), 0);
  assert.equal(C.remainingCollaboratorSlots(-2), C.MAX_COLLABORATORS);
});
