# Tasks: 日語學習工具 (Japanese Learning Tool)

**Input**: Design documents from `/specs/001-japanese-study-tool/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic file layout

- [ ] T001 Create project file structure including index.html, index.css, app.js, manifest.json, and service-worker.js at repository root
- [ ] T002 [P] Create start-server.bat script at repository root to run local Python HTTP dev server
- [ ] T003 [P] Configure basic ESLint or formatting guidelines inside project settings

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data parsing and offline persistence layer

- [ ] T004 Implement markdown vocabulary parser in src/parser.js to parse specs/vocabulary_list.md into memory
- [ ] T005 [P] Implement localStorage data controller in src/storage.js to save/load bookmarks and mistake lists
- [ ] T006 [P] Implement main application router and layout state toggles in src/ui.js
- [ ] T007 Initialize state manager and bootstrap application modules in app.js

---

## Phase 3: User Story 6 - 單字卡翻牌瀏覽（學習模式） (Priority: P1)

**Goal**: Provide a 3D glassmorphic flashcard viewer to review words in the selected range

**Independent Test**: Choose Lesson 13, open study mode, click cards to flip them and slide to navigate.

### Implementation for User Story 6
- [ ] T008 [P] [US6] Create 3D flashcard container structure in index.html
- [ ] T009 [P] [US6] Style card back/front layouts and glassmorphic flip animations in index.css
- [ ] T010 [US6] Connect card flipping states and navigation events (next/previous) in src/ui.js and app.js

---

## Phase 4: User Story 1 - 看單字，選中文翻譯 (Priority: P1) 🎯 MVP

**Goal**: Quiz mode where users see a Japanese word and choose the correct Chinese translation

**Independent Test**: Select Japanese-to-Chinese mode, submit correct translation, verify success indicator.

### Implementation for User Story 1
- [ ] T011 [P] [US1] Create quiz option generator and random shuffling logic in src/quiz.js
- [ ] T012 [P] [US1] Design multiple choice quiz card layout in index.html
- [ ] T013 [US1] Implement Japanese-to-Chinese quiz state machine and verify answers in src/ui.js and app.js

---

## Phase 5: User Story 2 - 看中文翻譯，選日文單字 (Priority: P1)

**Goal**: Quiz mode where users see a Chinese translation and choose the correct Japanese word

**Independent Test**: Select Chinese-to-Japanese mode, see Chinese translation, submit correct Japanese word.

### Implementation for User Story 2
- [ ] T014 [P] [US2] Update option generation in src/quiz.js to support Chinese-to-Japanese queries
- [ ] T015 [US2] Integrate Chinese-to-Japanese quiz state and DOM rendering in src/ui.js

---

## Phase 6: User Story 3 - 看單字，輸入假名讀音 (Priority: P2)

**Goal**: Text input quiz mode matching typed hiragana pronunciation with hint assistance

**Independent Test**: Enter reading mode, type reading in text box, hit check. Click hint to see the first letter and length.

### Implementation for User Story 3
- [ ] T016 [P] [US3] Create input text fields, check buttons, and hint buttons in index.html
- [ ] T017 [P] [US3] Add hint generation (first letter and length) helper in src/quiz.js
- [ ] T018 [US3] Implement text input validation (whitespace trimming, kana compatibility) in src/ui.js

---

## Phase 7: User Story 4 - 收藏單字（標示星星書籤） (Priority: P2)

**Goal**: A bookmarking system allowing users to bookmark words with a star toggle

**Independent Test**: Toggle star icon on flashcard, reload page, ensure bookmark remains persistent.

### Implementation for User Story 4
- [ ] T019 [P] [US4] Add star buttons and icon states to flashcard and quiz panels in index.html
- [ ] T020 [P] [US4] Implement toggleBookmark logic and starred styles in src/storage.js and index.css
- [ ] T021 [US4] Bind star click events to storage state updates and UI rerender loops in src/ui.js and app.js

---

## Phase 8: User Story 5 - 書籤收藏單字作為測驗範圍來源 (Priority: P2)

**Goal**: Allow selecting bookmarked words as an independent quiz scope in the settings menu

**Independent Test**: Select bookmarks scope, start quiz, ensure only bookmarked words appear.

### Implementation for User Story 5
- [ ] T022 [P] [US5] Add "書籤 (標星單字)" range option and word counter in index.html
- [ ] T023 [US5] Integrate bookmark scope checks into quiz range filtering in src/quiz.js and app.js

---

## Phase 9: User Story 7 - 智慧錯題本自動收集與測驗 (Priority: P2)

**Goal**: Track mistakes in quizzes, offer them as a quiz scope, and remove them upon correct answer

**Independent Test**: Answer wrongly, choose mistake book scope, see word. Answer correctly, ensure word is removed.

### Implementation for User Story 7
- [ ] T024 [P] [US7] Add "錯題本 (常錯單字)" range option in index.html
- [ ] T025 [P] [US7] Implement wrong answer tracking and auto-cleanup logic in src/storage.js and src/quiz.js
- [ ] T026 [US7] Wire mistake book filter events to the main quiz loop in app.js

---

## Phase 10: User Story 8 - 測驗結算與分析報告 (Priority: P2)

**Goal**: Show correctness dashboard and mistook words list with star toggles at quiz end

**Independent Test**: Finish a quiz session, verify analytics panel and wrong answer bookmarks.

### Implementation for User Story 8
- [ ] T027 [P] [US8] Create result panel layout with session summary statistics in index.html
- [ ] T028 [P] [US8] Design result dashboard CSS classes in index.css
- [ ] T029 [US8] Record quiz session analytics and display result panel in src/ui.js and app.js

---

## Phase 11: Polish, Deployment & Cross-Cutting Concerns

**Purpose**: Service worker registration, basic unit tests, GitHub Pages deployment, and layout responsiveness

- [ ] T030 [P] Implement service worker caching and offline install setup in service-worker.js and app.js
- [ ] T031 [P] Create lightweight unit test suites in tests/parser.test.js and tests/quiz.test.js
- [ ] T032 Validate app responsive design on mobile/tablet viewports and execute specs/001-japanese-study-tool/quickstart.md scenarios
- [ ] T033 Configure GitHub Pages deployment settings in GitHub repository settings
- [ ] T034 [P] Create GitHub Actions workflow in .github/workflows/deploy.yml to automate static deployment on push
- [ ] T035 Verify the live PWA application via the GitHub Pages URL on an Android phone or iOS tablet and ensure LocalStorage bookmarks persist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3 to 10)**: All depend on Foundational phase completion
  - Recommended order: US6 (P1 study mode) → US1 & US2 (P1 MC quizzes) → US3 (P2 fill reading) → US4 & US5 (P2 bookmarks) → US7 & US8 (P2 mistake book & analytics)
- **Polish (Phase 11)**: Depends on all user stories completion

---

## Parallel Example: Setup & Foundation

```bash
# Setup tasks:
Task: "Create start-server.bat script at repository root"
Task: "Configure basic ESLint or formatting guidelines inside project settings"

# Foundation tasks:
Task: "Implement localStorage data controller in src/storage.js"
Task: "Implement main application router and layout state toggles in src/ui.js"
```

---

## Implementation Strategy

### MVP First (Study Card & MCQ Quiz)

1. Complete Setup and Foundational Phases
2. Complete User Story 6 (Study Card Mode)
3. Complete User Story 1 (Japanese-to-Chinese Quiz)
4. Validate PWA standalone layout using Chrome Mobile DevTools
5. Configure GitHub Pages (T033) and verify PWA on your mobile devices (T035)
