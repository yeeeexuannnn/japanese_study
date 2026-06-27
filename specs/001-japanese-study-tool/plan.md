# Implementation Plan: 單字庫新增詞性與原形 (分開獨立欄位設計)

**Branch**: `001-japanese-study-tool` | **Date**: 2026-06-28 | **Spec**: [spec.md](file:///c:/sourceTree/japanese_study/specs/001-japanese-study-tool/spec.md)

您提出了非常專業的架構建議！將「詞性」與「原形」在單字庫表格中**開闢為兩個獨立的欄位**，確實能大幅簡化程式解析的複雜度，並且讓語音播放及未來的擴充（例如原形測驗）更加穩定且易於維護。

本計畫已更新為雙獨立欄位設計。

## Proposed Changes

### 1. 單字庫資料庫更新 (雙欄位設計)
*   **修改檔案：** [vocabulary_list.md](file:///c:/sourceTree/japanese_study/specs/vocabulary_list.md)
*   **變更細節：** 
    *   在表格中新增兩個獨立的欄位：「詞性」與「原形」。
    *   **「詞性」欄位值：** `名詞`、`な形容詞`、`い形容詞`、`1類動詞`、`2類動詞`、`3類動詞`、`副詞`、`短句`。
    *   **「原形」欄位值：** 動詞填入其辭書形（如 `遊ぶ`、`忘れる`、`散步する`），非動詞欄位則留空。
    *   對現有的 382 個單字進行智能規則分類與人工校對。

### 2. 資料實體模型擴充
*   **修改檔案：** [data-model.md](file:///c:/sourceTree/japanese_study/specs/001-japanese-study-tool/data-model.md)
*   **變更細節：** 在 `VocabularyItem` 介面中新增兩個屬性：
    ```typescript
    interface VocabularyItem {
      // ... 既有欄位
      pos: string;            // 詞性標籤 (如 "1類動詞")
      dictionaryForm: string; // 動詞原形 (如 "遊ぶ"，非動詞為空字串)
    }
    ```

### 3. 單字庫解析器 (Parser) 更新
*   **修改檔案：** [src/parser.js](file:///c:/sourceTree/japanese_study/src/parser.js)
*   **變更細節：** 
    *   修改 Markdown 解析邏輯，支持六欄位表格，讀取並提取「詞性」與「原形」資料並注入 `pos` 與 `dictionaryForm` 屬性。

### 4. 網頁版 UI 與樣式更新
*   **修改檔案：** 
    *   [index.html](file:///c:/sourceTree/japanese_study/index.html) — 
        *   在學習單字卡背面 (`card-back`) 新增用以展示詞性 Badge 與原形區域的元件。
        *   在測驗回饋面板 (`quiz-feedback-panel`) 調整佈局以動態顯示詞性與原形。
    *   [index.css](file:///c:/sourceTree/japanese_study/index.css) — 
        *   新增 `.vocab-pos-badge` 樣式，並依詞性進行彩色標籤設定。
        *   設計原形區塊樣式（如 `原形: 遊ぶ 🔊`）及發音按鈕。
    *   [src/ui.js](file:///c:/sourceTree/japanese_study/src/ui.js) — 
        *   更新 `renderFlashcard`，若 `item.dictionaryForm` 存在則渲染原形區塊並綁定獨立發音事件，無須再以正則拆分字串。
        *   更新 `showQuizFeedback` 與 `renderSummary` 函數以渲染獨立的詞性 Badge 與原形。

### 5. 測試套件更新
*   **修改檔案：** [tests/parser.test.js](file:///c:/sourceTree/japanese_study/tests/parser.test.js)
*   **變更細節：** 修改單元測試的 mock 表格為六欄位，並斷言 `pos` 與 `dictionaryForm` 解析正確。

---

## Verification Plan

### Automated Tests
*   執行本地單元測試，驗證雙欄位是否被正確解析：
    ```bash
    npm test
    ```

### Manual Verification
1.  在本機啟動 `start-server.bat`。
2.  進入「單字卡學習模式」，確認翻卡背面顯示彩色詞性 Badge，若為動詞，點選原形旁邊的 🔊 可播放辭書形原音。
3.  進入測驗模式，答題後的回饋面版與結算面板應呈現獨立的彩色詞性 Badge。
