import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const textsDir = path.join(__dirname, '..', 'texts')
const outputDir = path.join(__dirname, '..', 'csv')

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Parse a text file and extract Korean-English pairs with chapters
// Pattern: " 영 " marks English definition, Korean word is at start of next non-empty line
// Chapters are marked with patterns like "1 인사 Greetings" (main chapters only, not sub-sections)
function parseTextFile(content, withChapters = false) {
  const lines = content.split('\n')
  const pairs = []
  
  let currentChapter = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check for main chapter headers like "1 인사 Greetings" or "2 교실과 방 Classroom & Room"
    // Only match single digit followed by Korean text and English title (not sub-sections like "1-1")
    const chapterMatch = line.match(/^(\d+)\s+([가-힣\s]+)\s+(.+)$/)
    if (chapterMatch && !line.includes('-')) {
      const chapterId = chapterMatch[1]
      const englishTitle = chapterMatch[3].trim()
      currentChapter = { id: chapterId, name: englishTitle }
      continue
    }
    
    // Look for lines with " 영 " anchor (English definition marker)
    const englishMatch = line.match(/\s영\s+(.+?)\s+중/)
    if (englishMatch) {
      let english = englishMatch[1].trim()
      
      // Skip if English contains non-ASCII (parsing error with other languages mixed in)
      if (/[가-힣ぁ-んァ-ンа-яА-Я]/.test(english)) {
        continue
      }
      
      // Korean word is at the beginning of the next non-empty line
      let korean = null
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j]
        if (nextLine.trim().length === 0) continue
        
        // Extract Korean from the line (may have leading whitespace)
        const koreanMatch = nextLine.match(/^\s*([가-힣\s()]+)/)
        if (koreanMatch) {
          korean = koreanMatch[1].trim()
          if (korean.length > 0 && korean.length < 25) {
            break
          }
        }
        break // Only check until first non-empty line
      }
      
      if (korean && english) {
        const entry = { korean, english }
        if (withChapters && currentChapter) {
          entry.chapter = currentChapter.id
          entry.chapterName = currentChapter.name
        }
        pairs.push(entry)
      }
    }
  }
  
  return pairs
}

// Escape CSV field (handle commas and quotes)
function escapeCSV(field) {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return '"' + field.replace(/"/g, '""') + '"'
  }
  return field
}

// Convert pairs to CSV format
function toCSV(pairs, withChapters = false) {
  const header = withChapters 
    ? 'korean,english,chapter,chapterName'
    : 'korean,english'
  const rows = pairs.map(p => {
    if (withChapters) {
      return `${escapeCSV(p.korean)},${escapeCSV(p.english)},${escapeCSV(p.chapter || '')},${escapeCSV(p.chapterName || '')}`
    }
    return `${escapeCSV(p.korean)},${escapeCSV(p.english)}`
  })
  return [header, ...rows].join('\n')
}

// Process files
const files = [
  { input: '1A SB.txt', output: '1A_SB.csv' },
  { input: '1A WB.txt', output: '1A_WB.csv' },
  { input: '1B SB.txt', output: '1B_SB.csv' },
  { input: '1B WB.txt', output: '1B_WB.csv' },
  { input: '2A SB.txt', output: '2A_SB.csv' },
  { input: '2A WB.txt', output: '2A_WB.csv' },
  { input: '2B SB.txt', output: '2B_SB.csv' },
  { input: '2B WB.txt', output: '2B_WB.csv' },

]

console.log('Converting text files to CSV...\n')

let totalPairs = 0

for (const file of files) {
  const inputPath = path.join(textsDir, file.input)
  const outputPath = path.join(outputDir, file.output)
  
  const content = fs.readFileSync(inputPath, 'utf-8')
  const pairs = parseTextFile(content)
  
  // Remove duplicates
  const seen = new Set()
  const uniquePairs = pairs.filter(p => {
    const key = p.korean
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  const csv = toCSV(uniquePairs)
  fs.writeFileSync(outputPath, csv, 'utf-8')
  
  console.log(`✅ ${file.input} → ${file.output} (${uniquePairs.length} words)`)
  totalPairs += uniquePairs.length
}

// Also create combined files for each book (with chapters)
const books = {
  '1A': ['1A SB.txt', '1A WB.txt'],
  '1B': ['1B SB.txt', '1B WB.txt'],
  '2A': ['2A SB.txt', '2A WB.txt'],
  '2B': ['2B SB.txt', '2B WB.txt'],
}

console.log('\nCreating combined files with chapters...\n')

for (const [book, inputFiles] of Object.entries(books)) {
  const allPairs = []
  
  for (const inputFile of inputFiles) {
    const inputPath = path.join(textsDir, inputFile)
    const content = fs.readFileSync(inputPath, 'utf-8')
    const pairs = parseTextFile(content, true) // with chapters
    allPairs.push(...pairs)
  }
  
  // Keep all entries (words can appear in multiple chapters)
  // Duplicates will be removed in the app when selecting "All Chapters"
  const outputPath = path.join(outputDir, `${book}_combined.csv`)
  const csv = toCSV(allPairs, true) // with chapters
  fs.writeFileSync(outputPath, csv, 'utf-8')
  
  // Extract unique chapters and count unique words
  const chapters = [...new Set(allPairs.map(p => p.chapterName).filter(Boolean))]
  const uniqueWords = new Set(allPairs.map(p => p.korean)).size
  console.log(`✅ Book ${book} combined → ${book}_combined.csv (${allPairs.length} entries, ${uniqueWords} unique words, ${chapters.length} chapters)`)
}

console.log(`\n📁 CSV files saved to: ${outputDir}`)
console.log(`📊 Total individual entries: ${totalPairs}`)
