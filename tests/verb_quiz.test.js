import { filterVerbPool, generateVerbQuizOptions, verifyVerbSpelling } from "../src/verb_quiz.js";

export function testVerbQuizSuite(assert) {
  assert.suite("Verb Quiz Module Tests");

  const mockVerbs = [
    { id: "A_a", verbClass: "1類動詞", masuForm: "遊びます", teForm: "あそんで", dictForm: "あそぶ" },
    { id: "B_b", verbClass: "1類動詞", masuForm: "泳ぎます", teForm: "およいで", dictForm: "およぐ" },
    { id: "C_c", verbClass: "1類動詞", masuForm: "書きます", teForm: "かいて", dictForm: "かく" },
    { id: "D_d", verbClass: "2類動詞", masuForm: "開けます", teForm: "あけて", dictForm: "あける" },
    { id: "E_e", verbClass: "2類動詞", masuForm: "閉めます", teForm: "しめて", dictForm: "しめる" }
  ];

  assert.test("filterVerbPool should filter by verbClass and bookmark", () => {
    // Test filter class
    const resClass = filterVerbPool(mockVerbs, { selectedClasses: ["2類動詞"] });
    assert.equal(resClass.length, 2, "Should return only 2类 verbs");
    assert.equal(resClass[0].masuForm, "開けます", "Should match 開けます");

    // Test filter bookmark
    const resBookmark = filterVerbPool(mockVerbs, { bookmarkOnly: true, bookmarkedIds: ["B_b", "D_d"] });
    assert.equal(resBookmark.length, 2, "Should filter bookmarked verbs");
  });

  assert.test("generateVerbQuizOptions should return correct options with same-class distractors", () => {
    const target = mockVerbs[0]; // 遊びます (1類動詞)
    const options = generateVerbQuizOptions(target, "teForm", mockVerbs);

    assert.equal(options.length, 4, "Should generate exactly 4 options");
    assert.ok(options.includes("あそんで"), "Must contain the correct answer");

    // Check that class 2 options like 'あけて' or 'しめて' are NOT included unless fallback happens
    // Since mockVerbs has exactly three class 1 verbs, we have correct answer (あそんで) + two distractors (およいで, かいて).
    // The 4th option MUST fallback to class 2, meaning it should contain one of (あけて, しめて).
    assert.ok(options.includes("あそんで") && (options.includes("あけて") || options.includes("しめて")), "Distractor fallback should have occurred");
  });

  assert.test("verifyVerbSpelling should match loosely", () => {
    assert.ok(verifyVerbSpelling("あそんで", "あそんで"), "Exact match");
    assert.ok(verifyVerbSpelling("  あそんで  ", "あそんで"), "Spaces ignored");
    assert.ok(verifyVerbSpelling("アソンデ", "あそんで"), "Katakana conversion");
  });
}
