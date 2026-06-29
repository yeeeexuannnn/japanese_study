import { StorageController } from "../src/storage.js";

// Mock localStorage for Node.js environment
const store = {};
global.localStorage = {
  getItem(key) {
    return store[key] || null;
  },
  setItem(key, value) {
    store[key] = String(value);
  },
  removeItem(key) {
    delete store[key];
  },
  clear() {
    for (const key in store) {
      delete store[key];
    }
  }
};

export function testStorageSuite(assert) {
  assert.suite("Storage Controller Tests");

  // Reset mock storage before each test
  function resetStorage() {
    localStorage.clear();
  }

  assert.test("addBookmark and getBookmarks should work correctly", () => {
    resetStorage();
    StorageController.addBookmark("word_1");
    StorageController.addBookmark("word_2");
    StorageController.addBookmark("word_1"); // duplicate check

    const list = StorageController.getBookmarks();
    assert.equal(list.length, 2, "List should contain 2 bookmarks");
    assert.ok(list.includes("word_1"), "Should include word_1");
    assert.ok(list.includes("word_2"), "Should include word_2");
    assert.ok(StorageController.isBookmarked("word_1"), "isBookmarked should return true for word_1");
  });

  assert.test("removeBookmark should remove specified bookmark", () => {
    resetStorage();
    StorageController.addBookmark("word_1");
    StorageController.addBookmark("word_2");
    StorageController.removeBookmark("word_1");

    const list = StorageController.getBookmarks();
    assert.equal(list.length, 1, "List should contain 1 bookmark");
    assert.ok(!list.includes("word_1"), "Should not include word_1");
    assert.ok(StorageController.isBookmarked("word_2"), "Should still include word_2");
  });

  assert.test("addStudiedWord and addCorrectWord should track progress", () => {
    resetStorage();
    StorageController.addStudiedWord("word_1");
    StorageController.addStudiedWord("word_2");
    assert.equal(StorageController.getStudiedWords().length, 2, "Should record 2 studied words");

    StorageController.addCorrectWord("word_1");
    assert.ok(StorageController.isCorrectWord("word_1"), "word_1 should be correct");
    assert.ok(!StorageController.isCorrectWord("word_2"), "word_2 should not be correct");

    StorageController.removeCorrectWord("word_1");
    assert.ok(!StorageController.isCorrectWord("word_1"), "word_1 should be removed from correct list");
  });

  assert.test("recordActivity should track daily stats", () => {
    resetStorage();
    
    // Record vocabulary activities
    StorageController.recordActivity("vocab", "study");
    StorageController.recordActivity("vocab", "quiz", { isCorrect: true });
    StorageController.recordActivity("vocab", "quiz", { isCorrect: false });
    
    // Record verb activities
    StorageController.recordActivity("verb", "study");
    StorageController.recordActivity("verb", "quiz", { isCorrect: true });

    const logs = StorageController.getProgressLogs();
    assert.equal(logs.length, 1, "Should have 1 daily log entry");
    
    const todayLog = logs[0];
    assert.equal(todayLog.vocabStudyCount, 1, "Should have 1 vocab study");
    assert.equal(todayLog.vocabQuizTotal, 2, "Should have 2 vocab quiz questions");
    assert.equal(todayLog.vocabQuizCorrect, 1, "Should have 1 vocab quiz correct");
    assert.equal(todayLog.verbStudyCount, 1, "Should have 1 verb study");
    assert.equal(todayLog.verbQuizTotal, 1, "Should have 1 verb quiz question");
    assert.equal(todayLog.verbQuizCorrect, 1, "Should have 1 verb quiz correct");
  });

  assert.test("checkAndUpdateStreak should handle login streak correctly", () => {
    resetStorage();

    // 1. Initial login
    const stats1 = StorageController.checkAndUpdateStreak();
    assert.equal(stats1.currentStreak, 1, "Initial streak should be 1");
    assert.equal(stats1.longestStreak, 1, "Initial longest streak should be 1");

    // 2. Same day login - should not change
    const stats2 = StorageController.checkAndUpdateStreak();
    assert.equal(stats2.currentStreak, 1, "Same day login should not increment streak");

    // 3. Mock yesterday login and test consecutive streak
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterdayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    // Force set last active to yesterday in localStorage
    const storedStats = StorageController.getStreakStats();
    storedStats.lastActiveDate = yesterdayStr;
    localStorage.setItem("jp_study_streak_stats", JSON.stringify(storedStats));

    // Login today
    const stats3 = StorageController.checkAndUpdateStreak();
    assert.equal(stats3.currentStreak, 2, "Consecutive day login should increment streak to 2");
    assert.equal(stats3.longestStreak, 2, "Longest streak should be updated to 2");

    // 4. Mock broken streak (e.g. last active was 3 days ago)
    const storedStatsBroken = StorageController.getStreakStats();
    storedStatsBroken.lastActiveDate = "2000-01-01";
    localStorage.setItem("jp_study_streak_stats", JSON.stringify(storedStatsBroken));

    const stats4 = StorageController.checkAndUpdateStreak();
    assert.equal(stats4.currentStreak, 1, "Broken streak should reset currentStreak to 1");
    assert.equal(stats4.longestStreak, 2, "Longest streak should remain 2");
  });
}
