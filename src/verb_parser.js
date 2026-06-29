/**
 * Parses the verb conjugation markdown file (verb_conjugation_list.md) into a structured array of VerbConjugationItems.
 */
export async function loadAndParseVerbConjugations(filePath = "./specs/verb_conjugation_list.md") {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch verb conjugation file: ${response.status} ${response.statusText}`);
    }
    const markdownText = await response.text();
    return parseVerbConjugationMarkdown(markdownText);
  } catch (error) {
    console.error("Error loading verb conjugations:", error);
    return [];
  }
}

export function parseVerbConjugationMarkdown(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const items = [];
  
  let currentVerbClass = ""; // E.g., "1類動詞", "2類動詞", "3類動詞"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect Verb Class Header (e.g., "## 1類動詞 (Class 1)")
    if (line.startsWith("## ")) {
      const headerText = line.substring(3).trim();
      if (headerText.includes("1類")) {
        currentVerbClass = "1類動詞";
      } else if (headerText.includes("2類")) {
        currentVerbClass = "2類動詞";
      } else if (headerText.includes("3類")) {
        currentVerbClass = "3類動詞";
      }
      continue;
    }
    
    // Parse Table Row (e.g., "| 遊びます | あそびます | あそんで | あそぶ | あそばない | あそんだ | 玩 | 13 |")
    if (line.startsWith("|") && line.endsWith("|")) {
      const columns = line.split("|").map(col => col.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Skip headers or separators (e.g., "| 單字 (ます形) |" or "| --- | --- |")
      if (columns.length < 8 || columns[0] === "單字 (ます形)" || columns[0].startsWith("---")) {
        continue;
      }
      
      const masuForm = columns[0];
      const reading = columns[1];
      const teForm = columns[2];
      const dictForm = columns[3];
      const naiForm = columns[4];
      const taForm = columns[5];
      const translation = columns[6];
      const lesson = columns[7];
      
      if (masuForm && reading && translation) {
        const id = `${masuForm}_${reading}`;
        items.push({
          id,
          masuForm,
          reading,
          teForm,
          dictForm,
          naiForm,
          taForm,
          translation,
          lesson,
          verbClass: currentVerbClass,
          isBookmarked: false
        });
      }
    }
  }
  
  return items;
}
