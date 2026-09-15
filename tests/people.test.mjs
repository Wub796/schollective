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

test("a preferred name is read as a first name or as a whole name", () => {
  assert.equal(P.preferredNameKind("", "Wu"), "none");
  assert.equal(P.preferredNameKind("   ", "Wu"), "none");
  assert.equal(P.preferredNameKind("Benny", "Wu"), "given");
  assert.equal(P.preferredNameKind("Benny Wu", "Wu"), "full");
  assert.equal(P.preferredNameKind("benny WU", "Wu"), "full", "case does not matter");
  assert.equal(P.preferredNameKind("José Nuñez", "Nunez"), "full", "nor do accents");
  assert.equal(P.preferredNameKind("Mary Jane", "Watson"), "given", "a two-word first name keeps the surname after it");
  assert.equal(P.preferredNameKind("Ana de la Cruz", "de la Cruz"), "full", "a multi-word surname matches as a whole");
  assert.equal(P.preferredNameKind("Ben Wu", null), "full", "with no surname on file, more than one word is a whole name");
  assert.equal(P.preferredNameKind("Ben", null), "given");
});

test("a whole preferred name never repeats or drops the surname", () => {
  const ben = { first_name: "Benjamin", last_name: "Wu" };
  assert.equal(P.fullName({ ...ben, preferred_name: "Benny Wu" }), "Benny Wu", "not Benny Wu Wu");
  assert.equal(P.givenName({ ...ben, preferred_name: "Benny Wu" }), "Benny", "greetings use only the given part");
  assert.equal(P.fullName({ ...ben, preferred_name: "Benny" }), "Benny Wu");
  assert.equal(P.fullName({ ...ben, preferred_name: "benny wu" }), "benny Wu", "the surname on file keeps its spelling");
  assert.equal(P.fullName({ ...ben, preferred_name: "Wu" }), "Benjamin Wu", "only the surname typed falls back to the first name");
  assert.equal(P.fullName({ first_name: "Mary", last_name: "Watson", preferred_name: "Mary Jane" }), "Mary Jane Watson");
  assert.equal(P.fullName({ first_name: "Ben", preferred_name: "Benny Wu" }), "Benny Wu");
  assert.equal(P.facultyName({ ...ben, preferred_name: "  Ben   Wu " }), "Dr. Ben Wu", "whitespace is collapsed");
  assert.deepEqual(
    P.nameParts({ first_name: "Ana", last_name: "de la Cruz", preferred_name: "Anita de la Cruz" }),
    { given: "Anita", family: "de la Cruz" },
  );
  assert.equal(P.initialsOf({ ...ben, preferred_name: "Benny Wu" }), "BW");
  assert.equal(P.listNames([{ ...ben, preferred_name: "Benny Wu" }, { first_name: "Dev" }]), "Benny and Dev");
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
