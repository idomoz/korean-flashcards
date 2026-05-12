// Vocabulary data extracted from Seoul National University Korean textbooks
// Book 1A, 1B, 2A (Student Book + Workbook)
// Korean-English pairs with chapter information

// Workflow to add a new book:
// 1. Convert PDFs to text using https://www.youpdf.com/pdf-to-txt.html
// 2. Add new txt files references to scripts/convert-to-csv.js
// 3. Run `node scripts/convert-to-csv.js` to generate CSV files
// 4. Copy the new combined csv file to src/data folder
// 5. Update src/data/vocabulary.js with new combined csv file reference

import vocab1A from './1A_combined.csv?raw'
import vocab1B from './1B_combined.csv?raw'
import vocab2A from './2A_combined.csv?raw'
import vocab2B from './2B_combined.csv?raw'

function parseCSV(csv) {
  const lines = csv.trim().split(/\r?\n/)
  const pairs = []

  function parseLine(line) {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        // Escaped quote ("")
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)

    return result.map(field => field.trim())
  }

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = parseLine(line)

    if (parts.length >= 4) {
      pairs.push({
        korean: parts[0],
        english: parts[1],
        chapter: parts[2],
        chapterName: parts[3]
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


