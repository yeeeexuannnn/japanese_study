import { parseVerbConjugationMarkdown } from "../src/verb_parser.js";

export function testVerbParserSuite(assert) {
  assert.suite("Verb Parser Module Tests");

  assert.test("parseVerbConjugationMarkdown should parse verb classes and rows", () => {
    const mockMarkdown = `
# 大家的日本語 動詞活用對照表

## 1類動詞 (Class 1)

| 單字 (ます形) | 讀音(平假名) | て形 | 字典形 | ない形 | た形 | 中文翻譯 | 課數 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 遊びます | あそびます | あそんで | あそぶ | あそばない | あそんだ | 玩 | 13 |
| 洗います | あらいます | あらって | あらう | あらわない | あらった | 洗 | 18 |

## 2類動詞 (Class 2)

| 單字 (ます形) | 讀音(平假名) | て形 | 字典形 | ない形 | た形 | 中文翻譯 | 課數 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 開けます | あけます | あけて | あける | あけない | あけた | 開（門、窗等） | 14 |
`;

    const result = parseVerbConjugationMarkdown(mockMarkdown);

    assert.equal(result.length, 3, "Should parse exactly 3 verbs");

    // First verb assertion (1類動詞)
    assert.equal(result[0].masuForm, "遊びます", "First verb masuForm should be 遊びます");
    assert.equal(result[0].reading, "あそびます", "First verb reading should be あそびます");
    assert.equal(result[0].teForm, "あそんで", "First verb teForm should be あそんで");
    assert.equal(result[0].dictForm, "あそぶ", "First verb dictForm should be あそぶ");
    assert.equal(result[0].naiForm, "あそばない", "First verb naiForm should be あそばない");
    assert.equal(result[0].taForm, "あそんだ", "First verb taForm should be あそんだ");
    assert.equal(result[0].translation, "玩", "First verb translation should be 玩");
    assert.equal(result[0].lesson, "13", "First verb lesson should be 13");
    assert.equal(result[0].verbClass, "1類動詞", "First verb verbClass should be 1類動詞");

    // Third verb assertion (2類動詞)
    assert.equal(result[2].masuForm, "開けます", "Third verb masuForm should be 開けます");
    assert.equal(result[2].verbClass, "2類動詞", "Third verb verbClass should be 2類動詞");
  });
}
