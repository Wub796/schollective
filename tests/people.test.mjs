/**
 * Names and friendship state in src/lib/people.ts — the helpers every social
 * card, row and chat bubble renders through.
 */

import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../src/lib/people.ts";

test("the preferred name wins, then the first name, then the fallback", () => {
  assert.equal(P.givenName({ first_name: "Adeline", preferred_name: "Ada" }), "Ada");
  assert.equal(P.givenName({ first_name: "Adeline", preferred_name: "  " }), "Adeline");
  assert.equal(P.givenName({}), "Student");
  assert.equal(P.givenName(null, "Collaborator"), "Collaborator");
});

test("full names never carry stray whitespace or the word null", () => {
  assert.equal(P.fullName({ first_name: "Ada", last_name: "Lovelace" }), "Ada Lovelace");
  assert.equal(P.fullName({ first_name: "Ada", last_name: null }), "Ada");
  assert.equal(P.fullName({ last_name: "Lovelace" }), "Lovelace");
  assert.equal(P.fullName({}), "Student");
  assert.equal(P.facultyName({ first_name: "Jiwoo", last_name: "Kim" }), "Dr. Jiwoo Kim");
  assert.equal(P.facultyName(null), "Dr. Professor");
});

test("initials are two uppercase letters, or a single placeholder", () => {
  assert.equal(P.initialsOf({ first_name: "ada", last_name: "lovelace" }), "AL");
  assert.equal(P.initialsOf({ preferred_name: "Ada" }), "A");
  assert.equal(P.initialsOf({}), "?");
  assert.equal(P.initialsOf(undefined), "?");
});

test("education level slugs read as words", () => {
  assert.equal(P.educationLabel("high-school-senior"), "High school senior");
  assert.equal(P.educationLabel("undergraduate-upper"), "Upper-division undergraduate");
  assert.equal(P.educationLabel("undergraduate"), "Undergraduate");
  assert.equal(P.educationLabel("phd"), "PhD student");
  assert.equal(P.educationLabel("gap-year"), "Gap year", "an unknown slug still reads as words");
  assert.equal(P.educationLabel(""), null);
  assert.equal(P.educationLabel(null), null);
});

test("name lists read naturally and skip people with no name", () => {
  const ben = { first_name: "Ben" };
  const dev = { first_name: "Devendra", preferred_name: "Dev" };
  const cyd = { first_name: "Cyd" };
  assert.equal(P.listNames([]), "");
  assert.equal(P.listNames([ben]), "Ben");
  assert.equal(P.listNames([ben, dev]), "Ben and Dev");
  assert.equal(P.listNames([ben, dev, cyd]), "Ben, Dev and 1 other");
  assert.equal(P.listNames([ben, dev, cyd, ben]), "Ben, Dev and 2 others");
  assert.equal(P.listNames([ben, {}, null, dev]), "Ben and Dev");
});

test("friendship state is read from the viewer's side of the edge", () => {
  const pending = { requester_id: "ada00001", addressee_id: "ben00002", status: "pending" };
  assert.equal(P.friendshipStateFor(pending, "ada00001"), "outgoing");
  assert.equal(P.friendshipStateFor(pending, "ben00002"), "incoming");
  assert.equal(P.friendshipStateFor({ ...pending, status: "accepted" }, "ben00002"), "friends");
  assert.equal(P.friendshipStateFor(null, "ada00001"), "none");
  assert.equal(P.friendshipStateFor(pending, "cyd00003"), "none", "an edge between other people is not the viewer's");
});
