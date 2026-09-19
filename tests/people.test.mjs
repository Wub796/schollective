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

test("a title typed into a name is dropped, never doubled", () => {
  const smith = { first_name: "Professor", last_name: "Smith" };
  assert.equal(P.fullName(smith), "Smith");
  assert.equal(P.facultyName(smith), "Dr. Smith", "not Dr. Professor Smith");
  assert.equal(P.facultyName({ first_name: "Professor Smith" }), "Dr. Smith", "a title typed into the first name box");
  assert.equal(P.facultyName({ first_name: "Prof.", last_name: "Smith" }), "Dr. Smith");
  assert.equal(P.facultyName({ first_name: "doctor", last_name: "Wu" }), "Dr. Wu", "however the title is spelled or cased");
  assert.equal(P.facultyName({ first_name: "Dr.", last_name: "Wu" }), "Dr. Wu", "not Dr. Dr. Wu");
  assert.equal(P.givenName({ first_name: "Professor", last_name: "Smith" }), "Smith", "greetings lose the title too");
  assert.equal(P.initialsOf(smith), "S");
  assert.equal(P.facultyName({ first_name: "Jiwoo", last_name: "Kim", preferred_name: "Professor Kim" }), "Dr. Jiwoo Kim");
  assert.equal(P.facultyName({ first_name: "Jiwoo", last_name: "Kim", preferred_name: "Prof. Jay" }), "Dr. Jay Kim");
  assert.equal(P.fullName({ first_name: "Professor" }), "Student", "a title on its own is not a name");
  assert.equal(P.fullName({ first_name: "Jane", last_name: "Doctor" }), "Jane Doctor", "a surname that reads like a title is kept");
});

test("a professor's chosen title stands in for the default, and is never doubled", () => {
  const kim = { first_name: "Jiwoo", last_name: "Kim" };
  assert.equal(P.facultyName(kim), "Dr. Jiwoo Kim", "nobody has chosen, so Dr. as before");
  assert.equal(P.facultyName({ ...kim, honorific: "Prof." }), "Prof. Jiwoo Kim");
  assert.equal(P.facultyName({ ...kim, honorific: "prof" }), "Prof. Jiwoo Kim", "however it was spelled");
  assert.equal(P.facultyName({ ...kim, honorific: "doctor" }), "Dr. Jiwoo Kim");
  assert.equal(P.facultyName({ ...kim, honorific: "Ms." }), "Ms. Jiwoo Kim");
  assert.equal(P.facultyName({ ...kim, honorific: P.NO_HONORIFIC }), "Jiwoo Kim", "shown without a title");
  assert.equal(P.facultyName({ ...kim, honorific: "   " }), "Dr. Jiwoo Kim", "an empty choice is not a choice");
  assert.equal(P.facultyName({ ...kim, honorific: "Rev." }), "Rev. Jiwoo Kim", "a title of their own is kept as typed");
  assert.equal(
    P.facultyName({ first_name: "Professor", last_name: "Kim", honorific: "Ms." }),
    "Ms. Kim",
    "a title typed into the name box is still dropped",
  );
  assert.equal(P.honorificOf(kim), "Dr.");
  assert.equal(P.honorificOf({ ...kim, honorific: P.NO_HONORIFIC }), "", "no title is an empty prefix, not the default");
  assert.equal(P.withTitle({ ...kim, honorific: "Mx." }, "Jiwoo"), "Mx. Jiwoo");
  assert.equal(P.withTitle({ ...kim, honorific: P.NO_HONORIFIC }, "Jiwoo"), "Jiwoo");
  assert.equal(P.withTitle(kim, ""), "Dr.", "no stray space when there is no name to attach it to");
  assert.equal(P.normaliseHonorific("  Prof  "), "Prof.");
  assert.equal(P.normaliseHonorific(""), null, "nothing chosen");
  assert.equal(P.normaliseHonorific(undefined), null);
});

test("every offered title survives a round trip through storage", () => {
  for (const option of P.HONORIFIC_OPTIONS) {
    assert.equal(P.normaliseHonorific(option), option);
    assert.equal(P.normaliseHonorific(option.toLowerCase().replace(".", "")), option, option);
    assert.equal(P.facultyName({ first_name: "Jiwoo", honorific: option }), `${option} Jiwoo`, option);
  }
  assert.deepEqual(
    P.HONORIFIC_CHOICES.map((choice) => choice.value),
    [...P.HONORIFIC_OPTIONS, P.NO_HONORIFIC],
    "the picker offers every title, then the choice of none",
  );
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

test("a lookup answers from the table, never from the prototype chain", () => {
  // These tables are indexed by strings that arrive from a request body, and
  // `table["constructor"]` returns a function rather than nothing.
  assert.equal(P.normaliseHonorific("constructor"), "constructor", "a title of their own, not Object.prototype");
  assert.equal(P.normaliseHonorific("toString"), "toString");
  assert.equal(P.educationLabel("constructor"), "Constructor", "an unknown slug still reads as words");
  assert.equal(P.educationLabel("hasOwnProperty"), "HasOwnProperty");
});

test("a gender is shown only when its owner chose to list one", () => {
  assert.equal(P.genderLabel("woman"), "Woman");
  assert.equal(P.genderLabel("man"), "Man");
  assert.equal(P.genderLabel("nonbinary"), "Non-binary");
  assert.equal(P.genderLabel("Non-binary"), "Non-binary", "the label reads back as well as the slug");
  assert.equal(P.genderLabel(P.NO_GENDER), null, "prefer not to say shows nothing");
  assert.equal(P.genderLabel("Prefer not to say"), null);
  assert.equal(P.genderLabel("pirate"), null, "a value we do not offer is not a label");
  assert.equal(P.genderLabel(""), null);
  assert.equal(P.genderLabel(null), null);
  assert.equal(P.genderLabel(undefined), null);
});

test("a gender is stored as one of the offered slugs, or not at all", () => {
  assert.equal(P.normaliseGender("woman"), "woman");
  assert.equal(P.normaliseGender("  Woman  "), "woman");
  assert.equal(P.normaliseGender("Non-binary"), "nonbinary");
  assert.equal(P.normaliseGender("prefer not to say"), P.NO_GENDER, "however the option was phrased");
  assert.equal(P.normaliseGender("pirate"), null);
  assert.equal(P.normaliseGender(""), null);
  assert.deepEqual(
    P.GENDER_CHOICES.map((choice) => choice.value),
    ["woman", "man", "nonbinary", P.NO_GENDER],
    "the picker's options are the vocabulary the write path accepts",
  );
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
