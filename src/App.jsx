import { useState, useEffect, useCallback } from 'react'
import { useSwipeable } from 'react-swipeable'
import { vocabulary, chapters } from './data/vocabulary'

function shuffleArray(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

function SettingsScreen({ book, setBook, chapter, setChapter, lang, setLang, shuffleMode, setShuffleMode, onStart, count, availableChapters }) {
  return (
    <div className="h-full bg-gray-900 flex flex-col items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-auto">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-6 w-full max-w-md my-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-white">Korean Flashcards</h1>
          <p className="text-gray-400 mt-1 text-sm">Seoul National University Textbooks</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Select Book</label>
            <div className="grid grid-cols-3 gap-3">
              {['1A', '1B', 'All'].map((b) => (
                <button
                  key={b}
                  onClick={() => { setBook(b); setChapter('all'); }}
                  className={`py-3 px-3 rounded-xl font-bold text-base transition-all duration-200 ${
                    book === b
                      ? 'bg-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {b === 'All' ? '📚 All' : `Book ${b}`}
                </button>
              ))}
            </div>
          </div>

          {book !== 'All' && availableChapters.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Select Chapter</label>
              <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto">
                <button
                  onClick={() => setChapter('all')}
                  className={`py-2 px-3 rounded-lg text-sm transition-all duration-200 ${
                    chapter === 'all'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All Chapters
                </button>
                {availableChapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setChapter(ch.id)}
                    className={`py-2 px-3 rounded-lg text-sm transition-all duration-200 text-left truncate ${
                      chapter === ch.id
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500">{count} cards available</p>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Show First</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLang('korean')}
                className={`py-2 px-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  lang === 'korean'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => setLang('english')}
                className={`py-2 px-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  lang === 'english'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('random')}
                className={`py-2 px-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  lang === 'random'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Random
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Card Order</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShuffleMode(true)}
                className={`py-2 px-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  shuffleMode
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Shuffle
              </button>
              <button
                onClick={() => setShuffleMode(false)}
                className={`py-2 px-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  !shuffleMode
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                In Order
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-500 transition-all shadow-lg text-lg"
        >
          Start Learning 🚀
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Tap card to flip • Swipe to navigate</p>
        </div>
      </div>
    </div>
  )
}

function FlashcardView({ card, lang, flipped, onFlip, cardLang, onMarkKnown, isKnown }) {
  const showKoreanFirst = cardLang === 'korean'
  const frontText = showKoreanFirst ? card.korean : card.english
  const backText = showKoreanFirst ? card.english : card.korean
  const frontIsKorean = showKoreanFirst

  const handleMarkKnown = (e) => {
    e.stopPropagation()
    onMarkKnown(card.korean)
  }

  return (
    <div className="relative w-full max-w-sm aspect-[3/4]">
      <div className="absolute inset-0 bg-gray-800 rounded-3xl border border-gray-700"></div>
      <div className="card-flip absolute inset-0 cursor-pointer select-none" onClick={onFlip}>
        <div className={`card-flip-inner relative w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="card-front absolute inset-0 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 flex flex-col items-center justify-center p-8">
            <button
              onClick={handleMarkKnown}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                isKnown ? 'text-green-400 bg-green-400/20' : 'text-gray-500 active:text-green-400 active:bg-green-400/10'
              }`}
              title={isKnown ? 'Mark as unknown' : 'Mark as known'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isKnown ? 3 : 2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <div className={`text-center ${frontIsKorean ? 'text-4xl' : 'text-3xl'} font-[400] text-white`}>
              {frontText}
            </div>
            <div className="absolute bottom-6 text-gray-500 text-sm">Tap to reveal</div>
          </div>
          <div className="card-back absolute inset-0 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 flex flex-col items-center justify-center p-8">
            <button
              onClick={handleMarkKnown}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                isKnown ? 'text-green-400 bg-green-400/20' : 'text-gray-500 active:text-green-400 active:bg-green-400/10'
              }`}
              title={isKnown ? 'Mark as unknown' : 'Mark as known'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isKnown ? 3 : 2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <div className={`text-center ${!frontIsKorean ? 'text-4xl' : 'text-3xl'} font-[400] text-gray-100`}>
              {backText}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [book, setBook] = useState(() => localStorage.getItem('flashcard-book') || '1A')
  const [chapter, setChapter] = useState(() => localStorage.getItem('flashcard-chapter') || 'all')
  const [lang, setLang] = useState(() => localStorage.getItem('flashcard-lang') || 'korean')
  const [showSettings, setShowSettings] = useState(true)
  const [showKnownSettings, setShowKnownSettings] = useState(false)
  const [showKnownWordsList, setShowKnownWordsList] = useState(false)
  const [knownWordsSearch, setKnownWordsSearch] = useState('')
  const [showWordList, setShowWordList] = useState(false)
  const [wordListSearch, setWordListSearch] = useState('')
  const [cards, setCards] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [slideOut, setSlideOut] = useState(false)
  const [direction, setDirection] = useState('next')
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [cardLang, setCardLang] = useState('korean')
  const [knownWords, setKnownWords] = useState(() => {
    const stored = localStorage.getItem('flashcard-known-words')
    return stored ? new Set(JSON.parse(stored)) : new Set()
  })
  const [includeKnown, setIncludeKnown] = useState(() => {
    return localStorage.getItem('flashcard-include-known') === 'true'
  })
  const [shuffleMode, setShuffleMode] = useState(() => {
    return localStorage.getItem('flashcard-shuffle-mode') !== 'false'
  })
  const [showKnownTutorial, setShowKnownTutorial] = useState(false)
  const [hasSeenKnownTutorial, setHasSeenKnownTutorial] = useState(() => {
    return localStorage.getItem('flashcard-seen-known-tutorial') === 'true'
  })

  const availableChapters = book !== 'All' ? (chapters[book] || []) : []
  
  // Filter vocabulary by chapter, remove duplicates, and optionally exclude known words
  const getFilteredVocabulary = useCallback(() => {
    let data = vocabulary[book] || []
    
    // Filter by chapter first if specific chapter selected
    if (chapter !== 'all' && book !== 'All') {
      data = data.filter(item => item.chapter === chapter)
    }
    
    // Always remove duplicates
    const seen = new Set()
    data = data.filter(item => {
      if (seen.has(item.korean)) return false
      seen.add(item.korean)
      return true
    })
    
    // Filter out known words unless includeKnown is true
    if (!includeKnown) {
      data = data.filter(item => !knownWords.has(item.korean))
    }
    
    return data
  }, [book, chapter, includeKnown, knownWords])

  const cardCount = getFilteredVocabulary().length

  const getRandomLang = () => Math.random() < 0.5 ? 'korean' : 'english'

  useEffect(() => {
    localStorage.setItem('flashcard-book', book)
  }, [book])

  useEffect(() => {
    localStorage.setItem('flashcard-chapter', chapter)
  }, [chapter])

  useEffect(() => {
    localStorage.setItem('flashcard-lang', lang)
  }, [lang])

  useEffect(() => {
    localStorage.setItem('flashcard-known-words', JSON.stringify([...knownWords]))
  }, [knownWords])

  useEffect(() => {
    localStorage.setItem('flashcard-include-known', includeKnown.toString())
  }, [includeKnown])

  useEffect(() => {
    localStorage.setItem('flashcard-shuffle-mode', shuffleMode.toString())
  }, [shuffleMode])

  useEffect(() => {
    const data = getFilteredVocabulary()
    setCards(shuffleMode ? shuffleArray(data) : data)
    setIdx(0)
    setFlipped(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter, shuffleMode, includeKnown])

  const prevCard = () => {
    if (slideOut) return
    setDirection('prev')
    setFlipped(false)
    setSlideOut(true)
  }

  const nextCard = () => {
    if (slideOut) return
    setDirection('next')
    setFlipped(false)
    setSlideOut(true)
  }

  const handleSlideEnd = () => {
    if (slideOut) {
      setIdx((prev) => direction === 'next' 
        ? (prev + 1) % cards.length 
        : (prev - 1 + cards.length) % cards.length)
      setSlideOut(false)
      setDragX(0)
      if (lang === 'random') {
        setCardLang(getRandomLang())
      }
    }
  }

  const flipCard = useCallback(() => setFlipped((f) => !f), [])

  const startLearning = useCallback(() => {
    const data = getFilteredVocabulary()
    setCards(shuffleMode ? shuffleArray(data) : data)
    setIdx(0)
    setFlipped(false)
    setShowSettings(false)
    setCardLang(lang === 'random' ? getRandomLang() : lang)
  }, [lang, getFilteredVocabulary, shuffleMode])

  const goBack = useCallback(() => setShowSettings(true), [])

  const reshuffleCards = useCallback(() => {
    const data = getFilteredVocabulary()
    setCards(shuffleMode ? shuffleArray(data) : data)
    setIdx(0)
    setFlipped(false)
  }, [getFilteredVocabulary, shuffleMode])

  const markWordKnown = useCallback((word) => {
    const isCurrentlyKnown = knownWords.has(word)
    
    if (includeKnown && isCurrentlyKnown) {
      // Toggle off - remove from known words
      setKnownWords(prev => {
        const newSet = new Set(prev)
        newSet.delete(word)
        return newSet
      })
    } else {
      // Add to known words
      setKnownWords(prev => {
        const newSet = new Set(prev)
        newSet.add(word)
        return newSet
      })
      
      // Show tutorial on first time marking as known
      if (!hasSeenKnownTutorial) {
        setShowKnownTutorial(true)
      }
      
      // Remove from current cards list and move to next (only when not including known)
      if (!includeKnown) {
        setCards(prev => {
          const newCards = prev.filter(c => c.korean !== word)
          if (newCards.length === 0) return newCards
          // Adjust index if needed
          if (idx >= newCards.length) {
            setIdx(0)
          }
          return newCards
        })
        setFlipped(false)
      }
    }
  }, [idx, includeKnown, knownWords, hasSeenKnownTutorial])

  const resetKnownWords = useCallback(() => {
    setKnownWords(new Set())
    setHasSeenKnownTutorial(false)
    localStorage.removeItem('flashcard-seen-known-tutorial')
  }, [])

  const dismissKnownTutorial = useCallback(() => {
    setShowKnownTutorial(false)
    setHasSeenKnownTutorial(true)
    localStorage.setItem('flashcard-seen-known-tutorial', 'true')
  }, [])

  const swipeConfig = useSwipeable({
    onSwiping: (e) => {
      if (slideOut) return
      setIsDragging(true)
      setDragX(e.deltaX)
    },
    onSwiped: (e) => {
      if (slideOut) return
      const threshold = 80
      if (e.deltaX < -threshold) {
        setDragX(e.deltaX)
        setDirection('next')
        setFlipped(false)
        requestAnimationFrame(() => {
          setIsDragging(false)
          setSlideOut(true)
        })
      } else if (e.deltaX > threshold) {
        setDragX(e.deltaX)
        setDirection('prev')
        setFlipped(false)
        requestAnimationFrame(() => {
          setIsDragging(false)
          setSlideOut(true)
        })
      } else {
        setIsDragging(false)
        setDragX(0)
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  useEffect(() => {
    const onKey = (e) => {
      if (showSettings) return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextCard()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevCard()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        flipCard()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showSettings, nextCard, prevCard, flipCard])

  if (showSettings) {
    return (
      <SettingsScreen
        book={book}
        setBook={setBook}
        chapter={chapter}
        setChapter={setChapter}
        lang={lang}
        setLang={setLang}
        shuffleMode={shuffleMode}
        setShuffleMode={setShuffleMode}
        onStart={startLearning}
        count={cardCount}
        availableChapters={availableChapters}
      />
    )
  }

  if (cards.length === 0) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">No cards available</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <header className="bg-gray-800 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={goBack} className="text-white active:bg-white/20 p-2 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <button onClick={() => setShowWordList(true)} className="text-white active:bg-white/20 p-2 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <h1 className="text-white font-semibold text-sm text-center">
          {book === 'All' ? 'All Books' : chapter !== 'all' 
            ? availableChapters.find(c => c.id === chapter)?.name || `Book ${book}`
            : `Book ${book}`}
        </h1>
        <div className="relative flex items-center gap-1">
          <button onClick={reshuffleCards} className="text-white active:bg-white/20 p-2 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="relative">
            <button onClick={() => setShowKnownSettings(true)} className="text-white active:bg-white/20 p-2 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Tutorial Snackbar */}
            {showKnownTutorial && (
              <div className="fixed top-16 right-2 w-64 bg-indigo-600 rounded-xl shadow-lg p-4 z-50">
                {/* Arrow pointing to settings icon */}
                <div className="absolute -top-2 right-5 w-4 h-4 bg-indigo-600 transform rotate-45"></div>
              <p className="text-white text-sm mb-3">
                Word marked as known! You can control known words from the settings menu.
              </p>
              <button
                onClick={dismissKnownTutorial}
                className="w-full py-2 px-3 bg-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/30 transition-colors"
              >
                Got it
              </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Known Words Settings Modal */}
      {showKnownSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowKnownSettings(false)}>
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <span className="text-gray-300 block mb-2">Show first</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLang('korean')}
                    className={`px-3 py-1 rounded-lg text-sm ${lang === 'korean' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    Korean
                  </button>
                  <button
                    onClick={() => setLang('english')}
                    className={`px-3 py-1 rounded-lg text-sm ${lang === 'english' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLang('random')}
                    className={`px-3 py-1 rounded-lg text-sm ${lang === 'random' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    Random
                  </button>
                </div>
              </div>
              
              <div>
                <span className="text-gray-300 block mb-2">Card order</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShuffleMode(true)}
                    className={`px-3 py-1 rounded-lg text-sm ${shuffleMode ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    Shuffle
                  </button>
                  <button
                    onClick={() => setShuffleMode(false)}
                    className={`px-3 py-1 rounded-lg text-sm ${!shuffleMode ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    In Order
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Include known words</span>
                <button
                  onClick={() => setIncludeKnown(!includeKnown)}
                  className={`w-12 h-6 rounded-full transition-colors ${includeKnown ? 'bg-indigo-600' : 'bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${includeKnown ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {knownWords.size} words marked as known
                </span>
                {knownWords.size > 0 && (
                  <button
                    onClick={() => setShowKnownWordsList(true)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              <button
                onClick={() => {
                  if (confirm('Reset all known words?')) {
                    resetKnownWords()
                  }
                }}
                className="w-full py-2 px-4 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
              >
                Reset Known Words
              </button>
            </div>
            
            <button
              onClick={() => setShowKnownSettings(false)}
              className="w-full mt-4 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Known Words List Modal */}
      {showKnownWordsList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowKnownWordsList(false); setKnownWordsSearch(''); }}>
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Known Words</h2>
            
            <input
              type="text"
              placeholder="Search..."
              value={knownWordsSearch}
              onChange={e => setKnownWordsSearch(e.target.value)}
              className="w-full mb-3 px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {[...knownWords].sort().filter(word => {
                if (!knownWordsSearch) return true
                const search = knownWordsSearch.toLowerCase()
                const entry = vocabulary[book]?.find(v => v.korean === word) || 
                              vocabulary['1A']?.find(v => v.korean === word) || 
                              vocabulary['1B']?.find(v => v.korean === word)
                return word.includes(search) || entry?.english?.toLowerCase().includes(search)
              }).map(word => {
                const entry = vocabulary[book]?.find(v => v.korean === word) || 
                              vocabulary['1A']?.find(v => v.korean === word) || 
                              vocabulary['1B']?.find(v => v.korean === word)
                return (
                  <div key={word} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-white block">{word}</span>
                      {entry && (
                        <span className="text-gray-400 text-sm block truncate">{entry.english}</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setKnownWords(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(word)
                          return newSet
                        })
                      }}
                      className="text-red-400 p-1 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
              {knownWords.size === 0 && (
                <p className="text-gray-400 text-center py-4">No known words</p>
              )}
            </div>
            
            <button
              onClick={() => { setShowKnownWordsList(false); setKnownWordsSearch(''); }}
              className="w-full mt-4 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Word List Modal */}
      {showWordList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowWordList(false); setWordListSearch(''); }}>
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Word List ({cards.length})</h2>
            
            <input
              type="text"
              placeholder="Search..."
              value={wordListSearch}
              onChange={e => setWordListSearch(e.target.value)}
              className="w-full mb-3 px-3 py-2 bg-gray-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {cards.filter(card => {
                if (!wordListSearch) return true
                const search = wordListSearch.toLowerCase()
                return card.korean.includes(search) || card.english.toLowerCase().includes(search)
              }).map((card, i) => (
                <div 
                  key={`${card.korean}-${i}`} 
                  className={`flex items-center justify-between rounded-lg px-3 py-2 gap-2 ${
                    knownWords.has(card.korean) ? 'bg-green-900/30 border border-green-700/50' : 'bg-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-white block">{card.korean}</span>
                    <span className="text-gray-400 text-sm block truncate">{card.english}</span>
                  </div>
                  {knownWords.has(card.korean) && (
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
              {cards.length === 0 && (
                <p className="text-gray-400 text-center py-4">No words in set</p>
              )}
            </div>
            
            <button
              onClick={() => { setShowWordList(false); setWordListSearch(''); }}
              className="w-full mt-4 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <main {...swipeConfig} className="flex-1 flex items-center justify-center p-4 touch-pan-y overflow-hidden">
        <div className="relative w-full max-w-sm aspect-[3/4]">
          {/* Deck underneath card */}
          <div className="absolute inset-0 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700"></div>
          
          {/* Card */}
          <div 
            key={idx}
            className={`absolute inset-0 ${
              slideOut || (!isDragging && dragX === 0)
                ? 'transition-transform duration-200 ease-out'
                : ''
            }`}
            style={{ 
              transform: slideOut 
                ? direction === 'next' 
                  ? 'translateX(-110%)' 
                  : 'translateX(110%)'
                : `translateX(${dragX}px)`
            }}
            onTransitionEnd={handleSlideEnd}
          >
            <FlashcardView 
              card={cards[idx]} 
              lang={lang} 
              flipped={flipped} 
              onFlip={flipCard} 
              cardLang={cardLang}
              onMarkKnown={markWordKnown}
              isKnown={includeKnown && knownWords.has(cards[idx].korean)}
            />
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <button onClick={prevCard} className="text-white active:bg-white/20 p-3 rounded-full outline-none select-none transition-all duration-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-white text-center">
            <span className="text-2xl font-bold">{idx + 1}</span>
            <span className="text-white/70 mx-2">/</span>
            <span className="text-white/70">{cards.length}</span>
          </div>
          <button onClick={nextCard} className="text-white active:bg-white/20 p-3 rounded-full outline-none select-none transition-all duration-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  )
}

export default App