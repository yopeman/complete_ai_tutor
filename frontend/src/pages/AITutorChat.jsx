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
    Brain
} from 'lucide-react';
import chatService from '../services/chatService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { twMerge } from 'tailwind-merge';

// ─── Suggestion prompts for empty state ───
const SUGGESTIONS = [
    { text: 'Explain Quantum Physics in simple terms', icon: Lightbulb, gradient: 'from-amber-500 to-orange-600' },
    { text: 'Build a REST API with Python Flask', icon: Code2, gradient: 'from-blue-500 to-cyan-600' },
    { text: 'Help me understand Machine Learning basics', icon: Brain, gradient: 'from-emerald-500 to-teal-600' },
    { text: 'Create a 7-day JavaScript learning plan', icon: BookOpen, gradient: 'from-violet-500 to-purple-600' },
    { text: 'Explain React hooks with code examples', icon: GraduationCap, gradient: 'from-pink-500 to-rose-600' },
    { text: 'What is Big O notation? Explain with visuals', icon: Zap, gradient: 'from-indigo-500 to-blue-600' },
];

// ─── Single message bubble ───
const ChatBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    const time = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className={twMerge('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
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
            <div className={twMerge('flex flex-col max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
                <div
                    className={twMerge(
                        'px-5 py-3.5 rounded-2xl shadow-md',
                        isUser
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-sm'
                    )}
                >
                    {isUser ? (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                        <div
                            className="prose prose-invert prose-sm max-w-none
                prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-slate-200 prose-p:my-1.5
                prose-headings:text-white prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                prose-strong:text-white
                prose-code:bg-slate-900/80 prose-code:text-emerald-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl prose-pre:my-3
                prose-ul:my-2 prose-li:text-slate-200 prose-li:text-[15px] prose-li:my-0.5
                prose-ol:my-2
                prose-blockquote:border-indigo-500 prose-blockquote:text-slate-300
                prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline"
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                    )}
                </div>
                {time && <span className="text-[11px] text-slate-500 mt-1 px-1">{time}</span>}
            </div>
        </div>
    );
};

// ─── Typing dots ───
const TypingDots = () => (
    <div className="flex gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 mt-1 shadow-lg">
            <Bot size={16} className="text-white" />
        </div>
        <div className="bg-slate-800 border border-slate-700/80 px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-md">
            <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Thinking</span>
                <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════
// ─── Main Component ───
// ═══════════════════════════════════════════════
const AITutorChat = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const chatEndRef = useRef(null);
    const textareaRef = useRef(null);

    // ─── Scroll to newest message ───
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    // ─── Load all chats and group by session ───
    const fetchAllChats = useCallback(async () => {
        try {
            const chats = await chatService.getChats({ limit: 1000 });

            const grouped = {};
            for (const chat of chats) {
                const sid = chat.session_id || 'default';
                if (!grouped[sid]) {
                    grouped[sid] = {
                        id: sid,
                        title: chat.prompt.length > 50 ? chat.prompt.slice(0, 50) + '…' : chat.prompt,
                        lastMessage: chat.response.length > 90 ? chat.response.slice(0, 90) + '…' : chat.response,
                        timestamp: new Date(chat.created_at),
                        messageCount: 0,
                        messages: [],
                    };
                }
                grouped[sid].messages.push({ role: 'user', content: chat.prompt, timestamp: chat.created_at });
                grouped[sid].messages.push({ role: 'assistant', content: chat.response, timestamp: chat.created_at });
                grouped[sid].messageCount += 1;
                // keep latest timestamp
                const ts = new Date(chat.created_at);
                if (ts > grouped[sid].timestamp) {
                    grouped[sid].timestamp = ts;
                    grouped[sid].lastMessage = chat.response.length > 90 ? chat.response.slice(0, 90) + '…' : chat.response;
                }
            }

            const list = Object.values(grouped).sort((a, b) => b.timestamp - a.timestamp);
            setSessions(list);

            if (list.length > 0 && !currentSessionId) {
                setCurrentSessionId(list[0].id);
                setMessages(list[0].messages);
            }
        } catch (err) {
            console.error('Failed to fetch chats:', err);
        } finally {
            setIsInitialLoading(false);
        }
    }, [currentSessionId]);

    useEffect(() => { fetchAllChats(); }, [fetchAllChats]);
    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // ─── Send a message ───
    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isLoading) return;

        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        setIsLoading(true);

        // Optimistic user message
        setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }]);

        try {
            const sid = currentSessionId || `chat_${Date.now()}`;
            if (!currentSessionId) setCurrentSessionId(sid);

            const res = await chatService.createChat({ prompt: text, session_id: sid });
            setMessages((prev) => [...prev, { role: 'assistant', content: res.response, timestamp: res.created_at }]);
            fetchAllChats();
        } catch (err) {
            console.error('Send failed:', err);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '⚠️ Sorry, something went wrong. Please try again.', timestamp: new Date().toISOString() },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const startNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setInput('');
    };

    const selectSession = (session) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages);
    };

    const handleTextareaChange = (e) => {
        setInput(e.target.value);
        const el = e.target;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 150) + 'px';
    };

    const filteredSessions = sessions.filter(
        (s) =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ─── Loading state ───
    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-5 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
                        <Bot size={30} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-lg mb-1">Loading AI Tutor</p>
                        <p className="text-slate-400 text-sm">Fetching your conversations…</p>
                    </div>
                    <Loader2 className="text-indigo-400 animate-spin" size={28} />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // ─── Render ───
    // ═══════════════════════════════════════════════
    return (
        <div className="flex rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/30" style={{ height: 'calc(100vh - 180px)' }}>

            {/* ═══ SIDEBAR ═══ */}
            <aside className="w-[280px] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base">AI Tutor Chat</h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-emerald-400 text-xs font-semibold">Online</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.97] group"
                    >
                        <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                        New Conversation
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3">
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search chats…"
                            className="w-full bg-slate-800/80 text-slate-200 placeholder-slate-500 text-sm rounded-lg py-2 pl-9 pr-3 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                                <History size={20} className="text-slate-600" />
                            </div>
                            <p className="text-slate-400 font-semibold text-sm">No chats yet</p>
                            <p className="text-slate-600 text-xs mt-1">Start a conversation above!</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-1 pb-2">
                                Conversations · {filteredSessions.length}
                            </p>
                            {filteredSessions.map((session) => {
                                const isActive = currentSessionId === session.id;
                                return (
                                    <button
                                        key={session.id}
                                        onClick={() => selectSession(session)}
                                        className={twMerge(
                                            'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                                            isActive
                                                ? 'bg-indigo-500/10 border border-indigo-500/25'
                                                : 'hover:bg-slate-800/70 border border-transparent'
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-indigo-500 rounded-r-full"></div>
                                        )}
                                        <div className="flex items-start gap-2.5">
                                            <div
                                                className={twMerge(
                                                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                                                    isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'
                                                )}
                                            >
                                                <MessageCircle size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={twMerge('text-sm font-semibold truncate', isActive ? 'text-indigo-300' : 'text-slate-200')}>
                                                    {session.title}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate mt-0.5">{session.lastMessage}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock size={10} className="text-slate-600" />
                                                    <span className="text-[10px] text-slate-600">
                                                        {session.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-700">·</span>
                                                    <span className="text-[10px] text-slate-600">{session.messageCount} msgs</span>
                                                </div>
                                            </div>
                                            <ChevronRight
                                                size={14}
                                                className={twMerge(
                                                    'shrink-0 mt-1.5 transition-opacity',
                                                    isActive ? 'text-indigo-400 opacity-100' : 'text-slate-700 opacity-0 group-hover:opacity-100'
                                                )}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* User card */}
                <div className="p-3 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.username || 'User'}</p>
                            <p className="text-xs text-slate-500">Student</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ═══ MAIN AREA ═══ */}
            <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
                {/* Subtle ambient glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="relative z-10 h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm px-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <Sparkles size={15} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-sm leading-tight">AI Academic Tutor</h1>
                            <p className="text-slate-500 text-xs">
                                {currentSessionId ? `Active session` : 'Start a new conversation'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {messages.length > 0 && (
                            <button
                                onClick={startNewChat}
                                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <RotateCcw size={12} /> New Chat
                            </button>
                        )}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-emerald-400 text-[11px] font-semibold">Live</span>
                        </div>
                    </div>
                </div>

                {/* Messages or welcome */}
                <div className="flex-1 overflow-y-auto relative z-10">
                    {messages.length === 0 ? (
                        // ─── Welcome screen ───
                        <div className="h-full flex flex-col items-center justify-center px-6 py-10">
                            <div className="max-w-2xl w-full text-center">
                                {/* Hero icon */}
                                <div className="relative inline-block mb-6">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                                        <GraduationCap size={36} className="text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                                        <Sparkles size={11} className="text-white" />
                                    </div>
                                </div>

                                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                                    Hello, {user?.username || 'Learner'}! 👋
                                </h2>
                                <p className="text-slate-400 text-base leading-relaxed max-w-md mx-auto mb-10">
                                    I'm your personal AI study companion. Ask me about concepts, code, study plans, or anything you want to learn.
                                </p>

                                {/* Suggestion grid */}
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Try asking me…</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                    {SUGGESTIONS.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(s.text)}
                                            className="flex items-start gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-xl transition-all duration-200 group active:scale-[0.98]"
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200`}
                                            >
                                                <s.icon size={16} className="text-white" />
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium leading-snug pt-1 group-hover:text-white transition-colors">
                                                {s.text}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // ─── Chat messages ───
                        <div className="flex flex-col gap-5 px-5 py-6 max-w-3xl mx-auto w-full">
                            {messages.map((msg, idx) => (
                                <ChatBubble key={idx} msg={msg} />
                            ))}
                            {isLoading && <TypingDots />}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {/* Input bar */}
                <div className="relative z-10 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm px-5 py-4 shrink-0">
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto">
                        <div className="flex items-end gap-2 bg-slate-800 border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 rounded-2xl px-4 py-2.5 transition-all duration-200 shadow-lg">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                placeholder="Ask anything — concepts, code, study plans…"
                                className="flex-1 bg-transparent text-white placeholder-slate-500 text-[15px] resize-none outline-none leading-relaxed min-h-[26px] max-h-[150px] py-1"
                                value={input}
                                onChange={handleTextareaChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-all duration-150 active:scale-90 shadow-lg shadow-indigo-600/25 disabled:shadow-none shrink-0"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                        <p className="text-center text-slate-600 text-[11px] mt-2 font-medium">
                            <kbd className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-slate-400 font-mono text-[10px]">Enter</kbd> to send
                            <span className="mx-1.5">·</span>
                            <kbd className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-slate-400 font-mono text-[10px]">Shift + Enter</kbd> for new line
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AITutorChat;
