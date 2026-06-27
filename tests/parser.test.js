import { parseVocabularyMarkdown } from "../src/parser.js";

export function testParserSuite(assert) {
  assert.suite("Parser Module Tests");

  assert.test("parseVocabularyMarkdown should extract sections and rows", () => {
    const mockMarkdown = `
# 大家的日本語2 整理單字表

## 第 13 課

### 核心單字
| 單字 | 讀音(50音) | 中文翻譯 | 詞性 | 原形 | 註解 / 搭配詞 |
| --- | --- | --- | --- | --- | --- |
| 遊びます | あそびます | 玩、遊玩 | 1類動詞 | 遊ぶ |  |
| 疲れます | つかれます | 疲累 | 2類動詞 | 疲れる | 常用「疲れました」 |

### 會話與相關單字
| 單字 | 讀音(50音) | 中文翻譯 | 詞性 | 原形 | 註解 / 搭配詞 |
| --- | --- | --- | --- | --- | --- |
| 定食 | ていしょく | 套餐 | 名詞 |  |  |
`;

    const result = parseVocabularyMarkdown(mockMarkdown);

    assert.equal(result.length, 3, "Should parse exactly 3 items");
    
    // First item assertion
    assert.equal(result[0].word, "遊びます", "First word should be 遊びます");
    assert.equal(result[0].reading, "あそびます", "First reading should be あそびます");
    assert.equal(result[0].translation, "玩、遊玩", "First translation should be 玩、遊玩");
    assert.equal(result[0].pos, "1類動詞", "First pos should be 1類動詞");
    assert.equal(result[0].dictionaryForm, "遊ぶ", "First dictionaryForm should be 遊ぶ");
    assert.equal(result[0].lesson, "第 13 課", "First lesson should be 第 13 課");
    assert.equal(result[0].section, "核心單字", "First section should be 核心單字");
    
    // Third item assertion (from dialogue section)
    assert.equal(result[2].word, "定食", "Third word should be 定食");
    assert.equal(result[2].pos, "名詞", "Third pos should be 名詞");
    assert.equal(result[2].dictionaryForm, "", "Third dictionaryForm should be empty string");
    assert.equal(result[2].section, "會話與相關單字", "Third section should be 會話與相關單字");
  });
}
