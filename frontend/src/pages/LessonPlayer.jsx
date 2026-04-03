import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  Loader2,
  BrainCircuit,
  Sparkles,
  Send,
  User as UserIcon,
  RotateCcw
} from 'lucide-react';

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Chat States
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const sessionId = `lesson_${lessonId}`;

  useEffect(() => {
    fetchLesson();
    fetchChatHistory();
  }, [lessonId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/lessons/${lessonId}`);
      setLesson(response.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await api.get(`/chats?session_id=${sessionId}`);
      // The backend returns chats in reverse chronological order
      const history = response.data.reverse().map(chat => ([
        { role: 'user', content: chat.prompt },
        { role: 'assistant', content: chat.response }
      ])).flat();
      setMessages(history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/chats', {
        prompt: input,
        session_id: sessionId
      });

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.get(`/lessons/${lessonId}/complete`);
      const res = await api.get(`/lessons/${lessonId}`);
      setLesson(res.data);
    } catch (error) {
      console.error('Completion failed:', error);
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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Module {lesson.order || 1}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={lesson.is_completed ? 'secondary' : 'primary'}
            size="sm"
            className="gap-2 h-9"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? <Loader2 className="animate-spin" size={16} /> : (
              lesson.is_completed ? <><CheckCircle2 size={16} className="text-emerald-400" /> Completed</> : 'Mark Complete'
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
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-100 rounded-tr-none'
                    : 'bg-slate-800/50 border border-white/5 text-slate-300 rounded-tl-none prose prose-invert prose-sm max-w-none'
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
            <form onSubmit={handleSendMessage} className="relative group">
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
            </form>
            <p className="mt-3 text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest">
              Contextual AI Assistant Active
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="h-20 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-10 flex items-center justify-between shrink-0 z-20">
        <button className="flex items-center gap-3 text-slate-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest group">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Previous
        </button>

        <div className="flex items-center gap-6">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest hidden sm:block">
            Course Progress: {lesson.course_progress || 0}%
          </div>
        </div>

        <button className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300 transition-all text-xs font-bold uppercase tracking-widest group">
          Next
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default LessonPlayer;
