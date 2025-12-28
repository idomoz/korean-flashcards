import { useState, useEffect, useCallback } from 'react'
import { useSwipeable } from 'react-swipeable'
import { vocabulary } from './data/vocabulary'

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

function SettingsScreen({ book, setBook, lang, setLang, onStart, count }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🇰🇷</div>
          <h1 className="text-3xl font-bold text-white">Korean Flashcards</h1>
          <p className="text-gray-400 mt-2">Seoul National University Textbooks</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Select Book</label>
            <div className="grid grid-cols-3 gap-3">
              {['1A', '1B', 'All'].map((b) => (
                <button
                  key={b}
                  onClick={() => setBook(b)}
                  className={`py-4 px-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                    book === b
                      ? 'bg-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {b === 'All' ? '📚 All' : `Book ${b}`}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">{count} cards available</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Show First</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setLang('korean')}
                className={`py-4 px-4 rounded-xl font-bold transition-all duration-200 ${
                  lang === 'korean'
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="text-xl block mb-1">한국어</span>
                <span className="text-xs opacity-80">Korean</span>
              </button>
              <button
                onClick={() => setLang('english')}
                className={`py-4 px-4 rounded-xl font-bold transition-all duration-200 ${
                  lang === 'english'
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="text-xl block mb-1">ABC</span>
                <span className="text-xs opacity-80">English</span>
              </button>
              <button
                onClick={() => setLang('random')}
                className={`py-4 px-4 rounded-xl font-bold transition-all duration-200 ${
                  lang === 'random'
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="text-xl block mb-1">🎲</span>
                <span className="text-xs opacity-80">Random</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full mt-8 bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-indigo-500 transition-all shadow-lg text-lg"
        >
          Start Learning 🚀
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Tap card to flip • Swipe to navigate</p>
        </div>
      </div>
    </div>
  )
}

function FlashcardView({ card, lang, flipped, onFlip, cardLang }) {
  const showKoreanFirst = cardLang === 'korean'
  const frontText = showKoreanFirst ? card.korean : card.english
  const backText = showKoreanFirst ? card.english : card.korean
  const frontIsKorean = showKoreanFirst

  return (
    <div className="relative w-full max-w-sm aspect-[3/4]">
      <div className="absolute inset-0 bg-gray-800 rounded-3xl border border-gray-700"></div>
      <div className="card-flip absolute inset-0 cursor-pointer select-none" onClick={onFlip}>
        <div className={`card-flip-inner relative w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="card-front absolute inset-0 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 flex flex-col items-center justify-center p-8">
            <div className={`text-center ${frontIsKorean ? 'text-4xl' : 'text-3xl'} font-[400] text-white`}>
              {frontText}
            </div>
            <div className="absolute bottom-6 text-gray-500 text-sm">Tap to reveal</div>
          </div>
          <div className="card-back absolute inset-0 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 flex flex-col items-center justify-center p-8">
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
  const [lang, setLang] = useState(() => localStorage.getItem('flashcard-lang') || 'korean')
  const [showSettings, setShowSettings] = useState(true)
  const [cards, setCards] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [slideOut, setSlideOut] = useState(false)
  const [direction, setDirection] = useState('next')
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [cardLang, setCardLang] = useState('korean')

  const cardCount = vocabulary[book]?.length || 0

  const getRandomLang = () => Math.random() < 0.5 ? 'korean' : 'english'

  useEffect(() => {
    localStorage.setItem('flashcard-book', book)
  }, [book])

  useEffect(() => {
    localStorage.setItem('flashcard-lang', lang)
  }, [lang])

  useEffect(() => {
    const data = vocabulary[book] || []
    setCards(shuffleArray(data))
    setIdx(0)
    setFlipped(false)
  }, [book])

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
    setCards(shuffleArray(vocabulary[book] || []))
    setIdx(0)
    setFlipped(false)
    setShowSettings(false)
    setCardLang(lang === 'random' ? getRandomLang() : lang)
  }, [book, lang])

  const goBack = useCallback(() => setShowSettings(true), [])

  const reshuffleCards = useCallback(() => {
    setCards(shuffleArray(vocabulary[book] || []))
    setIdx(0)
    setFlipped(false)
  }, [book])

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
        lang={lang}
        setLang={setLang}
        onStart={startLearning}
        count={cardCount}
      />
    )
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">No cards available</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={goBack} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-white font-semibold">{book === 'All' ? 'All Books' : `Book ${book}`}</h1>
        <button onClick={reshuffleCards} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

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
            <FlashcardView card={cards[idx]} lang={lang} flipped={flipped} onFlip={flipCard} cardLang={cardLang} />
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 px-4 py-4">
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