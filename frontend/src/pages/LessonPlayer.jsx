import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from '../components/ui/Button';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  BrainCircuit,
  Sparkles,
  Send,
  User as UserIcon,
  RotateCcw,
  Mic
} from 'lucide-react';
import VoiceInputButton from '../components/chat/VoiceInputButton';

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Chat States
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Quiz States
  const [quizzes, setQuizzes] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const sessionId = `lesson_${lessonId}`;

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/lessons/${lessonId}`);
      setLesson(response.data);

      // Also fetch all lessons for this course to calculate overall progress
      const lessonsRes = await api.get(`/courses/${response.data.course_id}/lessons`);
      setCourseLessons(lessonsRes.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await api.get(`/chats?session_id=${sessionId}&limit=1000`);
      // The backend returns chats in reverse chronological order
      const history = response.data.reverse().map(chat => ([
        { role: 'user', content: chat.prompt },
        { role: 'assistant', content: chat.response }
      ])).flat();
      setMessages(history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchLesson();
    fetchChatHistory();
  }, [fetchLesson, fetchChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('prompt', input);
      formData.append('session_id', sessionId);

      const response = await api.post('/chats', formData);

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceComplete = useCallback(async (blob) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'user', content: '🎤 Spoken message...' }]);

    try {
      const formData = new FormData();
      formData.append('audio_file', blob, 'voice_input.webm');
      formData.append('session_id', sessionId);

      const response = await api.post('/chats', formData);
      setMessages(prev => [
        ...prev.filter(m => m.content !== '🎤 Spoken message...'),
        { role: 'user', content: response.data.prompt },
        { role: 'assistant', content: response.data.response }
      ]);
      fetchChatHistory();
    } catch (error) {
      console.error('Voice message failed:', error);
      setMessages(prev => [
        ...prev.filter(m => m.content !== '🎤 Spoken message...'),
        { role: 'assistant', content: '⚠️ Voice processing failed. Please try text.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, fetchChatHistory]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      // Calling complete generates quizzes on the backend
      const response = await api.get(`/lessons/${lessonId}/complete`);
      setQuizzes(response.data);
      setShowQuiz(true);

      // Still refresh lesson for status
      const res = await api.get(`/lessons/${lessonId}`);
      setLesson(res.data);
    } catch (error) {
      console.error('Completion failed:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingQuiz(true);
    try {
      const submission = {
        session_id: quizzes[0]?.session_id || sessionId,
        submissions: Object.entries(quizAnswers).map(([qid, ans]) => ({
          quiz_id: parseInt(qid),
          student_answer: ans
        }))
      };

      const response = await api.post(`/lessons/${lessonId}/quizzes/submit`, submission);
      setQuizResult(response.data);

      // If passed, refresh lesson to show next/completed status
      if (response.data.score >= 70) {
        const res = await api.get(`/lessons/${lessonId}`);
        setLesson(res.data);
      }
    } catch (error) {
      console.error('Quiz submission failed:', error);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const goToNextLesson = async () => {
    const currentIndex = courseLessons.length > 0
      ? courseLessons.findIndex(l => l.id === parseInt(lessonId))
      : -1;

    if (currentIndex !== -1 && currentIndex < courseLessons.length - 1) {
      navigate(`/lessons/${courseLessons[currentIndex + 1].id}`);
    } else {
      navigate(`/courses/${lesson.course_id}`);
    }
  };

  const goToPreviousLesson = async () => {
    const currentIndex = courseLessons.length > 0
      ? courseLessons.findIndex(l => l.id === parseInt(lessonId))
      : -1;

    if (currentIndex > 0) {
      navigate(`/lessons/${courseLessons[currentIndex - 1].id}`);
    }
  };

  const handleRetakeQuiz = async () => {
    setCompleting(true);
    try {
      const response = await api.get(`/lessons/${lessonId}/quizzes`);
      setQuizzes(response.data);
      setQuizAnswers({});
      setQuizResult(null);
      setShowQuiz(true);
    } catch (error) {
      console.error('Failed to get quizzes:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-400 font-medium">Synthesizing lesson content...</p>
      </div>
    );
  }

  const completedCount = courseLessons.filter(l => l.status === 'completed').length;
  const progressPercent = courseLessons.length > 0 ? Math.round((completedCount / courseLessons.length) * 100) : 0;
  const currentModuleIndex = courseLessons.findIndex(l => l.id === parseInt(lessonId)) + 1;
  const totalModules = courseLessons.length;

  if (!lesson) return <div className="text-white p-10">Lesson not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mt-8 -mx-8 relative overflow-hidden">
      {/* Top Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/courses/${lesson.course_id}`)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="h-4 w-px bg-slate-800"></div>
          <div>
            <h2 className="text-sm font-bold text-white line-clamp-1">{lesson.title}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Module {currentModuleIndex || 1} of {totalModules || '--'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lesson.is_completed && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl"
              onClick={handleRetakeQuiz}
            >
              <BrainCircuit size={16} /> Retake Quiz
            </Button>
          )}
          <Button
            variant={lesson.is_completed ? 'secondary' : 'primary'}
            size="sm"
            className="gap-2 h-9 rounded-xl shadow-lg ring-1 ring-white/10"
            onClick={lesson.is_completed ? goToNextLesson : handleComplete}
            disabled={completing}
          >
            {completing ? <Loader2 className="animate-spin" size={16} /> : (
              lesson.is_completed ? <><ChevronRight size={16} /> Next Lesson</> : 'Mark Complete & Quiz'
            )}
          </Button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Content Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-900/50 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-invert prose-indigo max-w-none 
              prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mb-10 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-indigo-400
              prose-p:text-slate-300 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-8
              prose-ul:list-disc prose-ul:pl-6 prose-li:text-slate-300 prose-li:my-3
              prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl prose-pre:p-8 prose-pre:shadow-2xl
              prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.content || '# Generating Content...\n\nPlease wait while the AI Tutor creates your lesson for this topic.'}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Right: AI Tutor Chat Sidebar */}
        <div className="w-[450px] border-l border-slate-800 bg-slate-900/50 backdrop-blur-3xl hidden xl:flex flex-col shrink-0">
          <div className="p-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 shrink-0">
            <h3 className="font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <BrainCircuit className="text-indigo-400" size={18} />
              </div>
              AI Study Assistant
            </h3>
            <button className="text-slate-500 hover:text-white transition-colors" title="Reset Chat">
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 pt-28 space-y-6 custom-scrollbar">
            {messages.length === 0 && !isTyping && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-6 opacity-50">
                <div className="w-16 h-16 bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-600">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Interactive Learning</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ask questions about this lesson's concepts, code examples, or any confusing parts. Your AI Tutor is here to help!
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-indigo-400'}`}>
                  {msg.role === 'user' ? <UserIcon size={16} /> : <Sparkles size={16} />}
                </div>
                <div className={`max-w-[95%] p-4 rounded-2xl text-base leading-relaxed ${msg.role === 'user'
                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-100 rounded-tr-none'
                  : 'bg-white/[0.03] border border-white/5 backdrop-blur-sm text-slate-300 rounded-tl-none prose prose-invert prose-base max-w-none'
                  }`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  ) : msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-indigo-400">
                  <Sparkles size={16} />
                </div>
                <div className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t border-white/5 bg-white/[0.01]">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  placeholder="Ask your tutor anything..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-2 bottom-2 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 transition-all shadow-lg"
                >
                  <Send size={18} />
                </button>
              </div>
              <VoiceInputButton
                onRecordingComplete={handleVoiceComplete}
                isDisabled={isTyping}
              />
            </form>
            <p className="mt-3 text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest">
              Contextual AI Assistant Active
            </p>
          </div>
        </div>
      </div>

      <div className="h-20 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-10 flex items-center justify-between shrink-0 z-20">
        <button
          onClick={goToPreviousLesson}
          className="flex items-center gap-3 text-slate-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Previous
        </button>

        <div className="flex items-center gap-6">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hidden sm:block">
            Course Progress: {progressPercent}%
          </div>
        </div>

        <button
          onClick={goToNextLesson}
          className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300 transition-all text-xs font-bold uppercase tracking-widest group"
        >
          Next
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* Quiz Overlay */}
      {showQuiz && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Quiz Header */}
            <div className="p-8 border-b border-white/5 bg-indigo-600 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <BrainCircuit className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">Knowledge Validation</h3>
                  <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest mt-1">Lesson Evaluation • {quizzes.length} Questions</p>
                </div>
              </div>
              <button
                onClick={() => { setShowQuiz(false); setQuizResult(null); }}
                className="text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            </div>

            {/* Quiz Content Container */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
              {!quizResult ? (
                <form onSubmit={handleQuizSubmit} className="space-y-10">
                  {quizzes.map((quiz, qIdx) => (
                    <div key={quiz.id} className="space-y-6">
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                          {qIdx + 1}
                        </span>
                        <h4 className="text-xl font-bold text-white leading-relaxed">{quiz.question}</h4>
                      </div>

                      <div className="pl-12">
                        {quiz.type === 'multiple_choice' || quiz.type === 'true_false' ? (
                          <div className="grid grid-cols-1 gap-4">
                            {(quiz.type === 'true_false' ? ['True', 'False'] : quiz.options).map((opt, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [quiz.id]: opt }))}
                                className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${quizAnswers[quiz.id] === opt
                                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                                  : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/20 hover:bg-slate-800/60'
                                  }`}
                              >
                                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 ${quizAnswers[quiz.id] === opt ? 'bg-white text-indigo-600 border-white' : 'border-white/10 text-slate-500 bg-slate-900'
                                  }`}>
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="font-medium text-sm md:text-base leading-relaxed">{opt}</span>
                              </button>
                            ))}
                          </div>
                        ) : quiz.type === 'short_answer' ? (
                          <div className="relative group">
                            <textarea
                              placeholder="Type your detailed answer here..."
                              className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-2xl p-6 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner"
                              value={quizAnswers[quiz.id] || ''}
                              onChange={(e) => setQuizAnswers(prev => ({ ...prev, [quiz.id]: e.target.value }))}
                            />
                            <div className="absolute right-4 bottom-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Essay Mode</div>
                          </div>
                        ) : quiz.type === 'fill_blank' ? (
                          <div className="relative group max-w-md">
                            <input
                              type="text"
                              placeholder="Complete the statement..."
                              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-5 px-8 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                              value={quizAnswers[quiz.id] || ''}
                              onChange={(e) => setQuizAnswers(prev => ({ ...prev, [quiz.id]: e.target.value }))}
                            />
                            <div className="absolute left-4 -top-3 px-2 bg-slate-900 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Missing Term</div>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic text-sm">Unsupported question type: {quiz.type}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-10 flex justify-center">
                    <Button
                      type="submit"
                      disabled={isSubmittingQuiz || Object.keys(quizAnswers).length < quizzes.length}
                      className="px-12 py-6 rounded-2xl text-lg font-bold shadow-2xl shadow-indigo-500/20 gap-3"
                    >
                      {isSubmittingQuiz ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} /> Submit Evaluation</>}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="max-w-3xl mx-auto space-y-12 animate-in zoom-in-95 duration-500 pb-10">
                  <div className="text-center relative">
                    <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full"></div>
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mx-auto mb-6 relative transition-all duration-1000 ${quizResult.score >= 70 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
                      }`}>
                      <div>
                        <p className="text-4xl font-display font-bold text-white mb-0">{quizResult.score}%</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Mastery</p>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">
                      {quizResult.score >= 70 ? 'Excellent Progress!' : 'Knowledge Gap Detected'}
                    </h3>
                    <p className="text-slate-400 text-lg leading-relaxed italic max-w-xl mx-auto">
                      "{quizResult.feedback}"
                    </p>
                  </div>

                  {/* Detailed Question Review */}
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-8 text-center">Architectural Review</h4>
                    {quizResult.quizzes && quizResult.quizzes.map((q, idx) => (
                      <div key={idx} className={`p-8 rounded-3xl border transition-all ${q.is_correct ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                        }`}>
                        <div className="flex items-start gap-4 mb-6">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${q.is_correct ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'
                            }`}>
                            {q.is_correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          </div>
                          <h5 className="text-lg font-bold text-white leading-tight mt-1">{q.question}</h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12 mb-6">
                          <div className="p-4 rounded-2xl bg-slate-900 border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your Answer</p>
                            <p className={`text-sm font-bold ${q.is_correct ? 'text-emerald-400' : 'text-rose-400'}`}>{q.student_answer || 'No answer'}</p>
                          </div>
                          {!q.is_correct && (
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                              <p className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest mb-1">Correct Answer</p>
                              <p className="text-sm font-bold text-emerald-400">{q.correct_answer}</p>
                            </div>
                          )}
                        </div>

                        {q.explanation && (
                          <div className="pl-12 pt-4 border-t border-white/5">
                            <p className="text-xs text-slate-400 leading-relaxed">
                              <span className="font-bold text-indigo-400 uppercase tracking-widest mr-2 text-[10px]">Tutor Note:</span>
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-10">
                    <Button
                      onClick={goToNextLesson}
                      disabled={quizResult.score < 70}
                      className={`py-6 rounded-[1.5rem] text-lg font-bold shadow-2xl gap-3 ${quizResult.score >= 70 ? 'bg-indigo-600 shadow-indigo-500/20' : 'opacity-50 grayscale'
                        }`}
                    >
                      Next Lesson <ChevronRight size={22} />
                    </Button>
                    <button
                      onClick={() => { setShowQuiz(false); setQuizResult(null); }}
                      className="py-4 text-slate-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      Back to Module Content
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlayer;
