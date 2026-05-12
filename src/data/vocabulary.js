// Vocabulary data extracted from Seoul National University Korean textbooks
// Book 1A, 1B, 2A (Student Book + Workbook)
// Korean-English pairs with chapter information
// Auto-generated from CSV files
// Use https://www.youpdf.com/pdf-to-txt.html to convert pdf to text

import vocab1A from './1A_combined.csv?raw'
import vocab1B from './1B_combined.csv?raw'
import vocab2A from './2A_combined.csv?raw'
import vocab2B from './2B_combined.csv?raw'

function parseCSV(csv) {
  const lines = csv.trim().split('\n')
  const pairs = []
  // Header: korean,english,chapter,chapterName
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Parse CSV with potential quoted fields
    const parts = line.split(',')
    if (parts.length >= 4) {
      pairs.push({
        korean: parts[0].replace(/^"|"$/g, ''),
        english: parts[1].replace(/^"|"$/g, ''),
        chapter: parts[2],
        chapterName: parts[3].replace(/^"|"$/g, '')
      })
    }
  }
  return pairs
}

const vocab1AData = parseCSV(vocab1A)
const vocab1BData = parseCSV(vocab1B)
const vocab2AData = parseCSV(vocab2A)
const vocab2BData = parseCSV(vocab2B)


// Extract unique chapters for each book
function getChapters(data) {
  const seen = new Set()
  const chapters = []
  for (const item of data) {
    if (item.chapter && !seen.has(item.chapter)) {
      seen.add(item.chapter)
      chapters.push({ id: item.chapter, name: item.chapterName })
    }
  }
  return chapters
}

export const chapters = {
  "1A": getChapters(vocab1AData),
  "1B": getChapters(vocab1BData),
  "2A": getChapters(vocab2AData),
  "2B": getChapters(vocab2BData),
}

export const vocabulary = {
  "1A": vocab1AData,
  "1B": vocab1BData,
  "2A": vocab2AData,
  "2B": vocab2BData,
  "All": [...vocab1AData, ...vocab1BData, ...vocab2AData, ...vocab2BData],
};

// Export list of available books for dynamic UI rendering
export const availableBooks = Object.keys(vocabulary).filter(key => key !== 'All');


