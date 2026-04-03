import React, { useState, useEffect, useCallback, useMemo } from 'react';
import flashcardService from '../services/flashcardService';
import courseService from '../services/courseService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  Layers,
  Loader2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  BookOpen,
  Zap,
  Brain,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Check,
  X,
  Shuffle,
  ArrowRight,
  GraduationCap,
  Star,
  Trophy,
  Target,
  Book,
} from 'lucide-react';

// ────────────────────────────────────────────
// Difficulty Config
// ────────────────────────────────────────────
const getDifficultyConfig = (diff) => {
  switch (diff?.toLowerCase()) {
    case 'easy':
      return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Star };
    case 'medium':
      return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Target };
    case 'hard':
      return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: Zap };
    default:
      return { color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: Brain };
  }
};

// ─────────────────────────────────────────────
// Flashcards Page
// ─────────────────────────────────────────────
const Flashcards = () => {
  // ── Data State ──
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filter State ──
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedLesson, setSelectedLesson] = useState('all');
  const [courses, setCourses] = useState([]);
  const [courseLessonMap, setCourseLessonMap] = useState({});
  const [isDataLoading, setIsDataLoading] = useState(false);

  // ── Study Mode State ──
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyDeck, setStudyDeck] = useState([]);

  // ── Edit State ──
  const [editingCard, setEditingCard] = useState(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');

  // ── Action State ──
  const [actionLoading, setActionLoading] = useState(null); // { id, type: 'edit' | 'delete' }
  const [flippedCards, setFlippedCards] = useState(new Set());

  // ────────────────────────────────────────────
  // Utility Functions
  // ────────────────────────────────────────────
  const flipCard = useCallback(() => setIsFlipped((prev) => !prev), []);

  const goNext = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < (studyDeck?.length || 0) - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, studyDeck?.length]);

  const goPrev = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const exitStudyMode = useCallback(() => {
    setStudyMode(false);
    setIsFlipped(false);
    setCurrentIndex(0);
  }, []);

  const shuffleDeck = useCallback(() => {
    if (!studyDeck?.length) return;
    const shuffled = [...studyDeck].sort(() => Math.random() - 0.5);
    setStudyDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [studyDeck]);

  // ────────────────────────────────────────────
  // CRUD & Data fetching
  // ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (selectedLesson !== 'all') params.lesson_id = parseInt(selectedLesson);

      const flashcardsRes = await flashcardService.getFlashcards(params);
      setFlashcards(Array.isArray(flashcardsRes) ? flashcardsRes : []);
    } catch (error) {
      console.error('Error fetching flashcard data:', error);
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, selectedLesson]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Courses and Mapping
  useEffect(() => {
    const fetchCoursesAndMapping = async () => {
      setIsDataLoading(true);
      try {
        const fetchedCourses = await courseService.getCourses();
        setCourses(Array.isArray(fetchedCourses) ? fetchedCourses : []);

        const mapping = {};
        await Promise.all(fetchedCourses.map(async (course) => {
          try {
            const lessons = await courseService.getCourseLessons(course.id);
            mapping[course.id] = (Array.isArray(lessons) ? lessons : []).map(l => l.id);
          } catch (err) {
            console.error(`Failed to fetch lessons for course ${course.id}:`, err);
            mapping[course.id] = [];
          }
        }));
        setCourseLessonMap(mapping);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchCoursesAndMapping();
  }, []);

  // Derived Data
  const filteredCards = useMemo(() => {
    if (!Array.isArray(flashcards)) return [];

    let result = flashcards;

    // Filter by Course (if selected)
    if (selectedCourse !== 'all') {
      const allowedLessons = courseLessonMap[selectedCourse] || [];
      result = result.filter(card => allowedLessons.includes(card.lesson_id));
    }

    // Filter by Lesson (if selected and not 'all')
    if (selectedLesson !== 'all') {
      result = result.filter(card => card.lesson_id === parseInt(selectedLesson));
    }

    // Filter by Difficulty (if selected and not 'all')
    if (selectedDifficulty !== 'all') {
      result = result.filter(card => card.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    return result;
  }, [flashcards, selectedCourse, selectedLesson, selectedDifficulty, courseLessonMap]);

  const difficultyOptions = useMemo(() => {
    if (!Array.isArray(flashcards) || flashcards.length === 0) return ['all'];
    const diffs = flashcards.map(c => c.difficulty).filter(Boolean);
    return ['all', ...new Set(diffs)];
  }, [flashcards]);

  const lessonIds = useMemo(() => {
    if (!Array.isArray(flashcards) || flashcards.length === 0) return [];
    return [...new Set(flashcards.map(c => c.lesson_id).filter(id => id != null))];
  }, [flashcards]);

  const startStudyMode = useCallback(() => {
    if (filteredCards.length === 0) return;
    setStudyDeck([...filteredCards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyMode(true);
  }, [filteredCards]);

  const handleDelete = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this flashcard?')) return;

    setActionLoading({ id: cardId, type: 'delete' });
    try {
      await flashcardService.deleteFlashcard(cardId);
      setFlashcards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
      alert('Failed to delete flashcard. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartEdit = (card) => {
    if (!card) return;
    setEditingCard(card.id);
    setEditFront(card.front || '');
    setEditBack(card.back || '');
  };

  const handleSaveEdit = async (cardId) => {
    const card = flashcards.find(c => c.id === cardId);
    if (!card) return;

    setActionLoading({ id: cardId, type: 'edit' });
    try {
      const updated = await flashcardService.updateFlashcard(cardId, {
        front: editFront,
        back: editBack,
        difficulty: card.difficulty // Maintain existing difficulty
      });
      setFlashcards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
      setEditingCard(null);
    } catch (error) {
      console.error('Failed to update flashcard:', error);
      alert('Failed to update flashcard. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditFront('');
    setEditBack('');
  };

  const toggleFlip = (cardId) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  // ────────────────────────────────────────────
  // Keyboard Controls (study mode)
  // ────────────────────────────────────────────
  useEffect(() => {
    if (!studyMode) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          flipCard();
          break;
        case 'Escape':
          exitStudyMode();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, currentIndex, isFlipped, studyDeck, flipCard, exitStudyMode]);

  // ────────────────────────────────────────────
  // Study Mode - Full Screen Overlay
  // ────────────────────────────────────────────
  if (studyMode) {
    const currentCard = studyDeck[currentIndex];
    const progress = studyDeck.length > 0 ? ((currentIndex + 1) / studyDeck.length) * 100 : 0;
    const isLastCard = currentIndex === studyDeck.length - 1;

    return (
      <div className="fixed inset-0 h-[100dvh] z-[100] bg-slate-950 flex flex-col overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] -ml-40 -mb-40"></div>

        {/* Study Header */}
        <div className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={exitStudyMode}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <div>
              <h2 className="text-sm font-bold text-white">Study Session</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                {currentIndex + 1} of {studyDeck.length} cards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={shuffleDeck}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Shuffle Deck"
            >
              <Shuffle size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-900 relative shrink-0">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Card Area */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-4 md:py-10 relative overflow-hidden">
          {currentCard && (
            <div className="w-full max-w-2xl" style={{ perspective: '1200px' }}>
              <div
                onClick={flipCard}
                className="relative w-full cursor-pointer"
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front Face */}
                <div
                  className="w-full min-h-[380px] bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl shadow-black/30 ring-1 ring-white/5"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="absolute top-6 left-8 flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getDifficultyConfig(currentCard.difficulty).bg} ${getDifficultyConfig(currentCard.difficulty).color} border ${getDifficultyConfig(currentCard.difficulty).border}`}>
                      {currentCard.difficulty || 'General'}
                    </div>
                  </div>

                  <div className="absolute top-6 right-8">
                    <div className="flex items-center gap-1.5 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                      <Eye size={12} /> Click to reveal
                    </div>
                  </div>

                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8">
                    <Brain className="text-indigo-400" size={28} />
                  </div>

                  <p className="text-2xl lg:text-3xl font-bold text-white leading-relaxed max-w-lg">
                    {currentCard.front}
                  </p>

                  <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                      Question
                    </div>
                  </div>
                </div>

                {/* Back Face */}
                <div
                  className="w-full min-h-[380px] bg-gradient-to-br from-indigo-950/50 to-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/10 absolute top-0 left-0"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="absolute top-6 left-8 flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Answer
                    </div>
                  </div>

                  <div className="absolute top-6 right-8">
                    <div className="flex items-center gap-1.5 text-indigo-500/50 text-[10px] font-bold uppercase tracking-widest">
                      <EyeOff size={12} /> Click to hide
                    </div>
                  </div>

                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-8">
                    <Sparkles className="text-indigo-300" size={28} />
                  </div>

                  <p className="text-xl lg:text-2xl text-indigo-100 leading-relaxed max-w-lg font-medium">
                    {currentCard.back}
                  </p>

                  <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                      Answer Revealed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="h-24 md:h-28 border-t border-white/5 bg-slate-900/80 backdrop-blur-md px-3 md:px-8 flex items-center justify-center gap-2 md:gap-6 shrink-0 z-20 pb-8 sm:pb-0">
          {/* Previous */}
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous Card"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Flip button */}
          <button
            onClick={flipCard}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 ring-4 ring-indigo-500/20 shrink-0"
            title="Flip Card"
          >
            <RotateCcw size={24} />
          </button>

          {/* Next / Finish */}
          <button
            onClick={isLastCard ? exitStudyMode : goNext}
            className={`w-28 h-10 md:h-12 rounded-xl md:rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all
              ${isLastCard 
                ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500' 
                : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white hover:bg-slate-700'}`}
            title={isLastCard ? "Finish Session" : "Next Card"}
          >
            {isLastCard ? (
              <>Finish <Check size={16} /></>
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>

        {/* Session Complete Overlay removed as it relied on removed buttons for progression tracking */}

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-6 text-[10px] text-slate-700 font-bold uppercase tracking-widest">
          <span>Space/Enter: Flip</span>
          <span>Esc: Exit</span>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────
  // Main Deck View
  // ────────────────────────────────────────────
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-white/5 shadow-2xl p-1 lg:p-2">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

        <div className="relative z-10 bg-slate-950/80 backdrop-blur-2xl rounded-[2.8rem] p-12 lg:p-16 border border-white/10 overflow-hidden shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)]">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -ml-20 -mb-20"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent"></div>

          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-violet-100 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <Layers size={14} className="animate-pulse" /> Flashcard Engine
            </div>

            <h1 className="text-4xl lg:text-6xl font-display font-bold text-white mb-4 leading-tight">
              Train Your Memory
            </h1>

            <p className="text-violet-100/70 text-lg lg:text-xl max-w-2xl mx-auto">
              Review your AI-generated flashcards with active recall. Master concepts through spaced repetition.
            </p>

            {/* Stats Strip */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white">
                <Layers className="text-violet-400" size={18} />
                <span className="text-lg font-bold">{flashcards.length}</span>
                <span className="text-xs text-slate-400 font-medium">Total Cards</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white">
                <BookOpen className="text-indigo-400" size={18} />
                <span className="text-lg font-bold">{lessonIds.length}</span>
                <span className="text-xs text-slate-400 font-medium">Lessons</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white">
                <GraduationCap className="text-emerald-400" size={18} />
                <span className="text-lg font-bold">{filteredCards.length}</span>
                <span className="text-xs text-slate-400 font-medium">In Deck</span>
              </div>
            </div>

            {filteredCards.length > 0 && (
              <div className="pt-4 px-6 flex justify-center">
                <Button
                  onClick={startStudyMode}
                  className="w-full sm:w-auto px-6 sm:px-12 py-4 sm:py-5 rounded-2xl text-base sm:text-lg font-bold shadow-2xl shadow-indigo-500/20 gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-95 shrink-0"
                >
                  <Sparkles size={20} /> Start Study Session
                  <ArrowRight size={20} className="hidden xs:block" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters & Card Grid */}
      <section>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layers className="text-violet-400" /> My Flashcards
          </h2>

          {/* Filter Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest relative">
              {isDataLoading ? (
                <Loader2 size={14} className="animate-spin text-indigo-400" />
              ) : (
                <Filter size={14} />
              )}
              Filter:
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-800/60 border border-white/10 text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer uppercase tracking-wider"
              id="difficulty-filter"
            >
              {difficultyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'All Levels' : opt}
                </option>
              ))}
            </select>

            {/* Course Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedLesson('all'); // Reset lesson when course changes
              }}
              className="bg-slate-800/60 border border-white/10 text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer uppercase tracking-wider"
              id="course-filter"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            {/* Lesson Filter */}
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="bg-slate-800/60 border border-white/10 text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer uppercase tracking-wider"
              id="lesson-filter"
            >
              <option value="all">All Lessons</option>
              {selectedCourse === 'all'
                ? lessonIds.map((id) => (
                  <option key={id} value={id}>Lesson {id}</option>
                ))
                : (courseLessonMap[selectedCourse] || []).map((id) => (
                  <option key={id} value={id}>Lesson {id}</option>
                ))
              }
            </select>

            <button
              onClick={() => {
                setSelectedDifficulty('all');
                setSelectedCourse('all');
                setSelectedLesson('all');
              }}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              title="Reset Filters"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-800/20 rounded-3xl animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => {
              const config = getDifficultyConfig(card.difficulty);
              const DiffIcon = config.icon;

              const isRevealed = flippedCards.has(card.id);

              if (editingCard === card.id) {
                return (
                  <Card key={card.id} className="min-h-[18rem] h-auto w-full p-6 flex flex-col bg-slate-900 border border-indigo-500/50 rounded-3xl shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]">
                    <div className="flex-1 flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Question</label>
                        <textarea
                          value={editFront}
                          onChange={(e) => setEditFront(e.target.value)}
                          disabled={actionLoading?.id === card.id}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-16 scrollbar-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Answer</label>
                        <textarea
                          value={editBack}
                          onChange={(e) => setEditBack(e.target.value)}
                          disabled={actionLoading?.id === card.id}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-16 scrollbar-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(card.id)}
                        disabled={actionLoading?.id === card.id}
                        className="flex-1 h-9 gap-1.5 rounded-xl text-xs"
                      >
                        {actionLoading?.id === card.id && actionLoading.type === 'edit' ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                        {actionLoading?.id === card.id ? 'Saving...' : 'Save'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={actionLoading?.id === card.id} className="h-9 gap-1.5 rounded-xl text-xs text-slate-400">
                        <X size={14} /> Cancel
                      </Button>
                    </div>
                  </Card>
                );
              }

              return (
                <Card
                  key={card.id}
                  className={`min-h-[18rem] h-auto w-full p-8 flex flex-col transition-all duration-300 cursor-pointer relative overflow-hidden group ${isRevealed ? 'bg-indigo-950/40 border-indigo-500/40 shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}
                  onClick={() => toggleFlip(card.id)}
                  hover={false}
                >
                  {/* Subtle Background Glow for Revealed State */}
                  {isRevealed && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  )}

                  {/* Header: Difficulty & Actions */}
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isRevealed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : config.bg + ' ' + config.color + ' ' + config.border}`}>
                      {isRevealed ? <Check size={10} /> : <DiffIcon size={10} />}
                      {isRevealed ? 'Answer' : (card.difficulty || 'General')}
                    </span>

                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(card);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(card.id);
                        }}
                        disabled={actionLoading?.id === card.id}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        {actionLoading?.id === card.id && actionLoading.type === 'delete' ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                    {/* Always visible Question */}
                    <div className={`transition-all duration-300 flex flex-col justify-center ${isRevealed ? 'mb-4' : 'h-full'}`}>
                      <p className="text-[10px] font-bold text-indigo-400/50 uppercase tracking-[0.2em] mb-2 self-center">
                        Question
                      </p>
                      <h3 className={`font-bold text-white text-center leading-tight transition-all duration-300 ${isRevealed ? 'text-lg' : 'text-2xl'}`}>
                        {card.front}
                      </h3>
                    </div>

                    {/* Expandable Answer */}
                    <div className={`transition-all duration-500 overflow-hidden flex flex-col ${isRevealed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="w-12 h-0.5 bg-indigo-500/20 mx-auto mb-4"></div>
                      <p className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-[0.2em] mb-2">
                        The Answer
                      </p>
                      <div className="overflow-y-auto scrollbar-none pb-2">
                        <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                          {card.back}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`mt-4 pt-4 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-widest relative z-10 ${isRevealed ? 'border-indigo-500/20 text-slate-500' : 'border-white/5 text-slate-500'}`}>
                    <span className="flex items-center gap-1.5">
                      <Brain size={12} /> Lesson {card.lesson_id}
                    </span>
                    <span className="text-indigo-400 flex items-center gap-1">
                      {isRevealed ? (
                        <><RotateCcw size={10} /> Flip to Question</>
                      ) : (
                        <><ArrowRight size={10} /> Reveal Answer</>
                      )}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-20 bg-slate-800/10 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-slate-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <Layers className="text-slate-600" size={36} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">No Flashcards Yet</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              {flashcards.length > 0
                ? 'No cards match your current filters. Try adjusting them.'
                : 'Complete lessons to unlock AI-generated flashcards for your courses. Each lesson generates unique review cards.'}
            </p>
            {flashcards.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDifficulty('all');
                  setSelectedCourse('all');
                  setSelectedLesson('all');
                }}
                className="gap-2 rounded-xl"
              >
                <RotateCcw size={14} /> Clear Filters
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Flashcard Detail Modal removed per user request */}
    </div>
  );
};

// ────────────────────────────────────────────
// Flashcard Detail Modal Component
// ────────────────────────────────────────────
const FlashcardDetailModal = ({
  card,
  onClose,
  flashcards,
  getDifficultyConfig,
  handleStartEdit,
  handleDelete,
  navigateDetail
}) => {
  if (!card) return null;
  const config = getDifficultyConfig(card.difficulty);
  const DiffIcon = config.icon;
  const idx = flashcards.findIndex(c => c.id === card.id);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 lg:p-10">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.color} border ${config.border} flex items-center justify-center`}>
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Flashcard Details</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                Card {idx + 1} of {flashcards.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Question Side */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Question (Front)
                  </div>
                </div>
                <div className="p-8 bg-slate-950/50 border border-white/5 rounded-3xl min-h-[160px] flex items-center justify-center text-center">
                  <p className="text-xl lg:text-2xl font-bold text-white leading-relaxed">
                    {card.front}
                  </p>
                </div>
              </div>

              <Card className="p-6 bg-slate-800/30 border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-3">Card Metadata</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Difficulty</span>
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${config.color}`}>
                      <DiffIcon size={12} /> {card.difficulty || 'General'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lesson Context</span>
                    <span className="text-white text-xs font-bold">Lesson {card.lesson_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date Generated</span>
                    <span className="text-slate-400 text-xs font-medium">{new Date(card.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Answer Side */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Answer (Back)
                  </div>
                </div>
                <div className="p-8 bg-indigo-950/20 border border-indigo-500/10 rounded-3xl min-h-[160px] flex items-center justify-center text-center">
                  <p className="text-lg lg:text-xl text-slate-200 leading-relaxed">
                    {card.back}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    handleStartEdit(card);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-4 border border-white/10 rounded-2xl text-slate-300 hover:bg-white/5 transition-all"
                >
                  <Edit3 size={18} /> Edit Card
                </button>
                <button
                  onClick={() => {
                    handleDelete(card.id);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-4 border border-rose-500/20 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl shrink-0 flex items-center justify-between">
          <button
            onClick={() => navigateDetail('prev')}
            disabled={idx === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} /> Previous Card
          </button>

          <div className="flex gap-2">
            {flashcards.slice(Math.max(0, idx - 2), Math.min(flashcards.length, idx + 3)).map((c) => (
              <div
                key={c.id}
                className={`w-1.5 h-1.5 rounded-full transition-all ${c.id === card.id ? 'bg-indigo-500 w-4' : 'bg-slate-700'}`}
              />
            ))}
          </div>

          <button
            onClick={() => navigateDetail('next')}
            disabled={idx === flashcards.length - 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next Card <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
