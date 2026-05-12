import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const textsDir = path.join(__dirname, '..', 'texts')
const vocabPath = path.join(__dirname, '..', 'src', 'data', 'vocabulary.js')

// Read vocabulary.js and extract the data
const vocabContent = fs.readFileSync(vocabPath, 'utf-8')
const vocabMatch = vocabContent.match(/export const vocabulary = ({[\s\S]*});/)
if (!vocabMatch) {
  console.error('Could not parse vocabulary.js')
  process.exit(1)
}
const vocabulary = eval('(' + vocabMatch[1] + ')')

// Extract all Korean words and English definitions from text file
function extractWordsFromFile(content) {
  const koreanWords = new Set()
  const englishDefs = new Set()
  
  // Find all Korean words - they appear on lines by themselves, possibly with page numbers
  const lines = content.split('\n')
  for (const line of lines) {
    // Match lines that contain Korean characters
    if (/[가-힣]/.test(line)) {
      // Clean up: remove page numbers, extra whitespace
      let clean = line.trim()
        .replace(/\s+\d+\s*$/, '')  // Remove trailing page numbers
        .replace(/^\d+\s*/, '')      // Remove leading numbers
        .trim()
      
      // Skip headers and metadata
      if (clean.length > 0 && clean.length < 30 && 
          !/서울대|단어장|한국어 표현|Student|Workbook|뜻|쪽/.test(clean) &&
          !/[a-zA-Z]/.test(clean) &&  // No English letters
          !/[ぁ-んァ-ン]/.test(clean) && // No Japanese
          !/[а-яА-Я]/.test(clean) &&  // No Russian
          !/[一-龯]/.test(clean)) {    // No Chinese
        koreanWords.add(clean)
      }
    }
  }
  
  // Find all English definitions (after "영 ")
  const englishMatches = content.match(/영\s+([A-Za-z\s\/().,'"-]+)/g) || []
  for (const match of englishMatches) {
    const clean = match.replace(/^영\s+/, '').trim()
    if (clean.length > 0) {
      englishDefs.add(clean.toLowerCase())
    }
  }
  
  return { koreanWords, englishDefs }
}

// Process all text files
const files = {
  '1A': ['1A SB.txt', '1A WB.txt'],
  '1B': ['1B SB.txt', '1B WB.txt']
}

let totalInVocab = 0
let totalVerified = 0
let totalNotFound = 0

for (const [book, fileNames] of Object.entries(files)) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Book ${book}`)
  console.log('='.repeat(60))
  
  // Combine all text file content
  let allContent = ''
  for (const fileName of fileNames) {
    const filePath = path.join(textsDir, fileName)
    allContent += fs.readFileSync(filePath, 'utf-8') + '\n'
  }
  
  const { koreanWords, englishDefs } = extractWordsFromFile(allContent)
  const vocabPairs = vocabulary[book] || []
  
  console.log(`\nText files contain ${koreanWords.size} Korean words and ${englishDefs.size} English definitions`)
  console.log(`Vocabulary.js has ${vocabPairs.length} entries for Book ${book}`)
  
  // Check each vocabulary entry against text files
  const notFoundKorean = []
  const notFoundEnglish = []
  let verified = 0
  
  for (const pair of vocabPairs) {
    const koreanFound = koreanWords.has(pair.korean) || 
                        [...koreanWords].some(w => w.includes(pair.korean) || pair.korean.includes(w))
    const englishFound = englishDefs.has(pair.english.toLowerCase()) ||
                         [...englishDefs].some(e => e.includes(pair.english.toLowerCase()) || pair.english.toLowerCase().includes(e))
    
    if (koreanFound && englishFound) {
      verified++
    } else if (!koreanFound) {
      notFoundKorean.push(pair)
    } else if (!englishFound) {
      notFoundEnglish.push(pair)
    }
  }
  
  console.log(`\n✅ Verified: ${verified}/${vocabPairs.length} entries found in text files`)
  
  if (notFoundKorean.length > 0) {
    console.log(`\n⚠️  ${notFoundKorean.length} Korean words not found in text files:`)
    for (const pair of notFoundKorean.slice(0, 10)) {
      console.log(`  "${pair.korean}" - "${pair.english}"`)
    }
    if (notFoundKorean.length > 10) console.log(`  ... and ${notFoundKorean.length - 10} more`)
  }
  
  if (notFoundEnglish.length > 0) {
    console.log(`\n⚠️  ${notFoundEnglish.length} English definitions not found in text files:`)
    for (const pair of notFoundEnglish.slice(0, 10)) {
      console.log(`  "${pair.korean}" - "${pair.english}"`)
    }
    if (notFoundEnglish.length > 10) console.log(`  ... and ${notFoundEnglish.length - 10} more`)
  }
  
  totalInVocab += vocabPairs.length
  totalVerified += verified
  totalNotFound += notFoundKorean.length + notFoundEnglish.length
}

console.log(`\n${'='.repeat(60)}`)
console.log('SUMMARY')
console.log('='.repeat(60))
console.log(`Total entries in vocabulary.js: ${totalInVocab}`)
console.log(`Verified against text files: ${totalVerified}`)
console.log(`Not found in text files: ${totalNotFound}`)
console.log(`\nVerification rate: ${((totalVerified / totalInVocab) * 100).toFixed(1)}%`)
