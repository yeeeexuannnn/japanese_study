/**
 * Browser speech synthesis wrapper for Japanese
 */
export function speakJapanese(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel(); // Stop current speech
    
    // Clean string from notes (e.g. remove [公園を~] or brackets)
    const cleanText = text.replace(/\[.*?\]/g, "").replace(/〔.*?〕/g, "").trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85; // Slightly slower pace for Japanese learners
    window.speechSynthesis.speak(utterance);
  }
}

export const UIController = {
  // Screen DOM elements
  screens: {
    setup: document.getElementById("screen-setup"),
    study: document.getElementById("screen-study"),
    quiz: document.getElementById("screen-quiz"),
    summary: document.getElementById("screen-summary")
  },

  // State caches
  selectedLessons: [],
  selectedMode: "study", // "study" | "jp_to_zh" | "zh_to_jp" | "spelling"
  bookmarkOnly: false,
  wrongOnly: false,

  // Event callbacks (attached by app.js)
  callbacks: {},

  init(lessonsList) {
    this.renderLessonsChips(lessonsList);
    this.bindSetupEvents();
    this.bindStudyEvents();
    this.bindQuizEvents();
  },

  registerCallbacks(cbs) {
    this.callbacks = cbs;
  },

  showScreen(screenId) {
    Object.keys(this.screens).forEach(key => {
      if (key === screenId) {
        this.screens[key].classList.add("active");
      } else {
        this.screens[key].classList.remove("active");
      }
    });
  },

  // --- Header Stats Display ---
  updateHeaderStats(bookmarksCount, wrongCount) {
    document.getElementById("header-bookmark-count").textContent = bookmarksCount;
    document.getElementById("header-wrong-count").textContent = wrongCount;
    
    document.getElementById("scope-count-bookmark").textContent = bookmarksCount;
    document.getElementById("scope-count-wrong").textContent = wrongCount;
  },

  // --- Setup Screen Logic ---
  renderLessonsChips(lessonsList = []) {
    const container = document.getElementById("lesson-chips-container");
    container.innerHTML = "";
    
    lessonsList.forEach(lesson => {
      const chip = document.createElement("div");
      chip.className = "lesson-chip";
      chip.textContent = lesson;
      chip.dataset.lesson = lesson;
      
      chip.addEventListener("click", () => {
        // De-select Bookmark / Wrong filters if lesson is clicked
        this.clearSpecialScopeSelections();
        
        chip.classList.toggle("selected");
        this.syncLessonSelectionState();
      });
      
      container.appendChild(chip);
    });
  },

  bindSetupEvents() {
    // Select All
    document.getElementById("btn-select-all").addEventListener("click", () => {
      this.clearSpecialScopeSelections();
      document.querySelectorAll(".lesson-chip").forEach(chip => chip.classList.add("selected"));
      this.syncLessonSelectionState();
    });

    // Select None
    document.getElementById("btn-select-none").addEventListener("click", () => {
      document.querySelectorAll(".lesson-chip").forEach(chip => chip.classList.remove("selected"));
      this.syncLessonSelectionState();
    });

    // Special scopes: Bookmark row
    const bookmarkRow = document.getElementById("scope-row-bookmark");
    bookmarkRow.addEventListener("click", () => {
      this.clearLessonSelections();
      this.wrongOnly = false;
      document.getElementById("scope-row-wrong").classList.remove("wrong-selected");
      
      this.bookmarkOnly = !this.bookmarkOnly;
      bookmarkRow.classList.toggle("selected", this.bookmarkOnly);
      this.syncLessonSelectionState();
    });

    // Special scopes: Wrong words row
    const wrongRow = document.getElementById("scope-row-wrong");
    wrongRow.addEventListener("click", () => {
      this.clearLessonSelections();
      this.bookmarkOnly = false;
      document.getElementById("scope-row-bookmark").classList.remove("selected");
      
      this.wrongOnly = !this.wrongOnly;
      wrongRow.classList.toggle("wrong-selected", this.wrongOnly);
      this.syncLessonSelectionState();
    });

    // Mode Selector Cards
    document.querySelectorAll(".mode-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        this.selectedMode = card.dataset.mode;
      });
    });

    // Start Button
    document.getElementById("btn-start-action").addEventListener("click", () => {
      if (this.callbacks.onStart) {
        this.callbacks.onStart({
          lessons: this.selectedLessons,
          bookmarkOnly: this.bookmarkOnly,
          wrongOnly: this.wrongOnly,
          mode: this.selectedMode
        });
      }
    });
  },

  clearLessonSelections() {
    document.querySelectorAll(".lesson-chip").forEach(chip => chip.classList.remove("selected"));
    this.selectedLessons = [];
  },

  clearSpecialScopeSelections() {
    this.bookmarkOnly = false;
    this.wrongOnly = false;
    document.getElementById("scope-row-bookmark").classList.remove("selected");
    document.getElementById("scope-row-wrong").classList.remove("wrong-selected");
  },

  syncLessonSelectionState() {
    const selected = [];
    document.querySelectorAll(".lesson-chip.selected").forEach(chip => {
      selected.push(chip.dataset.lesson);
    });
    this.selectedLessons = selected;
    
    // Enable/disable start button based on selection count
    const hasSelection = this.selectedLessons.length > 0 || this.bookmarkOnly || this.wrongOnly;
    document.getElementById("btn-start-action").disabled = !hasSelection;
  },

  // --- Flashcard Study Screen Logic ---
  bindStudyEvents() {
    const innerCard = document.getElementById("flashcard-inner");
    
    // Toggle 3D flip card rotation on body click (avoiding bookmark button)
    innerCard.addEventListener("click", (e) => {
      if (e.target.closest("#study-star-btn")) return;
      innerCard.classList.toggle("flipped");
    });

    // Bookmark Toggle star
    const starBtn = document.getElementById("study-star-btn");
    starBtn.addEventListener("click", () => {
      if (this.callbacks.onBookmarkToggle) {
        this.callbacks.onBookmarkToggle();
      }
    });

    // TTS Voice synthesis
    document.getElementById("study-tts-btn").addEventListener("click", (e) => {
      e.stopPropagation(); // prevent card flip
      const word = document.getElementById("study-word-front").textContent;
      speakJapanese(word);
    });

    // Card navigation controls
    document.getElementById("btn-study-prev").addEventListener("click", () => {
      if (this.callbacks.onPrevCard) this.callbacks.onPrevCard();
    });

    document.getElementById("btn-study-next").addEventListener("click", () => {
      if (this.callbacks.onNextCard) this.callbacks.onNextCard();
    });
    
    document.querySelectorAll(".btn-go-home").forEach(btn => {
      btn.addEventListener("click", () => {
        if (this.callbacks.onGoHome) this.callbacks.onGoHome();
      });
    });
  },

  renderFlashcard(item, index, total, isBookmarked) {
    // Reset flipped Y rotation on new card
    document.getElementById("flashcard-inner").classList.remove("flipped");
    
    // Set card fronts/backs
    document.getElementById("study-word-front").textContent = item.word;
    document.getElementById("study-lesson-front").textContent = `${item.lesson} • ${item.section}`;
    
    document.getElementById("study-reading-back").textContent = item.reading;
    document.getElementById("study-translation-back").textContent = item.translation;
    document.getElementById("study-notes-back").textContent = item.notes || "無註解";
    
    // Set active bookmark star state
    const starBtn = document.getElementById("study-star-btn");
    starBtn.classList.toggle("active", isBookmarked);
    
    // Update progress indicator
    document.getElementById("study-progress-indicator").textContent = `${index + 1} / ${total}`;
  },

  // --- Quiz Screen Logic ---
  bindQuizEvents() {
    // Star toggle on quiz cards
    const starBtn = document.getElementById("quiz-star-btn");
    starBtn.addEventListener("click", () => {
      if (this.callbacks.onBookmarkToggle) {
        this.callbacks.onBookmarkToggle();
      }
    });

    // Quiz feedback speaker TTS playback
    document.getElementById("quiz-tts-btn").addEventListener("click", () => {
      if (this.callbacks.onQuizTTSPlay) this.callbacks.onQuizTTSPlay();
    });

    // Hint toggle in spelling
    document.getElementById("btn-spelling-hint").addEventListener("click", () => {
      const hintBox = document.getElementById("spelling-hint-box");
      if (hintBox.style.display === "none") {
        if (this.callbacks.onSpellingHintRequest) {
          const hint = this.callbacks.onSpellingHintRequest();
          hintBox.textContent = `首字提示：${hint.firstChar}（共 ${hint.length} 個字）`;
          hintBox.style.display = "block";
        }
      } else {
        hintBox.style.display = "none";
      }
    });

    // Input text submit action
    document.getElementById("btn-spelling-submit").addEventListener("click", () => {
      const inputVal = document.getElementById("spelling-input").value;
      if (this.callbacks.onSpellingSubmit) {
        this.callbacks.onSpellingSubmit(inputVal);
      }
    });

    // Keyboard 'Enter' key mapping to submit/next question
    document.getElementById("spelling-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const feedbackVisible = document.getElementById("quiz-feedback-panel").style.display !== "none";
        if (feedbackVisible) {
          document.getElementById("btn-quiz-next").click();
        } else {
          document.getElementById("btn-spelling-submit").click();
        }
      }
    });

    // Next button
    document.getElementById("btn-quiz-next").addEventListener("click", () => {
      if (this.callbacks.onNextQuestion) this.callbacks.onNextQuestion();
    });
  },

  renderQuizQuestion(item, index, total, isBookmarked, mode) {
    // Reset card borders
    const cardEl = document.getElementById("quiz-card-display");
    cardEl.className = "quiz-card";

    // Set star button active state
    document.getElementById("quiz-star-btn").classList.toggle("active", isBookmarked);

    // Set progress
    document.getElementById("quiz-progress-indicator").textContent = `${index + 1} / ${total}`;

    // Hide feedback panel and voice button by default
    document.getElementById("quiz-feedback-panel").style.display = "none";
    document.getElementById("quiz-tts-btn").style.display = "none";

    // Clear input textbox
    document.getElementById("spelling-input").value = "";
    document.getElementById("spelling-hint-box").style.display = "none";
    document.getElementById("spelling-textbox-wrapper").className = "textbox-container";

    // Standard MCQ or Input Modes rendering
    if (mode === "jp_to_zh") {
      document.getElementById("quiz-mode-prompt").textContent = "看單字，選中文翻譯";
      document.getElementById("quiz-question-word").textContent = item.word;
      document.getElementById("quiz-choices-container").style.display = "flex";
      document.getElementById("quiz-input-container").style.display = "none";
    } else if (mode === "zh_to_jp") {
      document.getElementById("quiz-mode-prompt").textContent = "看中文翻譯，選日文單字";
      document.getElementById("quiz-question-word").textContent = item.translation;
      document.getElementById("quiz-choices-container").style.display = "flex";
      document.getElementById("quiz-input-container").style.display = "none";
    } else if (mode === "spelling") {
      document.getElementById("quiz-mode-prompt").textContent = "看單字，輸入平假名讀音";
      document.getElementById("quiz-question-word").textContent = item.word;
      document.getElementById("quiz-choices-container").style.display = "none";
      document.getElementById("quiz-input-container").style.display = "flex";
      document.getElementById("spelling-input").disabled = false;
      document.getElementById("spelling-input").focus();
    }
  },

  renderMCQChoices(choices, correctText, onSelectCallback) {
    const container = document.getElementById("quiz-choices-container");
    container.innerHTML = "";

    choices.forEach(text => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = text;
      
      btn.addEventListener("click", () => {
        // Disable choices to prevent multiple clicking
        document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
        
        const isCorrect = (text === correctText);
        btn.classList.add(isCorrect ? "correct" : "wrong");
        
        // If wrong, highlight correct one
        if (!isCorrect) {
          document.querySelectorAll(".option-btn").forEach(b => {
            if (b.textContent === correctText) {
              b.classList.add("correct");
            }
          });
        }

        onSelectCallback(isCorrect, text);
      });

      container.appendChild(btn);
    });
  },

  showQuizFeedback(item, isCorrect) {
    // Flash card border
    const cardEl = document.getElementById("quiz-card-display");
    cardEl.classList.add(isCorrect ? "correct" : "wrong");

    // Enable voice play button
    const ttsBtn = document.getElementById("quiz-tts-btn");
    ttsBtn.style.display = "inline-block";

    // If correct, play standard TTS sound immediately
    if (isCorrect) {
      speakJapanese(item.word);
    }

    // Render detailed explanations
    document.getElementById("feedback-answer-reading").textContent = `讀音：${item.reading}`;
    document.getElementById("feedback-answer-trans").textContent = `中文：${item.translation}`;
    document.getElementById("feedback-answer-notes").textContent = `註解：${item.notes || "無註解"}`;
    
    document.getElementById("quiz-feedback-panel").style.display = "flex";

    // Disable spelling textbox if spelling mode
    const textInput = document.getElementById("spelling-input");
    if (textInput) {
      textInput.disabled = true;
      document.getElementById("spelling-textbox-wrapper").className = `textbox-container ${isCorrect ? "correct" : "wrong"}`;
    }
  },

  // --- Summary Screen Logic ---
  renderSummary(sessionStats, onStarToggleCallback) {
    document.getElementById("summary-accuracy").textContent = `${sessionStats.accuracy}%`;
    document.getElementById("summary-score").textContent = `${sessionStats.correct} / ${sessionStats.total}`;

    const container = document.getElementById("summary-mistakes-list");
    container.innerHTML = "";

    if (sessionStats.mistakes.length === 0) {
      container.innerHTML = `<div class="description" style="text-align:center;padding:20px 0;">🎉 太厲害了！本次測驗全對，無答錯單字。</div>`;
      return;
    }

    sessionStats.mistakes.forEach(item => {
      const row = document.createElement("div");
      row.className = "mistake-item";

      const left = document.createElement("div");
      left.className = "mistake-item-left";
      left.innerHTML = `<h4>${item.word}</h4><p>${item.reading} • ${item.translation}</p>`;
      
      const starBtn = document.createElement("button");
      starBtn.className = `btn-star-item ${item.isBookmarked ? "active" : ""}`;
      starBtn.textContent = "★";
      
      starBtn.addEventListener("click", () => {
        const active = onStarToggleCallback(item.id);
        starBtn.classList.toggle("active", active);
      });

      row.appendChild(left);
      row.appendChild(starBtn);
      container.appendChild(row);
    });
  }
};
