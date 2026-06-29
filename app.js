import { loadAndParseVocabulary } from "./src/parser.js";
import { StorageController } from "./src/storage.js";
import { filterWordPool, generateQuizOptions, verifyReadingInput, generateReadingHint, shuffleArray } from "./src/quiz.js";
import { UIController, speakJapanese } from "./src/ui.js";

import { loadAndParseVerbConjugations } from "./src/verb_parser.js";
import { filterVerbPool, generateVerbQuizOptions, verifyVerbSpelling } from "./src/verb_quiz.js";

const CONJUGATION_LABELS = {
  teForm: "て形",
  dictForm: "字典形",
  naiForm: "ない形",
  taForm: "た形"
};

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
  },

  // Verb Subsystem State
  allVerbs: [],
  filteredVerbsPool: [],
  verbsQuizQueue: [],
  verbsTargetFormsQueue: [],
  currentVerbIndex: 0,
  currentVerbMode: "lookup",
  currentVerbTargets: [],
  verbsSession: {
    total: 0,
    correct: 0,
    mistakes: []
  }
};

// App Version Constant
const APP_VERSION = "v1.2.0";

/**
 * Register Service Worker for PWA support (Offline Capability)
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js")
        .then(reg => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
          
          // Check for service worker updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New service worker found and waiting to active!
                showUpdateToast(reg);
              }
            });
          });
          
          // Also cover cases where a waiting service worker is already sitting there
          if (reg.waiting) {
            showUpdateToast(reg);
          }
        })
        .catch(err => console.error("[PWA] Service Worker registration failed:", err));
    });

    // Automatically reload the page when the service worker changes (skipWaiting completes)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  }
}

/**
 * Display the update toast notification
 */
function showUpdateToast(registration) {
  const toast = document.getElementById("update-toast");
  const refreshBtn = document.getElementById("btn-update-refresh");
  
  if (toast && refreshBtn) {
    toast.style.display = "flex";
    
    refreshBtn.addEventListener("click", () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      toast.style.display = "none";
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
  // Set App Version in DOM
  document.getElementById("app-version-label").textContent = APP_VERSION;

  registerServiceWorker();
  
  // Initialize streak
  StorageController.checkAndUpdateStreak();
  
  // Load databases
  State.allWords = await loadAndParseVocabulary();
  State.allVerbs = await loadAndParseVerbConjugations();
  
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
  refreshVerbsState();

  // Tab switcher buttons
  const navBtnVocab = document.getElementById("nav-btn-vocab");
  const navBtnVerbs = document.getElementById("nav-btn-verbs");
  const navBtnProgress = document.getElementById("nav-btn-progress");

  navBtnVocab.addEventListener("click", () => {
    navBtnVocab.classList.add("active");
    navBtnVerbs.classList.remove("active");
    navBtnProgress.classList.remove("active");
    refreshWordsState();
    UIController.showScreen("setup");
  });

  navBtnVerbs.addEventListener("click", () => {
    navBtnVerbs.classList.add("active");
    navBtnVocab.classList.remove("active");
    navBtnProgress.classList.remove("active");
    refreshVerbsState();
    UIController.showScreen("verbsSetup");
  });

  navBtnProgress.addEventListener("click", () => {
    navBtnProgress.classList.add("active");
    navBtnVocab.classList.remove("active");
    navBtnVerbs.classList.remove("active");

    const studiedIds = StorageController.getStudiedWords();
    const correctIds = StorageController.getCorrectWords();
    const wrongIds = StorageController.getWrongWords();
    const logs = StorageController.getProgressLogs();
    const streak = StorageController.getStreakStats();

    UIController.renderProgressDashboard(
      State.allWords,
      studiedIds,
      correctIds,
      wrongIds,
      logs,
      streak
    );
    UIController.showScreen("progress");
  });

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
    },

    // ==================== VERB SYSTEM CALLBACKS ====================
    onStartVerbs({ selectedClasses, bookmarkOnly, targets, mode }) {
      refreshVerbsState();

      const bookmarks = StorageController.getBookmarks();

      // Filter verb pool based on selections
      State.filteredVerbsPool = filterVerbPool(State.allVerbs, {
        selectedClasses,
        bookmarkOnly,
        bookmarkedIds: bookmarks
      });

      if (State.filteredVerbsPool.length === 0) {
        alert("目前的篩選條件下無符合動詞，請重新篩選！");
        return;
      }

      State.currentVerbMode = mode;
      State.currentVerbIndex = 0;

      // Handle Lookup Table Mode
      if (mode === "lookup") {
        UIController.showScreen("verbsLookup");
        UIController.renderVerbsLookup(
          State.filteredVerbsPool,
          bookmarks,
          onVerbStarToggle,
          speakJapanese
        );
        return;
      }

      // Handle Card Study or Quiz modes
      if (!targets || targets.length === 0) {
        targets = ["teForm", "dictForm", "naiForm", "taForm"]; // Default fallback
      }
      State.currentVerbTargets = targets;

      // Shuffle verbs
      State.verbsQuizQueue = shuffleArray([...State.filteredVerbsPool]);

      // Pre-generate target conjugation form for each question (mixed conjugation support)
      State.verbsTargetFormsQueue = State.verbsQuizQueue.map(() => {
        const rIdx = Math.floor(Math.random() * targets.length);
        return targets[rIdx];
      });

      // Initialize session totals
      State.verbsSession.correct = 0;
      State.verbsSession.mistakes = [];
      State.verbsSession.total = Math.min(State.verbsQuizQueue.length, 10);
      if (mode === "study") {
        State.verbsSession.total = State.verbsQuizQueue.length;
      }

      if (mode === "study") {
        UIController.showScreen("verbsStudy");
        renderCurrentVerbStudyCard();
      } else {
        UIController.showScreen("verbsQuiz");
        renderCurrentVerbQuizQuestion();
      }
    },

    onGoVerbsHome() {
      refreshVerbsState();
      UIController.showScreen("verbsSetup");
    },

    onVerbSearch(query) {
      const q = query.trim().toLowerCase();
      const bookmarks = StorageController.getBookmarks();

      const filtered = State.filteredVerbsPool.filter(item => {
        return item.masuForm.toLowerCase().includes(q) ||
               item.reading.toLowerCase().includes(q) ||
               item.teForm.toLowerCase().includes(q) ||
               item.dictForm.toLowerCase().includes(q) ||
               item.naiForm.toLowerCase().includes(q) ||
               item.taForm.toLowerCase().includes(q) ||
               item.translation.toLowerCase().includes(q);
      });

      UIController.renderVerbsLookup(filtered, bookmarks, onVerbStarToggle, speakJapanese);
    },

    onVerbBookmarkToggle(source) {
      const item = State.verbsQuizQueue[State.currentVerbIndex];
      const isStarred = StorageController.isBookmarked(item.id);

      if (isStarred) {
        StorageController.removeBookmark(item.id);
      } else {
        StorageController.addBookmark(item.id);
      }

      refreshVerbsState();
      refreshWordsState();

      const activeAfter = StorageController.isBookmarked(item.id);
      if (source === "study") {
        document.getElementById("verb-study-star-btn").classList.toggle("active", activeAfter);
      } else {
        document.getElementById("verb-quiz-star-btn").classList.toggle("active", activeAfter);
      }
    },

    onPrevVerbCard() {
      if (State.currentVerbIndex > 0) {
        State.currentVerbIndex--;
        renderCurrentVerbStudyCard();
      }
    },

    onNextVerbCard() {
      if (State.currentVerbIndex < State.verbsQuizQueue.length - 1) {
        State.currentVerbIndex++;
        renderCurrentVerbStudyCard();
      }
    },

    onVerbSpellingSubmit(typed) {
      const item = State.verbsQuizQueue[State.currentVerbIndex];
      const targetForm = State.verbsTargetFormsQueue[State.currentVerbIndex];
      const correctText = item[targetForm];
      const isCorrect = verifyVerbSpelling(typed, correctText);
      handleVerbAnswer(isCorrect, typed);
    },

    onNextVerbQuestion() {
      State.currentVerbIndex++;
      if (State.currentVerbIndex >= State.verbsSession.total) {
        // Round complete
        UIController.showScreen("verbsSummary");
        UIController.renderVerbsSummary(
          {
            total: State.verbsSession.total,
            correct: State.verbsSession.correct,
            accuracy: Math.round((State.verbsSession.correct / State.verbsSession.total) * 100),
            mistakes: State.verbsSession.mistakes
          },
          (itemId) => {
            const isStarred = StorageController.isBookmarked(itemId);
            if (isStarred) {
              StorageController.removeBookmark(itemId);
            } else {
              StorageController.addBookmark(itemId);
            }
            refreshVerbsState();
            refreshWordsState();
            return StorageController.isBookmarked(itemId);
          }
        );
      } else {
        renderCurrentVerbQuizQuestion();
      }
    },

    onVerbTTSPlay(source) {
      const item = State.verbsQuizQueue[State.currentVerbIndex];
      const targetForm = State.verbsTargetFormsQueue[State.currentVerbIndex];
      speakJapanese(item[targetForm]);
    },

    onProgressReset() {
      StorageController.clearProgressData();
      const streak = StorageController.checkAndUpdateStreak();
      const studiedIds = StorageController.getStudiedWords();
      const correctIds = StorageController.getCorrectWords();
      const wrongIds = StorageController.getWrongWords();
      const logs = StorageController.getProgressLogs();

      UIController.renderProgressDashboard(
        State.allWords,
        studiedIds,
        correctIds,
        wrongIds,
        logs,
        streak
      );
    }
  });
}

// Render helper for Flashcards
function renderCurrentStudyCard() {
  const item = State.quizQueue[State.currentIndex];
  const isStarred = StorageController.isBookmarked(item.id);
  UIController.renderFlashcard(item, State.currentIndex, State.quizQueue.length, isStarred);
  
  // Track study progress
  StorageController.addStudiedWord(item.id);
  StorageController.recordActivity("vocab", "study");
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
    StorageController.addCorrectWord(item.id);
    StorageController.recordActivity("vocab", "quiz", { isCorrect: true });
  } else {
    // Record mistake in LocalStorage and session list
    StorageController.addWrongWord(item.id);
    if (!State.session.mistakes.some(m => m.id === item.id)) {
      State.session.mistakes.push(item);
    }
    StorageController.removeCorrectWord(item.id);
    StorageController.recordActivity("vocab", "quiz", { isCorrect: false });
  }

  // Update feedback screen
  UIController.showFeedback(item, isCorrect);
}

// Inject showFeedback custom wrapper in UIController
UIController.showFeedback = function(item, isCorrect) {
  this.showQuizFeedback(item, isCorrect);
};

// Verb state refreshes
function refreshVerbsState() {
  const bookmarks = StorageController.getBookmarks();
  State.allVerbs.forEach(item => {
    item.isBookmarked = bookmarks.includes(item.id);
  });
  const bookmarkedVerbsCount = State.allVerbs.filter(item => item.isBookmarked).length;
  UIController.renderVerbsSetup(bookmarkedVerbsCount);
}

function onVerbStarToggle(itemId) {
  const isStarred = StorageController.isBookmarked(itemId);
  if (isStarred) {
    StorageController.removeBookmark(itemId);
  } else {
    StorageController.addBookmark(itemId);
  }
  refreshVerbsState();
  refreshWordsState();
  return StorageController.isBookmarked(itemId);
}

function renderCurrentVerbStudyCard() {
  const item = State.verbsQuizQueue[State.currentVerbIndex];
  const targetForm = State.verbsTargetFormsQueue[State.currentVerbIndex];
  const isStarred = StorageController.isBookmarked(item.id);
  UIController.renderVerbsFlashcard(
    item,
    targetForm,
    CONJUGATION_LABELS[targetForm],
    State.currentVerbIndex,
    State.verbsQuizQueue.length,
    isStarred
  );

  // Track study progress for verbs
  StorageController.addStudiedWord(item.id);
  StorageController.recordActivity("verb", "study");
}

function renderCurrentVerbQuizQuestion() {
  const item = State.verbsQuizQueue[State.currentVerbIndex];
  const targetForm = State.verbsTargetFormsQueue[State.currentVerbIndex];
  const isStarred = StorageController.isBookmarked(item.id);

  UIController.renderVerbsQuiz(
    item,
    targetForm,
    CONJUGATION_LABELS[targetForm],
    State.currentVerbIndex,
    State.verbsSession.total,
    isStarred,
    State.currentVerbMode
  );

  if (State.currentVerbMode === "quiz-mcq") {
    const choices = generateVerbQuizOptions(item, targetForm, State.allVerbs);
    const correctText = item[targetForm];
    UIController.renderVerbsMCQChoices(choices, correctText, (isCorrect, selectedText) => {
      handleVerbAnswer(isCorrect, selectedText);
    });
  }
}

function handleVerbAnswer(isCorrect, answerValue) {
  const item = State.verbsQuizQueue[State.currentVerbIndex];

  if (isCorrect) {
    State.verbsSession.correct++;
    StorageController.addCorrectWord(item.id);
    StorageController.recordActivity("verb", "quiz", { isCorrect: true });
  } else {
    if (!State.verbsSession.mistakes.some(m => m.id === item.id)) {
      State.verbsSession.mistakes.push(item);
    }
    StorageController.removeCorrectWord(item.id);
    StorageController.recordActivity("verb", "quiz", { isCorrect: false });
  }

  UIController.showVerbsQuizFeedback(item, item[State.verbsTargetFormsQueue[State.currentVerbIndex]], isCorrect);
}

// Start the application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initApp);
