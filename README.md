# 大家的日本語 2 單字與動詞學習工具 (Japanese Study Tool PWA)

這是一個專為學習《大家的日本語》第二冊（第 13 課至第 25 課）單字與動詞活用所設計的純前端、無伺服器（Serverless）漸進式網頁應用程式 (PWA)。

## 🚀 專案特點
- **離線可用 (PWA)**：透過 Service Worker 進行靜態資源與單字庫快取，斷網環境下也能正常學習與測驗。
- **三學習維度**：
  - **單字學習與測驗**：支援單字卡翻牌瀏覽（3D 動畫）、日選中、中選日、以及聽寫/輸入平假名讀音測驗（支援模糊判定與輸入提示）。
  - **動詞活用與測驗**：動詞ます形、て形、字典形、ない形、た形對照大表（左側首兩欄凍結）與活用拼寫及選擇測驗（採用同類別干擾項算法）。
  - **學習進度儀表板**：追蹤每日連續登入天數（Streak）與火焰勳章、統計最近 7 日學習強度直條圖，並條列各課單字的字卡與測驗進度條。
- **智慧儲存**：書籤收藏（星星）與錯題本自動追蹤，答對錯題時會自動將其移出錯題本，形成高效的記憶漏斗。
- **純前端架構**：不依賴任何後端 API，單字與動詞資料在庫直接由 Markdown 檔案在瀏覽器端載入並動態解析。

---

## 📁 專案目錄結構

```text
japanese_study/
├── .agents/                 # AI Agent 專案自訂規則與 Skills
├── specs/                   # 文件、規格書與資料庫源
│   ├── vocabulary_list.md   # 單字庫資料來源表格 (L13 - L25)
│   ├── verb_conjugation_list.md # 動詞活用庫資料來源表格
│   ├── system_architecture.md # [NEW] 系統架構說明書
│   └── data_model.md        # [NEW] 整合資料模型規格書
├── src/                     # 核心邏輯 JavaScript ESM 模組
│   ├── parser.js            # 單字 Markdown 表格解析器
│   ├── verb_parser.js       # 動詞 Markdown 表格解析器
│   ├── quiz.js              # 單字測驗邏輯（隨機選項、讀音驗證等）
│   ├── verb_quiz.js         # 動詞測驗邏輯（拼寫判定等）
│   ├── storage.js           # 本地 LocalStorage 封裝層
│   └── ui.js                # DOM 渲染、動態效果與 TTS 語音朗讀
├── tests/                   # 測試套件 (支援 Node.js 與瀏覽器雙端)
│   ├── parser.test.js       # 解析器單元測試
│   ├── quiz.test.js         # 測驗邏輯單元測試
│   ├── run_tests_node.js    # Node 端測試執行入口
│   └── run_tests.html       # 瀏覽器端測試執行入口
├── app.js                   # 全局應用程式狀態 (State) 與生命週期協調器
├── index.html               # 單頁應用 (SPA) 結構入口
├── index.css                # 介面風格與動畫樣式表 (Catppuccin 風格)
├── manifest.json            # PWA 應用設定檔
├── service-worker.js        # 離線快取與 Skipper 訊息處理
├── start-server.bat         # Windows 本地伺服器快速啟動批次檔
└── package.json             # 測試指令與專案資訊
```

---

## 🛠️ 本地開發與運行

### 1. 啟動本地開發伺服器
本專案為純前端 SPA，在本地測試 Service Worker (PWA) 需在伺服器環境下執行。

在專案根目錄中，您可以：
- **雙擊執行** [start-server.bat](file:///c:/sourceTree/japanese_study/start-server.bat)（這會在背景啟動 Python HTTP 伺服器並自動開啟瀏覽器）。
- 或在終端機中手動執行：
  ```bash
  python -m http.server 8000
  ```
  接著在瀏覽器打開 [http://localhost:8000](http://localhost:8000)。

### 2. 運行單元測試
專案包含完整的測試套件，可用於驗證解析邏輯與演算法正確性。
- **命令列測試 (Node.js)**：
  ```bash
  npm test
  ```
- **瀏覽器端測試**：
  啟動本地伺服器後，在瀏覽器訪問 [http://localhost:8000/tests/run_tests.html](http://localhost:8000/tests/run_tests.html)。

---

## ⚠️ 版本控制與發布規範 (Git / Versioning)
依據專案規範，修改本專案程式時必須嚴格遵守以下準則：
1. **語意化版本 (SemVer)**：版本號儲存於 `app.js` 的 `APP_VERSION` 常數，且需要同步於 `service-worker.js` 中的快取版本。
2. **禁止自動 Commit/Push**：修改程式後，必須先呈現異動（Git Diff）讓使用者審查，取得明確授權後方可執行 Commit 或 Push。
3. **驗證流程**：
   * 本地修改後必須運行 `npm test` 確保 100% 通過。
   * 啟動 HTTP 服務，引導使用者完成本地驗證（「本地驗證通過」）。
   * 隨後才得更新版本號，並提交至遠端。
