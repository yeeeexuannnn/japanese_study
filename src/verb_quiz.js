/**
 * Filter the verb pool based on active settings (verb Class filters and bookmarks).
 */
export function filterVerbPool(pool, { bookmarkOnly = false, bookmarkedIds = [], selectedClasses = [] }) {
  let filtered = pool;

  // Filter by bookmark if enabled
  if (bookmarkOnly) {
    filtered = filtered.filter(item => bookmarkedIds.includes(item.id));
  }

  // Filter by verb classes (1類動詞, 2類動詞, 3類動詞)
  if (selectedClasses && selectedClasses.length > 0) {
    filtered = filtered.filter(item => selectedClasses.includes(item.verbClass));
  }

  return filtered;
}

/**
 * Generate 4 options for MCQ verb quiz: 1 correct conjugation and 3 distractors.
 * Distractors are picked from verbs of the SAME class and using the SAME conjugation form to ensure challenge.
 */
export function generateVerbQuizOptions(targetItem, targetForm, fullPool, count = 4) {
  const correctText = targetItem[targetForm];
  if (!correctText) return [correctText];

  // Distractors pool: same verbClass, excluding the target verb itself
  let distractors = fullPool
    .filter(item => item.verbClass === targetItem.verbClass && item.id !== targetItem.id)
    .map(item => item[targetForm])
    .filter(val => val && val.trim() !== "" && val !== correctText);

  // Remove duplicates
  distractors = [...new Set(distractors)];

  // Shuffle distractors list
  shuffleArray(distractors);

  // Take up to count - 1 distractors
  let options = distractors.slice(0, count - 1);

  // Fallback: If we don't have enough distractors from the same class, pick from any class
  if (options.length < count - 1) {
    let globalDistractors = fullPool
      .filter(item => item.id !== targetItem.id)
      .map(item => item[targetForm])
      .filter(val => val && val.trim() !== "" && val !== correctText && !options.includes(val));
    globalDistractors = [...new Set(globalDistractors)];
    shuffleArray(globalDistractors);
    
    const needed = (count - 1) - options.length;
    options = options.concat(globalDistractors.slice(0, needed));
  }

  // Add correct answer
  options.push(correctText);

  // Shuffle all choices
  shuffleArray(options);

  return options;
}

/**
 * Verify flat spelling inputs with loose match rules.
 */
export function verifyVerbSpelling(userInput, correctConjugation) {
  const cleanInput = userInput.trim().replace(/[\s　]+/g, ""); // Remove spaces
  const cleanCorrect = correctConjugation.trim().replace(/[\s　]+/g, "");

  const toHiragana = (str) => {
    return str.replace(/[\u30a1-\u30f6]/g, (match) => {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    });
  };

  return toHiragana(cleanInput) === toHiragana(cleanCorrect);
}

// Utility Fisher-Yates shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
