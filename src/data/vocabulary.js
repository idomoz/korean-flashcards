// Vocabulary data extracted from Seoul National University Korean textbooks
// Book 1A (Student Book + Workbook) and Book 1B (Student Book + Workbook)
// Korean-English pairs only
// Auto-generated from CSV files
// Use https://www.youpdf.com/ to convert pdf to text

import vocab1A from '../../csv/1A_combined.csv?raw'
import vocab1B from '../../csv/1B_combined.csv?raw'

function parseCSV(csv) {
  const lines = csv.trim().split('\n')
  const pairs = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^"?([^",]+)"?,(.+)$/) || line.match(/^([^,]+),(.+)$/)
    if (match) {
      pairs.push({ korean: match[1], english: match[2].replace(/^"|"$/g, '') })
    }
  }
  return pairs
}

const vocab1AData = parseCSV(vocab1A)
const vocab1BData = parseCSV(vocab1B)

export const vocabulary = {
  "1A": vocab1AData,
  "1B": vocab1BData,
  "All": [...vocab1AData, ...vocab1BData],
};


