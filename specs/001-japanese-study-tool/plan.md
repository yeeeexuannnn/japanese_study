# Implementation Plan: 日語學習工具 (Japanese Learning Tool)

**Branch**: `001-japanese-study-tool` | **Date**: 2026-06-28 | **Spec**: [spec.md](file:///c:/sourceTree/japanese_study/specs/001-japanese-study-tool/spec.md)

**Input**: Feature specification from `/specs/001-japanese-study-tool/spec.md`

## Summary

本項目旨在開發一個可在行動端（iOS 平板與 Android 手機）完美運行的單機離線日語學習工具。技術架構上選擇 **漸進式網頁應用程式 (PWA)** 方案，不依賴任何外部後端或伺服器，利用瀏覽器 native 的 `localStorage` 進行收藏星星與錯題紀錄的持久化儲存。

---

## Technical Context

**Deployment**: GitHub Pages (將網頁靜態託管於 GitHub，無伺服器費用，並支援 HTTPS 與自訂網域。支援行動端 PWA 全螢幕安裝與本機 LocalStorage 資料隔離持久化。)

**Language/Version**: HTML5, CSS3 (Vanilla CSS), ES6+ JavaScript (Vanilla JS)

**Primary Dependencies**: None (為了輕量化與 100% 離線可用，完全不引用第三方 Framework / JS 庫)

**Storage**: 瀏覽器 Native `localStorage`（用於儲存書籤清單與錯題清單）

**Testing**: 於 `tests/` 目錄中編寫簡單的 JS 單元測試，驗證單字庫 parser 及選擇題去重邏輯

**Target Platform**: iOS 15+ (Safari), Android (Chrome) 行動端瀏覽器，支援 PWA「加入主畫面」以全螢幕 standalone 模式啟動

**Project Type**: PWA 靜態網頁應用程式 (web-app / PWA)

**Performance Goals**: 
- 網頁首開載入時間 < 300ms（利用 Service Worker 快取）
- 卡片翻轉動畫、介面切換流暢度達 60 fps 

**Constraints**: 
- 完全離線可用（透過 Service Worker 快取單字庫 [vocabulary_list.md](file:///c:/sourceTree/japanese_study/specs/vocabulary_list.md)）
- Mobile-First 響應式排版，適應 360px 至 1024px 各種手機與平板螢幕

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Library-First**: 將單字解析 (Parser)、測驗狀態機 (QuizEngine)、本機儲存控制器 (StorageController) 分模組封裝成獨立的 JS 模組，模組間職責分離，利於獨立測試。
- **CLI Interface**: 由於本案是純前端瀏覽器應用程式（PWA），不具備命令列（CLI）運作環境，此項不適用（N/A）。
- **Test-First**: 在實作 UI 之前，優先編寫單字庫解析模組與隨機選項生成邏輯的單元測試，確保資料邏輯 100% 正確再開發畫面。

---

## Project Structure

### Documentation (this feature)

```text
specs/001-japanese-study-tool/
├── spec.md              # 功能規格書 (Specify 階段產出)
├── plan.md              # 本實作計畫書 (Plan 階段產出)
├── research.md          # 平台評估報告 (Phase 0 產出)
├── data-model.md        # 資料結構與狀態設計 (Phase 1 產出)
├── quickstart.md        # 本地啟動與驗證指南 (Phase 1 產出)
└── checklists/
    └── requirements.md  # 規格品質驗證清單
```

### Source Code (repository root)

```text
# 採用 Option 1: Single project (DEFAULT) 結構
index.html               # 應用程式主 HTML 結構與入口
index.css                # 核心設計系統與 CSS 樣式 (包含 3D 卡片動畫)
app.js                   # 應用程式前端核心邏輯與模組初始化
manifest.json            # PWA 設定檔，定義 standalone 與圖示
service-worker.js        # 離線快取控制腳本\n.github/workflows/      # GitHub Actions 自動部署工作流\n└── deploy.yml          # 自動發布至 GitHub Pages

src/
├── parser.js            # 單字庫 markdown 解析模組
├── storage.js           # localStorage 控制模組
├── quiz.js              # 測驗邏輯與選項生成模組
└── ui.js                # UI 渲染與事件綁定模組

tests/
├── parser.test.js       # 測試單字解析與欄位對齊
└── quiz.test.js         # 測試隨機選項生成與去重邏輯
```

**Structure Decision**: 由於此專案為全前端靜態 PWA 專案，採用 Option 1 (Single Project) 最為直覺。前端核心控制代碼以模組化方式置於 `src/` 中，入口檔案置於根目錄，方便 Python 本地 HTTP 伺服器一鍵載入。

---

## Complexity Tracking

*此項目無違反 Constitution core principles 之複雜度設計，故本表無衝突條目。*
