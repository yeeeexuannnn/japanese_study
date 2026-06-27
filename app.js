import { loadAndParseVocabulary } from "./src/parser.js";
import { StorageController } from "./src/storage.js";
import { filterWordPool, generateQuizOptions, verifyReadingInput, generateReadingHint, shuffleArray } from "./src/quiz.js";
import { UIController, speakJapanese } from "./src/ui.js";

// Global Application State
const State = {
  allWords: [],          // Raw database of parsed items
  filteredPool: [],      // Active filtered pool based on selection
  quizQueue: [],         // Shuffled active items for the current session
  currentIndex: 0,       // Current question/card index
  currentMode: "study",  // "study" | "jp_to_zh" | "zh_to_jp" | "spelling"
  
  // Quiz Session Stats
  session: {
    total: 0,
    correct: 0,
    mistakes: []         // List of items failed in this specific session
  }
};

/**
 * Register Service Worker for PWA support (Offline Capability)
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js")
        .then(reg => console.log("[PWA] Service Worker registered with scope:", reg.scope))
        .catch(err => console.error("[PWA] Service Worker registration failed:", err));
    });
  }
}

/**
 * Update dynamic word fields (isBookmarked, isWrong) from LocalStorage
 */
function refreshWordsState() {
  const bookmarks = StorageController.getBookmarks();
  const wrongs = StorageController.getWrongWords();

  State.allWords.forEach(item => {
    item.isBookmarked = bookmarks.includes(item.id);
    item.isWrong = wrongs.includes(item.id);
  });

  // Sync counts in header indicators
  UIController.updateHeaderStats(bookmarks.length, wrongs.length);
}

// Bootstrap Application
async function initApp() {
  registerServiceWorker();
  
  // Load database
  State.allWords = await loadAndParseVocabulary();
  
  // Extract unique lessons and sort them numerically
  const uniqueLessons = [...new Set(State.allWords.map(item => item.lesson))];
  uniqueLessons.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  // Initialize UI with dynamic list
  UIController.init(uniqueLessons);
  refreshWordsState();

  // Bind controllers with state actions
  UIController.registerCallbacks({
    // 1. Start Session
    onStart({ lessons, bookmarkOnly, wrongOnly, mode }) {
      refreshWordsState();

      // Retrieve storage lists
      const bookmarks = StorageController.getBookmarks();
      const wrongs = StorageController.getWrongWords();

      // Filter words based on user filters
      State.filteredPool = filterWordPool(State.allWords, {
        selectedLessons: lessons,
        bookmarkOnly,
        bookmarkedIds: bookmarks,
        wrongOnly,
        wrongIds: wrongs
      });

      if (State.filteredPool.length === 0) {
        alert("目前的範圍內無單字，請重新選擇範圍！");
        return;
      }

      State.currentMode = mode;
      State.currentIndex = 0;
      State.quizQueue = shuffleArray(State.filteredPool);

      // Reset session stats
      State.session.total = Math.min(State.quizQueue.length, 10); // Standard round limit is 10 (or all if less than 10)
      if (mode === "study") {
        State.session.total = State.quizQueue.length; // study mode loops all
      }
      State.session.correct = 0;
      State.session.mistakes = [];

      if (mode === "study") {
        UIController.showScreen("study");
        renderCurrentStudyCard();
      } else {
        UIController.showScreen("quiz");
        renderCurrentQuizQuestion();
      }
    },

    // 2. Flashcard Mode Callbacks
    onPrevCard() {
      if (State.currentIndex > 0) {
        State.currentIndex--;
        renderCurrentStudyCard();
      }
    },

    onNextCard() {
      if (State.currentIndex < State.quizQueue.length - 1) {
        State.currentIndex++;
        renderCurrentStudyCard();
      }
    },

    // 3. Quiz Mode Callbacks
    onBookmarkToggle() {
      const activeItem = State.quizQueue[State.currentIndex];
      const isStarred = StorageController.isBookmarked(activeItem.id);
      
      if (isStarred) {
        StorageController.removeBookmark(activeItem.id);
      } else {
        StorageController.addBookmark(activeItem.id);
      }
      
      refreshWordsState();

      // Reflect state instantly in UI
      const activeAfter = StorageController.isBookmarked(activeItem.id);
      if (State.currentMode === "study") {
        document.getElementById("study-star-btn").classList.toggle("active", activeAfter);
      } else {
        document.getElementById("quiz-star-btn").classList.toggle("active", activeAfter);
      }
    },

    onQuizTTSPlay() {
      const activeItem = State.quizQueue[State.currentIndex];
      speakJapanese(activeItem.word);
    },

    onSpellingHintRequest() {
      const activeItem = State.quizQueue[State.currentIndex];
      return generateReadingHint(activeItem.reading);
    },

    onSpellingSubmit(typedInput) {
      const activeItem = State.quizQueue[State.currentIndex];
      const isCorrect = verifyReadingInput(typedInput, activeItem.reading);
      handleAnswer(isCorrect, typedInput);
    },

    onNextQuestion() {
      State.currentIndex++;
      if (State.currentIndex >= State.session.total) {
        // Quiz Round Complete - transition to summary
        UIController.showScreen("summary");
        UIController.renderSummary(
          {
            total: State.session.total,
            correct: State.session.correct,
            accuracy: Math.round((State.session.correct / State.session.total) * 100),
            mistakes: State.session.mistakes
          },
          // Callback when toggling bookmarks inside summary cards
          (itemId) => {
            const isStarred = StorageController.isBookmarked(itemId);
            if (isStarred) {
              StorageController.removeBookmark(itemId);
            } else {
              StorageController.addBookmark(itemId);
            }
            refreshWordsState();
            return StorageController.isBookmarked(itemId);
          }
        );
      } else {
        renderCurrentQuizQuestion();
      }
    },

    // 4. Return to selection screen
    onGoHome() {
      refreshWordsState();
      UIController.showScreen("setup");
    }
  });
}

// Render helper for Flashcards
function renderCurrentStudyCard() {
  const item = State.quizQueue[State.currentIndex];
  const isStarred = StorageController.isBookmarked(item.id);
  UIController.renderFlashcard(item, State.currentIndex, State.quizQueue.length, isStarred);
}

// Render helper for Quizzes (MCQ & Input)
function renderCurrentQuizQuestion() {
  const item = State.quizQueue[State.currentIndex];
  const isStarred = StorageController.isBookmarked(item.id);
  UIController.renderQuizQuestion(item, State.currentIndex, State.session.total, isStarred, State.currentMode);

  if (State.currentMode === "jp_to_zh" || State.currentMode === "zh_to_jp") {
    // Generate MCQ choices
    const choices = generateQuizOptions(item, State.filteredPool, State.allWords, State.currentMode);
    const correctText = State.currentMode === "jp_to_zh" ? item.translation : item.word;
    
    UIController.renderMCQChoices(choices, correctText, (isCorrect, selectedText) => {
      handleAnswer(isCorrect, selectedText);
    });
  }
}

// Shared handler when an answer is evaluated
function handleAnswer(isCorrect, answerValue) {
  const item = State.quizQueue[State.currentIndex];
  
  if (isCorrect) {
    State.session.correct++;
    // If correct, auto-remove from mistake book (wrong list)
    StorageController.removeWrongWord(item.id);
  } else {
    // Record mistake in LocalStorage and session list
    StorageController.addWrongWord(item.id);
    if (!State.session.mistakes.some(m => m.id === item.id)) {
      State.session.mistakes.push(item);
    }
  }

  // Update feedback screen
  UIController.showFeedback(item, isCorrect);
}

// Inject showFeedback custom wrapper in UIController
UIController.showFeedback = function(item, isCorrect) {
  this.showQuizFeedback(item, isCorrect);
};

// Start the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp);
