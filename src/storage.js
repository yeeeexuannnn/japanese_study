const BOOKMARKS_KEY = "jp_study_bookmarks";
const WRONG_WORDS_KEY = "jp_study_wrong_words";
const STUDIED_WORDS_KEY = "jp_study_studied_words";
const CORRECT_WORDS_KEY = "jp_study_correct_words";
const PROGRESS_LOGS_KEY = "jp_study_progress_logs";
const STREAK_STATS_KEY = "jp_study_streak_stats";

// Helper to get local YYYY-MM-DD
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to determine if date is yesterday
function isYesterday(dateStr) {
  if (!dateStr) return false;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const yesterdayStr = `${year}-${month}-${day}`;
  return dateStr === yesterdayStr;
}

// Generic helpers for localStorage
function readKey(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage`, error);
    return [];
  }
}

function writeKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key ${key} to localStorage`, error);
  }
}

export const StorageController = {
  // --- Bookmarks Section ---
  getBookmarks() {
    return readKey(BOOKMARKS_KEY);
  },

  addBookmark(id) {
    const list = this.getBookmarks();
    if (!list.includes(id)) {
      list.push(id);
      writeKey(BOOKMARKS_KEY, list);
    }
  },

  removeBookmark(id) {
    const list = this.getBookmarks();
    const index = list.indexOf(id);
    if (index !== -1) {
      list.splice(index, 1);
      writeKey(BOOKMARKS_KEY, list);
    }
  },

  isBookmarked(id) {
    return this.getBookmarks().includes(id);
  },

  // --- Wrong Words Section ---
  getWrongWords() {
    return readKey(WRONG_WORDS_KEY);
  },

  addWrongWord(id) {
    const list = this.getWrongWords();
    if (!list.includes(id)) {
      list.push(id);
      writeKey(WRONG_WORDS_KEY, list);
    }
  },

  removeWrongWord(id) {
    const list = this.getWrongWords();
    const index = list.indexOf(id);
    if (index !== -1) {
      list.splice(index, 1);
      writeKey(WRONG_WORDS_KEY, list);
    }
  },

  isWrongWord(id) {
    return this.getWrongWords().includes(id);
  },

  // --- Studied Words Section (Progress Tracking) ---
  getStudiedWords() {
    return readKey(STUDIED_WORDS_KEY);
  },

  addStudiedWord(id) {
    const list = this.getStudiedWords();
    if (!list.includes(id)) {
      list.push(id);
      writeKey(STUDIED_WORDS_KEY, list);
    }
  },

  // --- Correct Words Section (Progress Tracking) ---
  getCorrectWords() {
    return readKey(CORRECT_WORDS_KEY);
  },

  addCorrectWord(id) {
    const list = this.getCorrectWords();
    if (!list.includes(id)) {
      list.push(id);
      writeKey(CORRECT_WORDS_KEY, list);
    }
  },

  removeCorrectWord(id) {
    const list = this.getCorrectWords();
    const index = list.indexOf(id);
    if (index !== -1) {
      list.splice(index, 1);
      writeKey(CORRECT_WORDS_KEY, list);
    }
  },

  isCorrectWord(id) {
    return this.getCorrectWords().includes(id);
  },

  // --- Daily Activity Logs Section ---
  getProgressLogs() {
    return readKey(PROGRESS_LOGS_KEY);
  },

  recordActivity(category, action, extra = {}) {
    const logs = this.getProgressLogs();
    const today = getLocalDateString();
    let log = logs.find(l => l.date === today);
    
    if (!log) {
      log = {
        date: today,
        vocabStudyCount: 0,
        vocabQuizTotal: 0,
        vocabQuizCorrect: 0,
        verbStudyCount: 0,
        verbQuizTotal: 0,
        verbQuizCorrect: 0
      };
      logs.push(log);
    }

    if (category === "vocab") {
      if (action === "study") {
        log.vocabStudyCount += 1;
      } else if (action === "quiz") {
        log.vocabQuizTotal += 1;
        if (extra.isCorrect) {
          log.vocabQuizCorrect += 1;
        }
      }
    } else if (category === "verb") {
      if (action === "study") {
        log.verbStudyCount += 1;
      } else if (action === "quiz") {
        log.verbQuizTotal += 1;
        if (extra.isCorrect) {
          log.verbQuizCorrect += 1;
        }
      }
    }

    // Retain only last 30 days of data
    if (logs.length > 30) {
      logs.shift();
    }

    writeKey(PROGRESS_LOGS_KEY, logs);
    
    // Auto-verify/update streak on activity
    this.checkAndUpdateStreak();
  },

  // --- Streak Statistics Section ---
  getStreakStats() {
    const defaultStats = { currentStreak: 0, longestStreak: 0, lastActiveDate: "" };
    try {
      const data = localStorage.getItem(STREAK_STATS_KEY);
      return data ? JSON.parse(data) : defaultStats;
    } catch (e) {
      return defaultStats;
    }
  },

  checkAndUpdateStreak() {
    const stats = this.getStreakStats();
    const today = getLocalDateString();

    if (!stats.lastActiveDate) {
      // First activity
      stats.currentStreak = 1;
      stats.longestStreak = 1;
      stats.lastActiveDate = today;
      writeKey(STREAK_STATS_KEY, stats);
    } else if (stats.lastActiveDate === today) {
      // Already active today, no change
    } else if (isYesterday(stats.lastActiveDate)) {
      // Active on consecutive day
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
      stats.lastActiveDate = today;
      writeKey(STREAK_STATS_KEY, stats);
    } else {
      // Streak broken
      stats.currentStreak = 1;
      stats.lastActiveDate = today;
      writeKey(STREAK_STATS_KEY, stats);
    }
    return stats;
  },

  // --- Global Reset Helpers ---
  clearProgressData() {
    try {
      localStorage.removeItem(STUDIED_WORDS_KEY);
      localStorage.removeItem(CORRECT_WORDS_KEY);
      localStorage.removeItem(PROGRESS_LOGS_KEY);
      localStorage.removeItem(STREAK_STATS_KEY);
    } catch (e) {
      console.error("Error clearing progress data", e);
    }
  },

  clearAll() {
    try {
      localStorage.removeItem(BOOKMARKS_KEY);
      localStorage.removeItem(WRONG_WORDS_KEY);
      this.clearProgressData();
    } catch (e) {
      console.error("Error clearing storage", e);
    }
  }
};

