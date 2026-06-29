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

/**
 * Returns corresponding CSS class for part of speech badges
 */
export function getPosClass(posText) {
  if (!posText) return "pos-phrase";
  const clean = posText.trim();
  if (clean.includes("動詞")) return "pos-verb";
  if (clean.includes("形容詞")) return "pos-adj";
  if (clean.includes("名詞")) return "pos-noun";
  if (clean.includes("副詞")) return "pos-adv";
  return "pos-phrase";
}

export const UIController = {
  // Screen DOM elements
  screens: {
    setup: document.getElementById("screen-setup"),
    study: document.getElementById("screen-study"),
    quiz: document.getElementById("screen-quiz"),
    summary: document.getElementById("screen-summary"),
    verbsSetup: document.getElementById("screen-verbs-setup"),
    verbsLookup: document.getElementById("screen-verbs-lookup"),
    verbsStudy: document.getElementById("screen-verbs-study"),
    verbsQuiz: document.getElementById("screen-verbs-quiz"),
    verbsSummary: document.getElementById("screen-verbs-summary"),
    progress: document.getElementById("screen-progress")
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
    this.bindVerbsSetupEvents();
    this.bindProgressEvents();
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

    const nav = document.querySelector(".app-nav");
    if (nav) {
      if (screenId === "setup" || screenId === "verbsSetup" || screenId === "progress") {
        nav.style.display = "flex";
      } else {
        nav.style.display = "none";
      }
    }
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
    this.syncLessonSelectionState();
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

  syncVerbSelectionState() {
    if (this.selectedVerbMode === "lookup") {
      document.getElementById("btn-verb-start-action").disabled = false;
      return;
    }

    const hasClassChecked = document.getElementById("verb-class-1").checked ||
                           document.getElementById("verb-class-2").checked ||
                           document.getElementById("verb-class-3").checked;
    const hasScope = hasClassChecked || this.verbBookmarkOnly;

    const hasTargetChecked = document.getElementById("verb-target-te").checked ||
                            document.getElementById("verb-target-dict").checked ||
                            document.getElementById("verb-target-nai").checked ||
                            document.getElementById("verb-target-ta").checked;

    document.getElementById("btn-verb-start-action").disabled = !(hasScope && hasTargetChecked);
  },

  bindVerbsSetupEvents() {
    // Bookmark filter row in Verbs Setup
    const verbBookmarkRow = document.getElementById("verb-scope-row-bookmark");
    this.verbBookmarkOnly = false;
    
    const class1 = document.getElementById("verb-class-1");
    const class2 = document.getElementById("verb-class-2");
    const class3 = document.getElementById("verb-class-3");

    const targetTe = document.getElementById("verb-target-te");
    const targetDict = document.getElementById("verb-target-dict");
    const targetNai = document.getElementById("verb-target-nai");
    const targetTa = document.getElementById("verb-target-ta");

    const ensureNotLookupMode = () => {
      if (this.selectedVerbMode === "lookup") {
        this.selectedVerbMode = "study";
        document.querySelectorAll("[data-verb-mode]").forEach(c => {
          c.classList.toggle("selected", c.dataset.verbMode === "study");
        });
      }
    };

    verbBookmarkRow.addEventListener("click", () => {
      ensureNotLookupMode();
      this.verbBookmarkOnly = !this.verbBookmarkOnly;
      verbBookmarkRow.classList.toggle("selected", this.verbBookmarkOnly);
      if (this.verbBookmarkOnly) {
        class1.checked = false;
        class2.checked = false;
        class3.checked = false;
      }
      this.syncVerbSelectionState();
    });

    const handleClassChange = () => {
      ensureNotLookupMode();
      if (class1.checked || class2.checked || class3.checked) {
        this.verbBookmarkOnly = false;
        verbBookmarkRow.classList.remove("selected");
      }
      this.syncVerbSelectionState();
    };

    class1.addEventListener("change", handleClassChange);
    class2.addEventListener("change", handleClassChange);
    class3.addEventListener("change", handleClassChange);

    const handleTargetChange = () => {
      ensureNotLookupMode();
      this.syncVerbSelectionState();
    };

    targetTe.addEventListener("change", handleTargetChange);
    targetDict.addEventListener("change", handleTargetChange);
    targetNai.addEventListener("change", handleTargetChange);
    targetTa.addEventListener("change", handleTargetChange);

    // Mode Selector Cards in Verbs Setup
    this.selectedVerbMode = "lookup";
    document.querySelectorAll("[data-verb-mode]").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll("[data-verb-mode]").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        this.selectedVerbMode = card.dataset.verbMode;

        if (this.selectedVerbMode === "lookup") {
          // Clear selections above
          class1.checked = false;
          class2.checked = false;
          class3.checked = false;
          this.verbBookmarkOnly = false;
          verbBookmarkRow.classList.remove("selected");

          targetTe.checked = false;
          targetDict.checked = false;
          targetNai.checked = false;
          targetTa.checked = false;
        } else {
          // Restore defaults if all were empty when switching back to study/quiz
          const hasClassChecked = class1.checked || class2.checked || class3.checked;
          if (!hasClassChecked && !this.verbBookmarkOnly) {
            class1.checked = true;
            class2.checked = true;
            class3.checked = true;
          }
          const hasTargetChecked = targetTe.checked || targetDict.checked || targetNai.checked || targetTa.checked;
          if (!hasTargetChecked) {
            targetTe.checked = true;
            targetDict.checked = true;
            targetNai.checked = true;
            targetTa.checked = true;
          }
        }
        this.syncVerbSelectionState();
      });
    });

    // Clear initially because lookup is selected by default
    class1.checked = false;
    class2.checked = false;
    class3.checked = false;
    this.verbBookmarkOnly = false;
    verbBookmarkRow.classList.remove("selected");

    targetTe.checked = false;
    targetDict.checked = false;
    targetNai.checked = false;
    targetTa.checked = false;

    this.syncVerbSelectionState();

    // Start Button in Verbs Setup
    document.getElementById("btn-verb-start-action").addEventListener("click", () => {
      if (this.callbacks.onStartVerbs) {
        // Collect checked verb classes
        const classes = [];
        if (document.getElementById("verb-class-1").checked) classes.push("1類動詞");
        if (document.getElementById("verb-class-2").checked) classes.push("2類動詞");
        if (document.getElementById("verb-class-3").checked) classes.push("3類動詞");

        // Collect checked target forms
        const targets = [];
        if (document.getElementById("verb-target-te").checked) targets.push("teForm");
        if (document.getElementById("verb-target-dict").checked) targets.push("dictForm");
        if (document.getElementById("verb-target-nai").checked) targets.push("naiForm");
        if (document.getElementById("verb-target-ta").checked) targets.push("taForm");

        this.callbacks.onStartVerbs({
          selectedClasses: classes,
          bookmarkOnly: this.verbBookmarkOnly,
          targets: targets,
          mode: this.selectedVerbMode
        });
      }
    });

    // Back to Verbs Setup Screen from other verb sub-modes
    document.querySelectorAll(".btn-go-verbs-home").forEach(btn => {
      btn.addEventListener("click", () => {
        if (this.callbacks.onGoVerbsHome) {
          this.callbacks.onGoVerbsHome();
        }
      });
    });

    // Search bar event for lookup
    const searchInput = document.getElementById("verb-search-input");
    searchInput.addEventListener("input", () => {
      if (this.callbacks.onVerbSearch) {
        this.callbacks.onVerbSearch(searchInput.value);
      }
    });

    // Flashcard interaction: Flip
    const flashcardScene = document.querySelector("#screen-verbs-study .flashcard-scene");
    if (flashcardScene) {
      flashcardScene.addEventListener("click", (e) => {
        if (e.target.closest("#verb-study-star-btn")) return;
        document.getElementById("verb-flashcard-inner").classList.toggle("flipped");
      });
    }

    // Bookmark toggle in Study Mode
    document.getElementById("verb-study-star-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.callbacks.onVerbBookmarkToggle) {
        this.callbacks.onVerbBookmarkToggle("study");
      }
    });

    // Prev/Next in Study Mode
    document.getElementById("btn-verb-study-prev").addEventListener("click", () => {
      if (this.callbacks.onPrevVerbCard) {
        this.callbacks.onPrevVerbCard();
      }
    });
    document.getElementById("btn-verb-study-next").addEventListener("click", () => {
      if (this.callbacks.onNextVerbCard) {
        this.callbacks.onNextVerbCard();
      }
    });

    // Bookmark toggle in Quiz Mode
    document.getElementById("verb-quiz-star-btn").addEventListener("click", () => {
      if (this.callbacks.onVerbBookmarkToggle) {
        this.callbacks.onVerbBookmarkToggle("quiz");
      }
    });

    // Spelling Submit in Quiz Mode
    document.getElementById("btn-verb-spelling-submit").addEventListener("click", () => {
      const typed = document.getElementById("verb-spelling-input").value;
      if (this.callbacks.onVerbSpellingSubmit) {
        this.callbacks.onVerbSpellingSubmit(typed);
      }
    });

    // Support pressing Enter in spelling input box
    document.getElementById("verb-spelling-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const typed = document.getElementById("verb-spelling-input").value;
        if (this.callbacks.onVerbSpellingSubmit) {
          this.callbacks.onVerbSpellingSubmit(typed);
        }
      }
    });

    // Next Question in Quiz Mode
    document.getElementById("btn-verb-quiz-next").addEventListener("click", () => {
      if (this.callbacks.onNextVerbQuestion) {
        this.callbacks.onNextVerbQuestion();
      }
    });

    // TTS speaker buttons
    document.getElementById("verb-study-tts-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.callbacks.onVerbTTSPlay) {
        this.callbacks.onVerbTTSPlay("study");
      }
    });
    document.getElementById("verb-quiz-tts-btn").addEventListener("click", (e) => {
      if (this.callbacks.onVerbTTSPlay) {
        this.callbacks.onVerbTTSPlay("quiz");
      }
    });
  },

  // --- Flashcard Study Screen Logic ---
  bindStudyEvents() {
    const innerCard = document.getElementById("flashcard-inner");
    
    // Toggle 3D flip card rotation on body click (avoiding bookmark button)
    innerCard.addEventListener("click", (e) => {
      if (e.target.closest("#study-star-btn") || e.target.closest("#study-dict-tts-btn")) return;
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

    // Dictionary Form TTS Voice synthesis
    document.getElementById("study-dict-tts-btn").addEventListener("click", (e) => {
      e.stopPropagation(); // prevent card flip
      const dictWord = document.getElementById("study-dict-word").textContent;
      speakJapanese(dictWord);
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
    
    // Render POS Badge with custom colors
    const posBadge = document.getElementById("study-pos-back");
    if (item.pos) {
      posBadge.textContent = item.pos;
      posBadge.className = `vocab-pos-badge ${getPosClass(item.pos)}`;
      posBadge.style.display = "inline-block";
    } else {
      posBadge.style.display = "none";
    }

    // Render Dictionary Form segment
    const dictWrapper = document.getElementById("study-dict-form-wrapper");
    if (item.dictionaryForm) {
      document.getElementById("study-dict-word").textContent = item.dictionaryForm;
      dictWrapper.style.display = "inline-flex";
    } else {
      dictWrapper.style.display = "none";
    }

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

    // Quiz feedback dictionary speaker TTS playback
    document.getElementById("quiz-dict-tts-btn").addEventListener("click", () => {
      const dictWord = document.querySelector("#quiz-dict-feedback-wrapper #quiz-dict-word").textContent;
      speakJapanese(dictWord);
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

    const qWord = document.getElementById("quiz-question-word");
    const choicesContainer = document.getElementById("quiz-choices-container");

    // Standard MCQ or Input Modes rendering
    if (mode === "jp_to_zh") {
      document.getElementById("quiz-mode-prompt").textContent = "看單字，選中文翻譯";
      qWord.textContent = item.word;
      qWord.setAttribute("lang", "ja");
      choicesContainer.style.display = "flex";
      choicesContainer.removeAttribute("lang");
      document.getElementById("quiz-input-container").style.display = "none";
    } else if (mode === "zh_to_jp") {
      document.getElementById("quiz-mode-prompt").textContent = "看中文翻譯，選日文單字";
      qWord.textContent = item.translation;
      qWord.removeAttribute("lang");
      choicesContainer.style.display = "flex";
      choicesContainer.setAttribute("lang", "ja");
      document.getElementById("quiz-input-container").style.display = "none";
    } else if (mode === "spelling") {
      document.getElementById("quiz-mode-prompt").textContent = "看單字，輸入平假名讀音";
      qWord.textContent = item.word;
      qWord.setAttribute("lang", "ja");
      choicesContainer.style.display = "none";
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
    cardEl.className = `quiz-card ${isCorrect ? "correct" : "wrong"}`;

    // Enable voice play button
    const ttsBtn = document.getElementById("quiz-tts-btn");
    ttsBtn.style.display = "inline-block";

    // If correct, play standard TTS sound immediately
    if (isCorrect) {
      speakJapanese(item.word);
    }

    // Render POS Badge
    const posBadge = document.getElementById("quiz-pos-feedback");
    if (item.pos) {
      posBadge.textContent = item.pos;
      posBadge.className = `vocab-pos-badge ${getPosClass(item.pos)}`;
      posBadge.style.display = "inline-block";
    } else {
      posBadge.style.display = "none";
    }

    // Render Dictionary Form
    const dictWrapper = document.getElementById("quiz-dict-feedback-wrapper");
    if (item.dictionaryForm) {
      const qdWord = document.getElementById("quiz-dict-word");
      qdWord.textContent = item.dictionaryForm;
      qdWord.setAttribute("lang", "ja");
      dictWrapper.style.display = "inline-flex";
    } else {
      dictWrapper.style.display = "none";
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
      row.setAttribute("lang", "ja");

      const left = document.createElement("div");
      left.className = "mistake-item-left";

      // Row for Word + POS Badge
      const wordRow = document.createElement("div");
      wordRow.className = "mistake-item-left-row";
      wordRow.innerHTML = `<h4>${item.word}</h4>`;
      
      if (item.pos) {
        const badge = document.createElement("span");
        badge.className = `vocab-pos-badge ${getPosClass(item.pos)}`;
        badge.style.fontSize = "10px";
        badge.style.padding = "2px 8px";
        badge.textContent = item.pos;
        wordRow.appendChild(badge);
      }
      left.appendChild(wordRow);

      // Details paragraph
      const details = document.createElement("p");
      let detailsText = `${item.reading} • ${item.translation}`;
      if (item.dictionaryForm) {
        detailsText += ` (原形: ${item.dictionaryForm})`;
      }
      details.textContent = detailsText;
      left.appendChild(details);
      
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
  },

  // --- Verb Conjugation Module UI ---

  renderVerbsSetup(bookmarkedVerbsCount) {
    document.getElementById("verb-scope-count-bookmark").textContent = bookmarkedVerbsCount;
  },

  renderVerbsLookup(verbs, bookmarkedIds, onStarToggleCallback, onPlayAudioCallback) {
    const tbody = document.getElementById("verb-lookup-tbody");
    tbody.innerHTML = "";

    if (verbs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px 0;color:var(--text-muted);">無符合篩選條件的動詞。</td></tr>`;
      return;
    }

    verbs.forEach(item => {
      const tr = document.createElement("tr");
      const isStarred = bookmarkedIds.includes(item.id);

      // Star cell
      const tdStar = document.createElement("td");
      const starBtn = document.createElement("button");
      starBtn.className = `btn-star-verb ${isStarred ? "active" : ""}`;
      starBtn.textContent = "★";
      starBtn.addEventListener("click", () => {
        const active = onStarToggleCallback(item.id);
        starBtn.classList.toggle("active", active);
      });
      tdStar.appendChild(starBtn);
      tr.appendChild(tdStar);

      // Helper function to build cells with TTS audio button
      const createAudioCell = (text) => {
        const td = document.createElement("td");
        
        const wrapper = document.createElement("div");
        wrapper.className = "audio-cell-wrapper";
        
        const span = document.createElement("span");
        span.textContent = text;
        wrapper.appendChild(span);

        const playBtn = document.createElement("button");
        playBtn.className = "btn-audio";
        playBtn.textContent = "🔊";
        playBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          onPlayAudioCallback(text);
        });
        wrapper.appendChild(playBtn);
        
        td.appendChild(wrapper);
        return td;
      };

      tr.appendChild(createAudioCell(item.masuForm));
      tr.appendChild(createAudioCell(item.teForm));
      tr.appendChild(createAudioCell(item.dictForm));
      tr.appendChild(createAudioCell(item.naiForm));
      tr.appendChild(createAudioCell(item.taForm));

      // Translation cell
      const tdTrans = document.createElement("td");
      tdTrans.textContent = item.translation;
      tr.appendChild(tdTrans);

      // Class cell
      const tdClass = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `vocab-pos-badge ${getPosClass(item.verbClass)}`;
      badge.style.fontSize = "11px";
      badge.style.padding = "2px 8px";
      badge.textContent = item.verbClass;
      tdClass.appendChild(badge);
      tr.appendChild(tdClass);

      tbody.appendChild(tr);
    });
  },

  renderVerbsFlashcard(item, targetForm, targetFormText, index, total, isBookmarked) {
    document.getElementById("verb-flashcard-inner").classList.remove("flipped");

    document.getElementById("verb-study-class-front").textContent = item.verbClass;
    document.getElementById("verb-study-class-front").className = `vocab-lesson-tag vocab-pos-badge ${getPosClass(item.verbClass)}`;
    document.getElementById("verb-study-word-front").textContent = item.masuForm;
    document.getElementById("verb-study-trans-front").textContent = item.translation;
    document.getElementById("verb-study-target-form-label").textContent = targetFormText;

    document.getElementById("verb-study-answer-back").textContent = item[targetForm];
    document.getElementById("verb-study-meaning-back").textContent = item.translation;
    document.getElementById("verb-study-dict-back").textContent = item.dictForm;

    // Star button
    const starBtn = document.getElementById("verb-study-star-btn");
    starBtn.classList.toggle("active", isBookmarked);

    // Progress
    document.getElementById("verb-study-progress-indicator").textContent = `${index + 1} / ${total}`;
  },

  renderVerbsQuiz(item, targetForm, targetFormText, index, total, isBookmarked, mode) {
    const cardEl = document.getElementById("verb-quiz-card-display");
    cardEl.className = "quiz-card";

    document.getElementById("verb-quiz-star-btn").classList.toggle("active", isBookmarked);
    document.getElementById("verb-quiz-progress-indicator").textContent = `${index + 1} / ${total}`;
    
    document.getElementById("verb-quiz-target-prompt").textContent = targetFormText;
    document.getElementById("verb-quiz-question-word").textContent = item.masuForm;
    document.getElementById("verb-quiz-question-trans").textContent = item.translation;

    document.getElementById("verb-quiz-feedback-panel").style.display = "none";
    document.getElementById("verb-quiz-tts-btn").style.display = "none";

    document.getElementById("verb-spelling-input").value = "";
    document.getElementById("verb-spelling-textbox-wrapper").className = "textbox-container";

    if (mode === "quiz-mcq") {
      document.getElementById("verb-quiz-choices-container").style.display = "flex";
      document.getElementById("verb-quiz-input-container").style.display = "none";
    } else {
      document.getElementById("verb-quiz-choices-container").style.display = "none";
      document.getElementById("verb-quiz-input-container").style.display = "flex";
      document.getElementById("verb-spelling-input").disabled = false;
      document.getElementById("verb-spelling-input").focus();
    }
  },

  renderVerbsMCQChoices(choices, correctText, onSelectCallback) {
    const container = document.getElementById("verb-quiz-choices-container");
    container.innerHTML = "";

    choices.forEach(text => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = text;
      btn.addEventListener("click", () => {
        document.querySelectorAll("#verb-quiz-choices-container .option-btn").forEach(b => b.disabled = true);
        const isCorrect = (text === correctText);
        btn.classList.add(isCorrect ? "correct" : "wrong");

        if (!isCorrect) {
          document.querySelectorAll("#verb-quiz-choices-container .option-btn").forEach(b => {
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

  showVerbsQuizFeedback(item, correctConjugation, isCorrect) {
    const cardEl = document.getElementById("verb-quiz-card-display");
    cardEl.className = `quiz-card ${isCorrect ? "correct" : "wrong"}`;

    const ttsBtn = document.getElementById("verb-quiz-tts-btn");
    ttsBtn.style.display = "inline-block";
    if (isCorrect) {
      speakJapanese(correctConjugation);
    }

    document.getElementById("verb-feedback-correct-reading").textContent = `正確答案：${correctConjugation}`;
    document.getElementById("verb-feedback-meaning").textContent = `翻譯：${item.translation}`;

    // Populate lookup grid
    document.getElementById("verb-feed-masu").textContent = item.masuForm;
    document.getElementById("verb-feed-te").textContent = item.teForm;
    document.getElementById("verb-feed-dict").textContent = item.dictForm;
    document.getElementById("verb-feed-nai").textContent = item.naiForm;
    document.getElementById("verb-feed-ta").textContent = item.taForm;

    document.getElementById("verb-quiz-feedback-panel").style.display = "flex";

    const textInput = document.getElementById("verb-spelling-input");
    if (textInput) {
      textInput.disabled = true;
      document.getElementById("verb-spelling-textbox-wrapper").className = `textbox-container ${isCorrect ? "correct" : "wrong"}`;
    }
  },

  renderVerbsSummary(sessionStats, onStarToggleCallback) {
    document.getElementById("verb-summary-accuracy").textContent = `${sessionStats.accuracy}%`;
    document.getElementById("verb-summary-score").textContent = `${sessionStats.correct} / ${sessionStats.total}`;

    const container = document.getElementById("verb-summary-mistakes-list");
    container.innerHTML = "";

    if (sessionStats.mistakes.length === 0) {
      container.innerHTML = `<div class="description" style="text-align:center;padding:20px 0;">🎉 太厲害了！本次測驗全對，無答錯動詞。</div>`;
      return;
    }

    sessionStats.mistakes.forEach(item => {
      const row = document.createElement("div");
      row.className = "mistake-item";
      row.setAttribute("lang", "ja");

      const left = document.createElement("div");
      left.className = "mistake-item-left";

      const wordRow = document.createElement("div");
      wordRow.className = "mistake-item-left-row";
      wordRow.innerHTML = `<h4>${item.masuForm}</h4>`;
      
      const badge = document.createElement("span");
      badge.className = `vocab-pos-badge ${getPosClass(item.verbClass)}`;
      badge.style.fontSize = "10px";
      badge.style.padding = "2px 8px";
      badge.textContent = item.verbClass;
      wordRow.appendChild(badge);
      left.appendChild(wordRow);

      const details = document.createElement("p");
      details.textContent = `${item.translation} • て: ${item.teForm} • 字典: ${item.dictForm}`;
      left.appendChild(details);

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
  },

  bindProgressEvents() {
    document.getElementById("btn-progress-reset").addEventListener("click", () => {
      if (confirm("您確定要重設所有學習進度與連續登入數據嗎？此動作將無法復原。")) {
        if (this.callbacks.onProgressReset) {
          this.callbacks.onProgressReset();
        }
      }
    });
  },

  renderProgressDashboard(allWords, studiedIds, correctIds, wrongIds, logs, streak) {
    // 1. Update Streak info
    document.getElementById("progress-current-streak").textContent = `${streak.currentStreak || 0} 天`;
    document.getElementById("progress-longest-streak").textContent = streak.longestStreak || 0;

    // 2. Update Overall Stats
    const totalStudied = studiedIds.length;
    document.getElementById("progress-total-cards").textContent = `${totalStudied} 張`;

    let overallAccuracy = 0;
    if (logs && logs.length > 0) {
      let totalQuiz = 0;
      let totalCorrect = 0;
      logs.forEach(log => {
        totalQuiz += (log.vocabQuizTotal || 0) + (log.verbQuizTotal || 0);
        totalCorrect += (log.vocabQuizCorrect || 0) + (log.verbQuizCorrect || 0);
      });
      if (totalQuiz > 0) {
        overallAccuracy = Math.round((totalCorrect / totalQuiz) * 100);
      }
    }
    document.getElementById("progress-overall-accuracy").textContent = `${overallAccuracy}%`;

    // 3. Render 7-day bar chart
    const chartBarsContainer = document.getElementById("progress-chart-bars");
    chartBarsContainer.innerHTML = "";

    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }

    const activityScores = dates.map(dateStr => {
      const log = logs.find(l => l.date === dateStr);
      if (!log) return 0;
      return (log.vocabStudyCount || 0) + (log.vocabQuizTotal || 0) + (log.verbStudyCount || 0) + (log.verbQuizTotal || 0);
    });

    const maxScore = Math.max(...activityScores, 1);

    dates.forEach((dateStr, idx) => {
      const score = activityScores[idx];
      const percent = Math.min(100, Math.round((score / maxScore) * 100));

      const wrapper = document.createElement("div");
      const isToday = idx === 6;
      wrapper.className = `chart-bar-wrapper ${isToday ? "today" : ""}`;

      const shortDateLabel = dateStr.substring(8); // "DD"

      wrapper.innerHTML = `
        <span class="chart-label-val">${score}</span>
        <div class="chart-bar-container">
          <div class="chart-bar-fill" style="height: ${percent}%"></div>
        </div>
        <span class="chart-label-date">${isToday ? "今天" : shortDateLabel}</span>
      `;
      chartBarsContainer.appendChild(wrapper);
    });

    // 4. Render Lesson Progress List
    const lessonsContainer = document.getElementById("progress-lessons-container");
    lessonsContainer.innerHTML = "";

    const lessonsMap = {};
    allWords.forEach(word => {
      if (!lessonsMap[word.lesson]) {
        lessonsMap[word.lesson] = [];
      }
      lessonsMap[word.lesson].push(word);
    });

    const sortedLessons = Object.keys(lessonsMap).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.replace(/\D/g, "")) || 0;
      return numA - numB;
    });

    sortedLessons.forEach(lessonName => {
      const words = lessonsMap[lessonName];
      const totalWords = words.length;

      const studiedInLesson = words.filter(w => studiedIds.includes(w.id)).length;
      const studyRate = totalWords > 0 ? Math.round((studiedInLesson / totalWords) * 100) : 0;

      const correctInLesson = words.filter(w => correctIds.includes(w.id)).length;
      const quizRate = totalWords > 0 ? Math.round((correctInLesson / totalWords) * 100) : 0;

      const mistakesInLesson = words.filter(w => wrongIds.includes(w.id)).length;

      const card = document.createElement("div");
      card.className = "lesson-progress-card";
      
      let headerHTML = `<div class="lesson-card-title">${lessonName}</div>`;
      if (mistakesInLesson > 0) {
        headerHTML += `<span class="lesson-card-wrong-badge">⚠️ ${mistakesInLesson} 錯題</span>`;
      }

      card.innerHTML = `
        <div class="lesson-card-header">
          ${headerHTML}
        </div>
        <div class="lesson-card-progress-row">
          <div class="progress-row-label-container">
            <span>字卡瀏覽進度</span>
            <span class="progress-row-val">${studiedInLesson}/${totalWords} (${studyRate}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill study" style="width: ${studyRate}%"></div>
          </div>
        </div>
        <div class="lesson-card-progress-row">
          <div class="progress-row-label-container">
            <span>測驗掌握進度</span>
            <span class="progress-row-val">${correctInLesson}/${totalWords} (${quizRate}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill quiz" style="width: ${quizRate}%"></div>
          </div>
        </div>
      `;
      lessonsContainer.appendChild(card);
    });
  }
};

