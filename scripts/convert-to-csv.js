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

// Parse a text file and extract Korean-English pairs with chapters.
//
// The PDF-extracted text has 6 multi-language columns per entry. The English
// label "영" can wrap over multiple lines, producing several layouts:
//
//   (A) one-line:   "영 <english>   중 ...   일 ..."
//                   "<korean>                                <page>"
//
//   (B) lone 영, English above + after Korean:
//                   "                       <english part 1>"
//                   "                  영"
//                   "<korean>          <english part 2>      <page>"
//
//   (C) lone 영, English above + below 영:
//                   "                       <english part 1>"
//                   "                  영"
//                   "                       <english part 2>"
//                   "<korean>                                <page>"
//
//   (D) inline 영 with wrap:
//                   "                       <english part 1>"
//                   "                  영 <english part 2>   중 ..."
//                   "<korean>          <english part 3>      <page>"
//
//   (E) Korean head wraps across lines (with page-number row in between):
//                   "                       <english part 1>"
//                   "                  영"
//                   "<korean part 1>          <english part 2>"
//                   "                                          <page>"
//                   "<korean part 2>"
//                   "                  몽 ...                  베 ..."
//
//   (F) inline 영 with Korean head split before/after the 영 marker line:
//                   "<korean part 1>           영 <english>            일"
//                   "                                                          <page>"
//                   "<korean part 2>"
//                   "                  몽 ...                  베 ..."
//
// Strategy: anchor on each 영 marker. Gather all Korean head fragments from a
// small window around it, plus all English fragments. Concatenate each in
// document order. Markers sit in mid-to-right columns, so a line that starts
// with hangul can still be a Korean head even when a marker appears later on
// the same line.
function parseTextFile(content, withChapters = false) {
  const lines = content.split('\n')
  const pairs = []

  let currentChapter = null

  // Boundary-aware "영" marker with no following content (line ends with 영).
  const reYeongAlone = /(?:^|\s)영\s*$/
  // Inline "영" with English content; English ends at the next foreign marker
  // (any of 중/일/몽/베/러, since the 일 column sometimes sits to the right of
  // 영 on the same line) or at EOL.
  const reYeongInline = /(?:^|\s)영\s+(.+?)(?:\s+(?:중|일|몽|베|러)|\s*$)/
  // Any 영-as-token presence, used when filtering lookaround lines.
  const reYeongAny = /(?:^|\s)영(?:\s|$)/
  // Mid-line marker (used when collecting English continuation lines): rejects
  // any line whose marker sits in the middle, so we do not accidentally take a
  // "몽 ..." or "중 ..." line as English.
  const reOtherMarkerMid = /\s(?:중|일|몽|베|러)\s/
  // Korean head token at line start: hangul, digits, parens, slash, and ASCII
  // letters (for embedded abbreviations like "에스엔에스(SNS)를 하다" or
  // "케이티엑스(KTX)"). Words are separated by a single literal space — this
  // prevents greedy capture across the wide gap before page numbers and
  // transliteration columns.
  const reKoreanHead = /^([0-9A-Za-z가-힣()/]+(?: [0-9A-Za-z가-힣()/]+)*)/
  // Any non-English script that disqualifies a line from being an English
  // continuation: Cyrillic, hangul, kana, CJK ideographs, or Latin Extended
  // (Vietnamese, accented letters from other Romanizations).
  const reForeignScript = /[가-힣\u3040-\u30ff\u4e00-\u9fff\u0400-\u04ff\u00c0-\u024f\u1e00-\u1eff]/

  // Decide whether a line is a foreign-language marker line (e.g. "중 中" or
  // "         몽 Хэмжээ ..."), as opposed to a legitimate Korean head whose
  // word happens to be 중 / 일 (the words "in the middle of" / "day" / "work").
  // A marker line has the marker char followed by whitespace and then a
  // non-digit, non-space character (the marker's own translation column).
  const isMarkerLine = (line) => {
    const trimmed = line.replace(/^\s+/, '')
    // Single-letter marker at start of trimmed text, followed by whitespace
    // and then a script-letter character (Latin/CJK/Cyrillic/etc.). A bare
    // Korean word like "중" or "일" followed only by spaces and a page number
    // does not match this pattern.
    return /^[중일몽베러]\s+[^\s\d]/.test(trimmed)
  }

  // Detect a Korean head fragment on a line. Returns the matched head string,
  // or null. Allows lines that contain mid-line markers, since wrapped Korean
  // heads sometimes share their line with a 몽 column.
  const koreanHeadOf = (line) => {
    if (!line) return null
    if (reYeongAny.test(line) || reYeongAlone.test(line)) return null
    if (isMarkerLine(line)) return null
    const trimmed = line.replace(/^\s+/, '')
    // Korean head can start with hangul, digit, or "(" (e.g. "(만나서) 반가워요").
    if (!trimmed || !/^[0-9가-힣(]/.test(trimmed)) return null
    const m = trimmed.match(reKoreanHead)
    if (!m) return null
    const head = m[1].trim()
    if (head.length === 0 || head.length >= 25) return null
    // Must contain at least one hangul char — guards against capturing English
    // parenthetical continuations or pure-Latin segments like "(SNS) abbr".
    if (!/[가-힣]/.test(head)) return null
    return head
  }

  // Strip a trailing page-number column from a line fragment.
  const stripTrailingPage = (s) => s.replace(/\s+\d{1,4}\s*$/, '').trim()

  // Truncate a string at the first foreign-language marker. Used to clean the
  // tail of a Korean-head line that may also contain a 몽 column inline.
  const truncateAtMarker = (s) => {
    const idx = s.search(reOtherMarkerMid)
    return idx >= 0 ? s.slice(0, idx) : s
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Chapter header: "10 학교생활 School Life" (skip sub-sections like "10-1").
    const chapterMatch = line.match(/^(\d+)\s+([가-힣\s]+)\s+(.+)$/)
    if (chapterMatch && !line.includes('-')) {
      currentChapter = { id: chapterMatch[1], name: chapterMatch[3].trim() }
      continue
    }

    // Find the 영 marker on this line.
    const inlineMatch = line.match(reYeongInline)
    const isAlone = !inlineMatch && reYeongAlone.test(line)
    if (!inlineMatch && !isAlone) continue

    const koreanFrags = [] // {idx, text} — ordered by document position
    const englishFrags = []

    // Layout (F): the 영 line itself can have a Korean prefix BEFORE the 영
    // marker. Two sub-cases:
    //   inline: "디자인이 화려하다 /           영 design is flashy / simple ..."
    //   alone:  "교통이 편리하다 /      영"   (followed by English continuation
    //          and the rest of the Korean head on later lines)
    const yeongPos = line.search(/(?:^|\s)영(?:\s|$)/)
    if (yeongPos > 0) {
      const beforeYeong = line.slice(0, yeongPos).replace(/^\s+/, '').replace(/\s+$/, '')
      if (beforeYeong) {
        const km = beforeYeong.match(reKoreanHead)
        if (km && /[가-힣]/.test(km[1]) && km[1].length < 25) {
          koreanFrags.push({ idx: i - 0.5, text: km[1].trim() })
        }
      }
    }
    if (inlineMatch) {
      const text = inlineMatch[1].trim()
      if (text) englishFrags.push({ idx: i, text })
    }

    // Forward scan (below 영): collect Korean head fragments + English tail
    // and English continuation lines. Stop at the first marker-only line —
    // anything below 몽/베/러 belongs to those translation columns and may
    // include hangul or Latin text wrapped from those columns (e.g. "개념)"
    // appearing in the Russian translator's note for 판).
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
      const ln = lines[j]
      if (!ln || !ln.trim()) continue
      if (reYeongAny.test(ln) || reYeongAlone.test(ln)) break
      if (isMarkerLine(ln)) break

      const head = koreanHeadOf(ln)
      if (head) {
        koreanFrags.push({ idx: j, text: head })
        // English continuation may sit after the Korean head on the same
        // line (e.g. "데려다주다        place               38"). Truncate
        // at any later marker on the line so the 몽 column doesn't bleed in
        // for cases like "안 어울리다       몽 Зохих ...".
        const after = ln.replace(/^\s+/, '').slice(head.length)
        const tail = stripTrailingPage(truncateAtMarker(after))
        if (tail && /[a-zA-Z]/.test(tail) && !reForeignScript.test(tail)) {
          englishFrags.push({ idx: j, text: tail })
        }
        continue
      }

      // Pure English continuation: skip lines that contain mid-line markers,
      // then accept lines with Latin letters and no other scripts.
      if (reOtherMarkerMid.test(ln)) continue
      const tidy = stripTrailingPage(ln.trim())
      if (tidy && /[a-zA-Z]/.test(tidy) && !reForeignScript.test(tidy)) {
        englishFrags.push({ idx: j, text: tidy })
      }
    }

    // Backward scan (above 영): English continuations only — the Korean head
    // never appears above the 영 marker (the table header "한국어 표현" line
    // sits above each subsection, but that is excluded by the marker break).
    // Break on blank lines too: English-above continuations sit immediately
    // above 영 with no gaps, so a blank line means we've crossed into the
    // previous entry (where wrapped 베/러 column tails like "da" can sit).
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      const ln = lines[j]
      if (!ln || !ln.trim()) break
      if (reYeongAny.test(ln) || reYeongAlone.test(ln)) break
      if (isMarkerLine(ln)) break
      if (reOtherMarkerMid.test(ln)) continue

      const tidy = stripTrailingPage(ln.trim())
      if (tidy && /[a-zA-Z]/.test(tidy) && !reForeignScript.test(tidy)) {
        englishFrags.push({ idx: j, text: tidy })
      }
    }

    if (koreanFrags.length === 0 || englishFrags.length === 0) continue

    koreanFrags.sort((a, b) => a.idx - b.idx)
    englishFrags.sort((a, b) => a.idx - b.idx)

    const korean = koreanFrags.map(f => f.text).join(' ').replace(/\s+/g, ' ').trim()
    const english = englishFrags.map(f => f.text).join(' ').replace(/\s+/g, ' ').trim()
    if (!korean || !english) continue
    // Note: we deliberately do NOT filter out non-Latin script in the final
    // English value. A handful of entries in the source PDFs have a malformed
    // English column where the Chinese translation was duplicated (e.g.
    // "영 问候" for 인사하다). The user prefers to keep those rather than drop
    // the entry. The continuation-line filter above is what protects against
    // accidentally merging Vietnamese/Russian column text into English.

    const entry = { korean, english }
    if (withChapters && currentChapter) {
      entry.chapter = currentChapter.id
      entry.chapterName = currentChapter.name
    }
    pairs.push(entry)
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
  { input: '2B_SB.txt', output: '2B_SB.csv' },
  { input: '2B_WB.txt', output: '2B_WB.csv' },
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
  '2B': ['2B_SB.txt', '2B_WB.txt'],
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
