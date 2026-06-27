# Research & Evaluation: 行動端平台實作評估 (Mobile Platform Evaluation)

為了讓日語學習工具能在您的 Android 手機與 iOS 平板上順暢使用，我們針對幾種主要的行動端實作方案進行了詳細的評估。

## 評估方案對比

### 方案 A：漸進式網頁應用程式 (Progressive Web App, PWA) — ⭐⭐⭐⭐⭐ [最終選擇]

*   **技術架構：** 採用響應式設計（Mobile-First Responsive Web Design）的 HTML、Vanilla CSS 與 Vanilla JS 網頁，配合 Service Worker 與 Manifest 檔案。
*   **優點：**
    *   **無平台限制：** 一套程式碼同時完美支援 iOS 與 Android。
    *   **像 App 的體驗：** 在手機/平板瀏覽器打開後，點擊「加入主畫面」，即可像原生 App 一樣以全螢幕啟動，隱藏瀏覽器網址列與工具列。
    *   **完全離線使用：** 透過 Service Worker 快取單字庫檔案，即使斷網或無網際網路連線亦可正常學習與測驗。
    *   **無痛開發與部署：** 在 Windows 環境下即可完成所有功能開發與除錯，不需要 macOS 系統與 Xcode。
    *   **免安裝與更新流程：** 網頁一更新，使用者下次打開就會自動獲取最新版本，不需經過 Apple App Store 或 Google Play 的繁瑣審核。
*   **缺點：** 不能直接封裝成 Apple `.ipa` 或 Android `.apk` 上架應用程式商店（但作為您個人自用，完全不需要上架）。

---

### 方案 B：混合行動端框架 (Capacitor / Cordova) — ⭐⭐

*   **技術架構：** 以網頁技術開發前端，再利用 Capacitor 封裝成原生的 iOS 與 Android 專案，進行編譯打包。
*   **優點：** 可以產生原生的安裝檔，可直接安裝於手機。
*   **缺點：** 
    *   **開發環境受限：** 編譯 iOS 的原生 App（ipa 檔案）**強制需要 macOS 與 Xcode**。由於您目前的開發與建置環境是 Windows，我們無法直接編譯出給您的 iPad 使用的原生 App 安裝檔。
    *   **環境複雜度：** 需要在本機安裝 Android SDK、Gradle、Java 等重型開發環境，對於個人工具而言維護成本過高。

---

### 方案 C：原生 App 開發 (Kotlin / Swift) — ⭐

*   **技術架構：** 分別使用 Kotlin 開發 Android 版，使用 Swift 開發 iOS 版。
*   **優點：** 性能最極致，使用者體驗最貼合系統。
*   **缺點：** 需要維護兩套完全獨立的程式碼，且 iOS 開發仍受限於 macOS，對自用學習工具而言完全不切實際。

---

## 決策與理由 (Decision & Rationale)

*   **決策：** 採用 **響應式 Web 網頁 + PWA (Progressive Web App)** 方案。
*   **理由：**
    1.  **環境相容性：** 您在 Windows 電腦上開發，PWA 是唯一不需要 macOS 即可為您的 iOS 平板（iPad）與 Android 手機提供 App 般（全螢幕、主畫面圖示）體驗的方案。
    2.  **Web 離線儲存：** 藉由瀏覽器內建的 `localStorage`，您的書籤與錯題本資料能完美且永久地儲存在您各別的手機與平板上，即使離線也能答題。
    3.  **無痛載入單字庫：** 網頁端可以直接以 JavaScript 載入並解析 [vocabulary_list.md](file:///c:/sourceTree/japanese_study/specs/vocabulary_list.md), 不需額外架設 API 伺服器，真正實現零後端（Zero-Backend）單機運行。

---

## 關鍵技術細節設計 (Key Technical Details)

### 1. 行動端適配與手勢
*   使用 CSS Flexbox/Grid 進行高度自適應彈性排版，無論是 6 吋手機還是 11 吋 iPad 都能完美呈現 3D 單字卡翻牌與按鈕版面。
*   設計大尺寸的觸控按鈕，避免答題時誤觸。

### 2. 離線與安裝化 (PWA)
*   **`manifest.json`**：定義應用程式名稱、圖示、啟動畫面顏色，以及設定 `display: "standalone"` 以便在主畫面上隱藏瀏覽器網址列。
*   **`service-worker.js`**：快取核心靜態資源（HTML、CSS、JS、單字庫 markdown 檔案），實現秒開與全離線使用。

### 3. 多端資料同步說明
*   由於採用單機 `localStorage`，手機與平板的書籤/錯題資料是獨立存放在各自的裝置瀏覽器中。對於個人自用工具，這最安全、快速且隱私。
