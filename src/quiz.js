/**
 * Quiz and option generation logic
 */

// Fisher-Yates shuffle algorithm to randomize arrays
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Filter word list based on selected criteria
 * @param {Array} allItems - All parsed items
 * @param {Array} selectedLessons - List of lessons (e.g. ["第 13 課", "第 14 課"])
 * @param {boolean} bookmarkOnly - If true, filter by bookmarked words only
 * @param {Array} bookmarkedIds - List of bookmark IDs
 * @param {boolean} wrongOnly - If true, filter by mistake book only
 * @param {Array} wrongIds - List of wrong word IDs
 */
export function filterWordPool(allItems, { selectedLessons = [], bookmarkOnly = false, bookmarkedIds = [], wrongOnly = false, wrongIds = [] }) {
  let pool = [];

  if (bookmarkOnly) {
    pool = allItems.filter(item => bookmarkedIds.includes(item.id));
  } else if (wrongOnly) {
    pool = allItems.filter(item => wrongIds.includes(item.id));
  } else {
    // Standard lesson filtering
    if (selectedLessons.length > 0) {
      pool = allItems.filter(item => selectedLessons.includes(item.lesson));
    } else {
      pool = [...allItems];
    }
  }

  return pool;
}

/**
 * Generate 4 multiple-choice options for a given target word
 * @param {Object} targetItem - The question vocabulary item
 * @param {Array} pool - The filtered word pool to draw distractors from
 * @param {Array} fallbackPool - The complete database to draw distractors from if pool is too small
 * @param {string} mode - "jp_to_zh" (options are Chinese translations) or "zh_to_jp" (options are Japanese words)
 */
export function generateQuizOptions(targetItem, pool, fallbackPool, mode = "jp_to_zh") {
  const options = [];
  
  // Decide what property represents the value/text of the option
  const valueProp = mode === "jp_to_zh" ? "translation" : "word";
  const correctText = targetItem[valueProp];
  options.push(correctText);

  // Combine pool and fallback pool to ensure we have enough distractors
  const potentialDistractors = [...pool, ...fallbackPool];
  const uniqueDistractors = [];
  
  for (const item of potentialDistractors) {
    const text = item[valueProp];
    if (text !== correctText && !uniqueDistractors.includes(text)) {
      uniqueDistractors.push(text);
    }
  }

  // Shuffle unique distractors and pick 3
  const shuffledDistractors = shuffleArray(uniqueDistractors);
  const selectedDistractors = shuffledDistractors.slice(0, 3);

  // Merge correct answer and distractors
  options.push(...selectedDistractors);

  // If we still have less than 4 options (extremely rare), add dummy options
  while (options.length < 4) {
    options.push(`選項 ${options.length + 1}`);
  }

  return shuffleArray(options);
}

/**
 * Perform loose matching on typed reading input
 * - Removes leading/trailing spaces
 * - Standardizes full-width spaces
 * - Supports Hiragana and Katakana compatibility checks if needed
 */
export function verifyReadingInput(userInput, correctReading) {
  const cleanInput = userInput.trim().replace(/[\s　]+/g, ""); // Remove all types of spaces
  const cleanCorrect = correctReading.trim().replace(/[\s　]+/g, "");

  // Convert typical Katakana input to Hiragana for loose matching if required
  const toHiragana = (str) => {
    return str.replace(/[\u30a1-\u30f6]/g, (match) => {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    });
  };

  return toHiragana(cleanInput) === toHiragana(cleanCorrect);
}

/**
 * Generate hints for a given reading
 * @param {string} correctReading - Flat reading (e.g. "あそびます")
 */
export function generateReadingHint(correctReading) {
  const clean = correctReading.replace(/[\s　]+/g, "");
  if (clean.length === 0) return { firstChar: "", length: 0 };
  return {
    firstChar: clean.charAt(0),
    length: clean.length
  };
}
