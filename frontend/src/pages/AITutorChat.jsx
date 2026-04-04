import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Sparkles,
  User,
  Plus,
  MessageCircle,
  History,
  Search,
  Loader2,
  Clock,
  Bot,
  Zap,
  BookOpen,
  GraduationCap,
  Lightbulb,
  RotateCcw,
  ChevronRight,
  Code2,
  Brain,
  ArrowLeft,
  Trash2,
  Volume2,
  Square,
  Play,
  Pause,
  XCircle,
  Menu
} from 'lucide-react';
import chatService from '../services/chatService';
import SmartMarkdown from '../components/ui/SmartMarkdown';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import VoiceInputButton from '../components/chat/VoiceInputButton';

// ─── Suggestion prompts for empty state ───
const SUGGESTIONS = [
  { text: 'Explain Quantum Physics in simple terms', icon: Lightbulb, gradient: 'from-amber-500 to-orange-600' },
  { text: 'Build a REST API with Python Flask', icon: Code2, gradient: 'from-blue-500 to-cyan-600' },
  { text: 'Help me understand Machine Learning basics', icon: Brain, gradient: 'from-emerald-500 to-teal-600' },
  { text: 'Create a 7-day JavaScript learning plan', icon: BookOpen, gradient: 'from-violet-500 to-purple-600' },
  { text: 'Explain React hooks with code examples', icon: GraduationCap, gradient: 'from-pink-500 to-rose-600' },
  { text: 'What is Big O notation?', icon: Zap, gradient: 'from-indigo-500 to-blue-600' },
];

// ─── Single message bubble ───
const ChatBubble = ({ msg }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isUser = msg.role === 'user';
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleSpeak = () => {
    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      window.speechSynthesis.cancel(); // Cancel any current speech
      const utterance = new SpeechSynthesisUtterance(msg.content);

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  return (
    <div className={twMerge('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={twMerge(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-lg',
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        )}
      >
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>

      {/* Content */}
      <div className={twMerge('flex flex-col max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={twMerge(
            'px-5 py-3 rounded-2xl shadow-md transition-all duration-300',
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm hover:bg-indigo-500'
              : 'bg-white/[0.03] border border-white/10 backdrop-blur-md text-slate-200 rounded-tl-sm hover:bg-white/[0.05]'
          )}
        >
          {isUser ? (
            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <>
              <div
                className="prose prose-invert prose-sm md:prose-base max-w-none
                  prose-p:text-slate-200 prose-p:my-1.5 prose-p:leading-relaxed
                  prose-headings:text-white prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                  prose-strong:text-white prose-strong:font-bold
                  prose-code:bg-slate-900/90 prose-code:text-emerald-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs md:prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:my-3 prose-pre:p-4
                  prose-ul:my-2 prose-li:text-slate-300 prose-li:my-0.5
                  prose-blockquote:border-indigo-500/50 prose-blockquote:bg-indigo-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline"
              >
                <SmartMarkdown>{msg.content}</SmartMarkdown>
              </div>
              <div className="flex justify-end mt-3 -mr-2 -mb-1 border-t border-white/5 pt-2">
                <button
                  onClick={handleSpeak}
                  className={twMerge(
                    "p-1.5 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                    isPlaying
                      ? "text-indigo-400 bg-indigo-500/10"
                      : "text-slate-400 hover:text-indigo-300 hover:bg-white/5"
                  )}
                  title={isPlaying ? (isPaused ? "Resume reading" : "Pause reading") : "Listen to response"}
                >
                  {isPlaying ? (
                    isPaused ? (
                      <><Play size={12} fill="currentColor" /> Resume</>
                    ) : (
                      <><Pause size={12} fill="currentColor" /> Pause</>
                    )
                  ) : (
                    <><Volume2 size={12} /> Read Aloud</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        {time && <span className="text-[10px] text-slate-500 mt-1.5 px-1 font-medium">{time}</span>}
      </div>
    </div>
  );
};

// ─── Typing dots ───
const TypingDots = () => (
  <div className="flex gap-3 mb-6">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 mt-1 shadow-lg">
      <Bot size={16} className="text-white" />
    </div>
    <div className="bg-white/[0.03] border border-white/10 backdrop-blur-md px-5 py-3 rounded-2xl rounded-tl-sm shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm font-medium">Thinking</span>
        <span className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            ></span>
          ))}
        </span>
      </div>
    </div>
  </div>
);

// ─── Main Component ───
const AITutorChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  const fetchAllChats = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsInitialLoading(true);
    try {
      const chats = await chatService.getChats({ limit: 1000 });
      const grouped = {};

      // Sort chronologically (oldest first) to build the message history correctly
      const chronologicalChats = [...chats].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      chronologicalChats.forEach(chat => {
        // Normalize session_id from API; treat each null-session chat as its own entry
        const sid = chat.session_id || `legacy_${chat.id}`;

        if (!grouped[sid]) {
          grouped[sid] = {
            id: sid,
            title: chat.prompt.length > 40 ? chat.prompt.slice(0, 40) + '...' : chat.prompt,
            lastMessage: '',
            timestamp: new Date(chat.created_at),
            messageTotal: 0, // This is the count of records
            messages: []
          };
        }

        // Update the last message to be the most recent response
        grouped[sid].lastMessage = chat.response.length > 80 ? chat.response.slice(0, 80) + '...' : chat.response;
        grouped[sid].timestamp = new Date(chat.created_at);

        grouped[sid].messages.push({ role: 'user', content: chat.prompt, timestamp: chat.created_at });
        grouped[sid].messages.push({ role: 'assistant', content: chat.response, timestamp: chat.created_at });
        grouped[sid].messageTotal += 1; // Number of prompt/response interactions
      });

      const sortedSessions = Object.values(grouped).sort((a, b) => b.timestamp - a.timestamp);
      setSessions(sortedSessions);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllChats();
  }, [fetchAllChats]); // Once on mount

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    // Optimistically add user message if no current messages (starting new)
    const newUserMsg = { role: 'user', content: currentInput, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const sid = currentSessionId || `session_${Date.now()}`;
      if (!currentSessionId) setCurrentSessionId(sid);

      const formData = new FormData();
      formData.append('prompt', currentInput);
      formData.append('session_id', sid);

      const res = await chatService.createChat(formData);

      const newBotMsg = { role: 'assistant', content: res.response, timestamp: res.created_at };
      setMessages(prev => [...prev, newBotMsg]);

      // Update session list in background
      fetchAllChats(true);
    } catch (err) {
      console.error('Send failed:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceComplete = useCallback(async (blob) => {
    setIsLoading(true);
    // Optimistic user message for voice
    setMessages((prev) => [...prev, { role: 'user', content: '🎤 Spoken message...', timestamp: new Date().toISOString() }]);

    try {
      const formData = new FormData();
      formData.append('audio_file', blob, 'voice_input.webm');

      const sid = currentSessionId || `session_${Date.now()}`;
      if (!currentSessionId) setCurrentSessionId(sid);
      formData.append('session_id', sid);

      const res = await chatService.createChat(formData);
      setMessages((prev) => [
        ...prev.filter(m => m.content !== '🎤 Spoken message...'), // Remove placeholder
        { role: 'user', content: res.prompt, timestamp: res.created_at }, // Show transcribed text
        { role: 'assistant', content: res.response, timestamp: res.created_at }
      ]);
      fetchAllChats();
    } catch (err) {
      console.error('Voice send failed:', err);
      setMessages((prev) => [
        ...prev.filter(m => m.content !== '🎤 Spoken message...'),
        { role: 'assistant', content: '⚠️ Voice processing failed. Please try text input.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, fetchAllChats]);

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const selectSession = async (session) => {
    if (currentSessionId === session.id) return;
    setCurrentSessionId(session.id);

    // Clear messages immediately for clean transition
    setMessages([]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsSidebarOpen(false); // Close sidebar automatically on mobile

    try {
      const history = await chatService.getChats({ session_id: session.id, limit: 1000 });
      // Sort chronologically (oldest first) to build the message history correctly
      const sortedHistory = [...history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const sessionMessages = sortedHistory.flatMap(chat => [
        { role: 'user', content: chat.prompt, timestamp: chat.created_at },
        { role: 'assistant', content: chat.response, timestamp: chat.created_at }
      ]);
      setMessages(sessionMessages);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load session history:', err);
      // Fallback to pre-cached messages if deep fetch fails
      setMessages(session.messages || []);
    }
  };

  const handleDeleteChat = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      await chatService.deleteSession(sessionId);

      // Update local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));

      // If we deleted the current active session, reset state
      if (currentSessionId === sessionId) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert('Failed to delete the conversation. Please try again.');
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-inter relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition duration-300 ease-in-out z-50 flex w-80 bg-slate-900/95 lg:bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex-col shrink-0`}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">AI Tutor</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/80">Active Learning</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
              <XCircle size={20} />
            </button>
          </div>

          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-[0.98] group"
          >
            <Plus size={18} className="text-indigo-400 group-hover:rotate-90 transition-transform duration-300" />
            New Conversation
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-slate-800/40 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {isInitialLoading && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Loader2 className="w-6 h-6 text-slate-700 animate-spin mb-2" />
              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Loading Chats</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <History className="text-slate-700" size={24} />
              </div>
              <p className="text-slate-500 font-semibold text-sm">No recent chats</p>
              <p className="text-slate-700 text-xs mt-1">Your conversations will appear here.</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-4 pt-2 pb-3">History</p>
              {filteredSessions.map((session) => {
                const isActive = currentSessionId === session.id;
                return (
                  <button
                    key={session.id}
                    onClick={() => selectSession(session)}
                    className={twMerge(
                      "w-full text-left px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden",
                      isActive
                        ? "bg-indigo-600/10 border border-indigo-500/30"
                        : "hover:bg-white/[0.03] border border-transparent hover:border-white/5"
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                    <div className="flex items-start gap-3">
                      <div className={twMerge(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-inner",
                        isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800/80 text-slate-600 group-hover:text-slate-400"
                      )}>
                        <MessageCircle size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={twMerge("text-sm font-semibold truncate", isActive ? "text-indigo-300" : "text-slate-200")}>
                          {session.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-1 line-clamp-1 opacity-70 italic">
                          {session.lastMessage}
                        </p>
                        <div className="flex items-center gap-2.5 mt-2 opacity-50">
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            <span className="text-[10px] font-medium">
                              {session.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 w-8 shrink-0">
                        <button
                          onClick={(e) => handleDeleteChat(e, session.id)}
                          className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={14} className={twMerge(
                          "shrink-0 transition-all",
                          isActive ? "text-indigo-400 translate-x-0" : "text-slate-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                        )} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-900/60">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.username || 'Learner'}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-0.5">Premium Plan</p>
            </div>
          </div>
        </div>
      </aside >

      {/* ─── Main Chat Area ─── */}
      < main className="flex-1 flex flex-col relative bg-[#020617]" >
        {/* Decorative Background Elements */}
        < div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" ></div >
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-950/95 backdrop-blur-xl sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white hover:scale-105 active:scale-95 flex items-center justify-center bg-white/5 border border-white/10 shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 lg:hidden hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white hover:scale-105 active:scale-95 flex items-center justify-center bg-white/5 border border-white/10 shadow-sm"
              title="Toggle History"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="w-48 shrink-0">
                <h1 className="text-sm font-bold tracking-tight">Academic Tutor</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                  {currentSessionId ? `Session active` : 'New Discussion'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-all"
              >
                <RotateCcw size={12} /> <span className="block">New Chat</span>
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 border-dotted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Sync Live</span>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full flex flex-col min-h-full relative">
            {messages.length === 0 && !currentSessionId ? (
              <div className="flex-1 flex flex-col items-center px-6 pt-28 pb-12 text-center">
                <div className="relative mb-8 group shrink-0">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse transition-all group-hover:bg-indigo-500/30"></div>
                  <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40 transform -rotate-3 transition-transform group-hover:rotate-0">
                    <GraduationCap size={48} className="text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-xl">
                    <Zap size={20} className="text-amber-400" />
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <h2 className="text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400">
                    Welcome, {user?.username?.split(' ')[0] || 'Learner'}!
                  </h2>
                  <p className="text-slate-400 text-base leading-relaxed">
                    I'm your deep-learning study companion. How can I help you accelerate your knowledge today?
                  </p>
                </div>

                <div className="mt-12 w-full max-w-2xl">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-6">Quick Start Prompts</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(s.text);
                          if (textareaRef.current) textareaRef.current.focus();
                        }}
                        className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300 text-left active:scale-[0.98]"
                      >
                        <div className={twMerge(
                          "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300",
                          s.gradient
                        )}>
                          <s.icon size={18} className="text-white/90" />
                        </div>
                        <div className="pt-0.5">
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-2">
                            {s.text}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-tight group-hover:text-indigo-400 transition-colors">Start Discussion →</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 pt-28 pb-10 space-y-2">
                {messages.map((msg, idx) => (
                  <ChatBubble key={idx} msg={msg} />
                ))}
                {isLoading && <TypingDots />}
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-900/40 backdrop-blur-xl relative z-20">
          <form
            onSubmit={handleSend}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="relative flex items-end gap-3 p-3 bg-white/5 border border-white/10 rounded-3xl focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-500 shadow-2xl shadow-black/40">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Message your tutor..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 text-[15px] resize-none outline-none leading-relaxed min-h-[28px] max-h-[180px] px-3 py-2 custom-scrollbar"
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
              <div className="flex items-center gap-2 pb-1 pr-1">
                <VoiceInputButton
                  onRecordingComplete={handleVoiceComplete}
                  isDisabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={twMerge(
                    "w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 relative overflow-hidden group/btn",
                    input.trim() && !isLoading
                      ? "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-95"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin text-indigo-200" />
                  ) : (
                    <>
                      <Send size={18} className="text-white relative z-10 group-hover/btn:translate-x-5 group-hover/btn:-translate-y-5 transition-transform duration-500 ease-in-out opacity-100" />
                      <Send size={18} className="text-indigo-200 absolute -left-5 bottom-0 translate-y-5 transition-transform duration-500 ease-in-out opacity-0 group-hover/btn:translate-x-5 group-hover/btn:-translate-y-5 group-hover/btn:opacity-100" />
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 mt-2">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-slate-500 transition-colors">
                  <kbd className="h-5 px-1.5 flex items-center bg-white/5 border border-white/10 rounded text-[9px] font-mono font-bold">ENTER</kbd>
                  <span className="text-[10px] font-bold uppercase tracking-widest">SEND</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-slate-500 transition-colors">
                  <kbd className="h-5 px-1.5 flex items-center bg-white/5 border border-white/10 rounded text-[9px] font-mono font-bold">SHIFT+ENTER</kbd>
                  <span className="text-[10px] font-bold uppercase tracking-widest">NEW LINE</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest italic">AI can make mistakes. Verify important info.</p>
            </div>
          </form>
        </div>
      </main >

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      ` }} />
    </div >
  );
};

export default AITutorChat;
