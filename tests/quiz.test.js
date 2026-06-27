import { filterWordPool, generateQuizOptions, verifyReadingInput, generateReadingHint } from "../src/quiz.js";

export function testQuizSuite(assert) {
  assert.suite("Quiz Module Tests");

  const mockDb = [
    { id: "A_a", lesson: "第 13 課", word: "遊びます", reading: "あそびます", translation: "玩" },
    { id: "B_b", lesson: "第 13 課", word: "泳ぎます", reading: "およぎます", translation: "游泳" },
    { id: "C_c", lesson: "第 14 課", word: "開けます", reading: "あけます", translation: "開" },
    { id: "D_d", lesson: "第 14 課", word: "閉めます", reading: "しめます", translation: "關" }
  ];

  assert.test("filterWordPool should filter by selected lessons", () => {
    const result = filterWordPool(mockDb, { selectedLessons: ["第 13 課"] });
    assert.equal(result.length, 2, "Should return only 2 items from Lesson 13");
    assert.equal(result[0].word, "遊びます", "Should contain 遊びます");
  });

  assert.test("filterWordPool should filter by bookmarks only", () => {
    const result = filterWordPool(mockDb, { bookmarkOnly: true, bookmarkedIds: ["C_c"] });
    assert.equal(result.length, 1, "Should filter bookmarks");
    assert.equal(result[0].word, "開けます", "Should return the bookmarked word");
  });

  assert.test("generateQuizOptions should create 4 options including correct answer", () => {
    const target = mockDb[0]; // 遊びます, translation: "玩"
    const options = generateQuizOptions(target, mockDb, mockDb, "jp_to_zh");
    
    assert.equal(options.length, 4, "Should generate exactly 4 options");
    assert.ok(options.includes("玩"), "Options must include the correct answer");
    
    // Check uniqueness
    const unique = [...new Set(options)];
    assert.equal(unique.length, 4, "Options must be completely unique");
  });

  assert.test("verifyReadingInput should validate reading inputs loosely", () => {
    assert.ok(verifyReadingInput("あそびます", "あそびます"), "Exact match is valid");
    assert.ok(verifyReadingInput("  あそびます  ", "あそびます"), "Whitespace is ignored");
    assert.ok(verifyReadingInput("あそび　ます", "あそびます"), "Japanese full-width space is ignored");
    assert.ok(verifyReadingInput("ぷーる", "プール"), "Katakana matching is supported");
  });

  assert.test("generateReadingHint should return first char and length", () => {
    const hint = generateReadingHint("あそびます");
    assert.equal(hint.firstChar, "あ", "First character should be あ");
    assert.equal(hint.length, 5, "Length should be 5");
  });
}
