/**
 * Parses the vocabulary markdown file (vocabulary_list.md) into a structured array of VocabularyItems.
 */
export async function loadAndParseVocabulary(filePath = "./specs/vocabulary_list.md") {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch vocabulary file: ${response.status} ${response.statusText}`);
    }
    const markdownText = await response.text();
    return parseVocabularyMarkdown(markdownText);
  } catch (error) {
    console.error("Error loading vocabulary:", error);
    return [];
  }
}

export function parseVocabularyMarkdown(markdownText) {
  const lines = markdownText.split("\n");
  const items = [];
  
  let currentLesson = "";
  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect Lesson Header (e.g., "## 第 13 課")
    if (line.startsWith("## ")) {
      currentLesson = line.substring(3).trim();
      continue;
    }
    
    // Detect Section Header (e.g., "### 核心單字" or "### 會話與相關單字")
    if (line.startsWith("### ")) {
      currentSection = line.substring(4).trim();
      continue;
    }
    
    // Parse Table Row (e.g., "| 遊びます | あそびます | 玩、遊玩 |  |")
    if (line.startsWith("|") && line.endsWith("|")) {
      const columns = line.split("|").map(col => col.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Skip headers or separators (e.g., "| 單字 | 讀音(50音) |" or "| --- | --- |")
      if (columns.length < 3 || columns[0] === "單字" || columns[0].startsWith("---")) {
        continue;
      }
      
      const word = columns[0];
      const reading = columns[1];
      const translation = columns[2];
      const notes = columns[3] || "";
      
      if (word && reading && translation) {
        // Generate unique ID based on word and reading (safe for duplicates across lessons)
        const id = `${word}_${reading}`;
        items.push({
          id,
          lesson: currentLesson,
          section: currentSection,
          word,
          reading,
          translation,
          notes,
          isBookmarked: false,
          isWrong: false
        });
      }
    }
  }
  
  return items;
}
