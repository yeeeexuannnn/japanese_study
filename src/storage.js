const BOOKMARKS_KEY = "jp_study_bookmarks";
const WRONG_WORDS_KEY = "jp_study_wrong_words";

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

function writeKey(key, array) {
  try {
    localStorage.setItem(key, JSON.stringify(array));
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

  // --- Global helpers ---
  clearAll() {
    try {
      localStorage.removeItem(BOOKMARKS_KEY);
      localStorage.removeItem(WRONG_WORDS_KEY);
    } catch (e) {
      console.error("Error clearing storage", e);
    }
  }
};
