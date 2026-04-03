import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

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

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.get(`/lessons/${lessonId}/complete`);
      navigate(`/courses/${lesson.course_id}`);
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
    <div className="flex flex-col min-h-screen -mt-8 -mx-8 relative">
      {/* Top Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
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
        <div className="flex-1 overflow-y-auto p-10 bg-slate-900 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent">
          <div className="max-w-3xl mx-auto prose prose-invert prose-indigo prose-lg dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.content || '# Generating Content...\n\nPlease wait while the AI Tutor creates your lesson for this topic.'}
            </ReactMarkdown>
          </div>
        </div>

        {/* Right: AI Panel (Phase 6 Sidebar Context) */}
        <div className="w-[400px] border-l border-slate-800 bg-slate-800/20 backdrop-blur-3xl hidden xl:flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <BrainCircuit className="text-indigo-400" size={20} /> AI Study Assistant
            </h3>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
              <MessageSquare size={24} />
            </div>
            <p className="text-sm text-slate-500 max-w-[200px]">
              Coming soon: Real-time contextual chat with your AI Tutor about this lesson.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="h-16 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest group">
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Prev
        </button>
        <button className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-bold uppercase tracking-widest group">
          Next <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default LessonPlayer;
