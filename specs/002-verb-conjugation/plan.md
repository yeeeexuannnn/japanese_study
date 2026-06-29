# Implementation Plan: 動詞活用與進度儀表板模組 (Implemented)

**Branch**: `002-verb-conjugation` | **Date**: 2026-06-30 | **Spec**: [spec.md](file:///c:/sourceTree/japanese_study/specs/002-verb-conjugation/spec.md)

本模組以 SPA 單頁應用架構實作，最外層新增導覽列切換「單字學習」、「動詞活用」與「學習進度」。

---

## Proposed Changes (實作細節)

### 1. 資料解析器
*   **[NEW] [verb_parser.js](file:///c:/sourceTree/japanese_study/src/verb_parser.js)**:
    *   加載並解析 `verb_conjugation_list.md`。
    *   依據 Markdown 二級標題識別 `1類動詞`、`2類動詞`、`3類動詞`，提取 8 個欄位值放入物件中。

### 2. 核心邏輯
*   **[NEW] [verb_quiz.js](file:///c:/sourceTree/japanese_study/src/verb_quiz.js)**:
    *   `filterVerbPool`：過濾動詞類別與星標。
    *   `generateVerbQuizOptions`：干擾項算法只篩選與題目**同類別**的動詞，並取出相同活用形式（如て形），確保測驗水準。
    *   `verifyVerbSpelling`：寬鬆拼寫檢查（忽略空白、KATAKANA 轉 HIRAGANA）。

### 3. 使用者介面 (HTML/CSS)
*   **[MODIFY] [index.html](file:///c:/sourceTree/japanese_study/index.html)**:
    *   頂部導覽列 `app-nav`：新增「單字學習」、「動詞活用」與「學習進度」三個切換按鈕。
    *   將動詞活用設定頁的「動詞類別」與「特別篩選範圍」合併在同一個「範圍篩選」卡片中。
    *   新增大表、卡片、測驗與進度儀表板的對應容器。
*   **[MODIFY] [index.css](file:///c:/sourceTree/japanese_study/index.css)**:
    *   新增首兩欄（⭐ 與ます形）凍結排版樣式。
    *   新增進度儀表板火焰動畫與歷程強度直條圖樣式。

### 4. 狀態控制器與互斥防呆
*   **[MODIFY] [src/ui.js](file:///c:/sourceTree/japanese_study/src/ui.js)**:
    *   `showScreen`：集中管理畫面切換，若進入非首頁設定畫面（如字卡學習、測驗等），自動將 `app-nav` 設為 `display: none` 隱藏。
    *   `bindVerbsSetupEvents` / `syncVerbSelectionState`：
        *   書籤選取時清空類別；類別選取時清除書籤。
        *   點選「對照表模式」時，自動清除上方所有範圍與變化目標勾選。
        *   在對照表模式下變更勾選時，自動切回「卡片學習」模式。
        *   卡片與測驗模式下無選取時禁用按鈕，對照表模式保持啟用。
*   **[MODIFY] [app.js](file:///c:/sourceTree/japanese_study/app.js)**:
    *   在卡片瀏覽與測驗作答時，即時寫入 `StorageController` 以統計「瀏覽卡片數」與「答題正確率」。

### 5. 測試套件
*   **[NEW] [tests/verb_parser.test.js](file:///c:/sourceTree/japanese_study/tests/verb_parser.test.js)**：驗證對照表 Markdown 解析。
*   **[NEW] [tests/verb_quiz.test.js](file:///c:/sourceTree/japanese_study/tests/verb_quiz.test.js)**：驗證核心測驗演算法。
*   **[MODIFY] [tests/run_tests_node.js](file:///c:/sourceTree/japanese_study/tests/run_tests_node.js)**：引入進度驗證、動詞對照表語法合法性檢查與單元測試。

---

## Verification Plan

### Automated Tests
*   執行 Node.js 測試驗證全體核心程式碼與語義正確性：
    ```bash
    npm test
    ```
