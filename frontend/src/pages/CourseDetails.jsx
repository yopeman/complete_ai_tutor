import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
    ArrowLeft,
    Play,
    CheckCircle2,
    Circle,
    Download,
    Loader2,
    Sparkles,
    BookOpen,
    Calendar,
    Edit3,
    Wand2,
    Save,
    RotateCcw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CourseDetails = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);

    // Refinement States
    const [isEditingAi, setIsEditingAi] = useState(false);
    const [isEditingDirect, setIsEditingDirect] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [manualPlan, setManualPlan] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPlan, setShowPlan] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    const fetchCourseData = async () => {
        setLoading(true);
        try {
            const [courseRes, lessonsRes] = await Promise.all([
                api.get(`/courses/${courseId}`),
                api.get(`/courses/${courseId}/lessons`).catch(() => ({ data: [] }))
            ]);
            setCourse(courseRes.data);
            setLessons(lessonsRes.data);
            setManualPlan(courseRes.data.course_plan || '');
        } catch (error) {
            console.error('Error fetching course data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInstall = async () => {
        setInstalling(true);
        try {
            const response = await api.post(`/courses/${courseId}/install`);
            // Update lessons with the response from installation
            setLessons(response.data);
            // Refresh course details to update status (e.g., from 'Draft' to 'Published')
            const courseRes = await api.get(`/courses/${courseId}`);
            setCourse(courseRes.data);
            // No redirect, stay on the page to show the newly generated syllabus
        } catch (error) {
            console.error('Installation failed:', error);
        } finally {
            setInstalling(false);
        }
    };

    const handleAiUpdate = async (e) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;
        setIsUpdating(true);
        try {
            const response = await api.put(`/courses/${courseId}/plans/ai`, {
                prompt: aiPrompt,
                session_id: sessionId
            });
            setCourse(response.data);
            setManualPlan(response.data.course_plan);
            setAiPrompt('');
            if (response.data.session_id) setSessionId(response.data.session_id);
            // Optionally close editor or keep it open for "again and again"
        } catch (error) {
            console.error('AI Update failed:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDirectUpdate = async () => {
        setIsUpdating(true);
        try {
            const response = await api.put(`/courses/${courseId}/plans/direct`, {
                course_plan: manualPlan
            });
            setCourse(response.data);
            setIsEditingDirect(false);
        } catch (error) {
            console.error('Direct Update failed:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="text-slate-400 animate-pulse">Loading architect details...</p>
            </div>
        );
    }

    if (!course) return <div className="text-white">Course not found.</div>;

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium text-sm">Dashboard</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Header Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${course.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                {course.status || 'Draft'}
                            </span>
                            <div className="h-4 w-px bg-slate-800"></div>
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                <Calendar size={12} /> {course.estimated_duration_days || '--'} Day Program
                            </div>
                        </div>
                        <h1 className="text-5xl font-display font-bold text-white mb-6 leading-tight">{course.title}</h1>
                        <p className="text-slate-400 text-xl leading-relaxed max-w-3xl">
                            {course.description || 'Architecting your path to mastery...'}
                        </p>
                    </section>

                    {/* Course Architecture Refinement (New Feature) */}
                    <section className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Sparkles className="text-indigo-400" size={24} /> Course Architecture
                            </h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setIsEditingAi(!isEditingAi); setIsEditingDirect(false); }}
                                    className={`gap-2 ${isEditingAi ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : ''}`}
                                >
                                    <Wand2 size={16} /> Refine with AI
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setIsEditingDirect(!isEditingDirect); setIsEditingAi(false); }}
                                    className={`gap-2 ${isEditingDirect ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : ''}`}
                                >
                                    <Edit3 size={16} /> Manual Edit
                                </Button>
                            </div>
                        </div>

                        {/* AI Refinement Panel */}
                        {isEditingAi && (
                            <div className="p-8 bg-indigo-500/5 border-b border-white/5 animate-in slide-in-from-top-4 duration-300">
                                <form onSubmit={handleAiUpdate} className="space-y-4">
                                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest">How should we improve this course?</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="e.g. Add more focus on advanced async patterns or make it intensive for 3 days..."
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-5 pr-32 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            disabled={isUpdating}
                                        />
                                        <div className="absolute right-2 top-2 bottom-2">
                                            <Button type="submit" disabled={isUpdating || !aiPrompt.trim()} className="h-full px-6 rounded-xl gap-2 shadow-lg">
                                                {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={16} /> Refine</>}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Direct Edit Panel */}
                        {isEditingDirect && (
                            <div className="p-8 bg-slate-950/50 border-b border-white/5 animate-in slide-in-from-top-4 duration-300">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manual Markdown Course Plan</label>
                                    <textarea
                                        className="w-full h-80 bg-slate-950 border border-white/10 rounded-2xl p-6 text-slate-300 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        value={manualPlan}
                                        onChange={(e) => setManualPlan(e.target.value)}
                                        disabled={isUpdating}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" onClick={() => setIsEditingDirect(false)}>Cancel</Button>
                                        <Button onClick={handleDirectUpdate} disabled={isUpdating} className="gap-2 px-8">
                                            {isUpdating ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Plan</>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-8">
                            <button
                                onClick={() => setShowPlan(!showPlan)}
                                className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-4"
                            >
                                {showPlan ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {showPlan ? 'Hide Blueprint' : 'View Architecture Blueprint'}
                            </button>

                            {showPlan && (
                                <div className="p-8 bg-slate-950/40 rounded-[2.5rem] border border-white/5 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden shadow-inner">
                                    <div className="prose prose-invert prose-indigo max-w-none 
                                        prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
                                        prose-h1:text-3xl prose-h1:mb-8 prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-indigo-400 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/5
                                        prose-p:text-slate-400 prose-p:leading-relaxed prose-p:mb-6
                                        prose-ul:list-disc prose-ul:pl-6 prose-li:text-slate-400 prose-li:my-2
                                        prose-strong:text-white prose-strong:font-bold
                                        prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                                    ">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{course.course_plan || "*No blueprint drafted.*"}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Lessons Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <BookOpen className="text-indigo-400" /> Syllabus Content
                        </h2>

                        {lessons.length > 0 ? (
                            <div className="space-y-4">
                                {lessons.map((lesson, index) => (
                                    <Card
                                        key={lesson.id}
                                        className="flex items-center justify-between py-5 px-8 group cursor-pointer hover:bg-white/[0.02]"
                                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors text-lg">{lesson.title}</h4>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Lesson {lesson.day_number}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            {lesson.status === 'completed' ? (
                                                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest">
                                                    <CheckCircle2 size={18} /> Done
                                                </div>
                                            ) : (
                                                <Circle className="text-slate-800" size={20} />
                                            )}
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                <Play className="text-slate-400 group-hover:text-white" size={18} fill="currentColor" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 border-2 border-dashed border-white/5 rounded-[2.5rem] p-16 text-center">
                                <Sparkles className="text-indigo-500/20 mx-auto mb-6" size={64} />
                                <h3 className="text-2xl font-bold text-white mb-3">Syllabus Not Installed</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-10 text-lg">
                                    The architecture is ready. Deploy the syllabus content to begin your learning journey.
                                </p>
                                <Button
                                    onClick={handleInstall}
                                    disabled={installing}
                                    className="gap-3 px-10 py-6 text-lg rounded-2xl shadow-2xl shadow-indigo-500/20"
                                >
                                    {installing ? <Loader2 className="animate-spin" /> : <Download size={22} />}
                                    Deploy Learning Content
                                </Button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    <Card className="bg-indigo-600/5 border-indigo-500/20 p-8">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl mb-6 flex items-center justify-center">
                            <Sparkles className="text-indigo-400" size={24} />
                        </div>
                        <h3 className="font-bold text-white text-lg mb-4">Architectural Logic</h3>
                        <p className="text-slate-400 leading-relaxed italic text-sm">
                            "This course is architected with a focus on cross-disciplinary insights. Each module is strategically paced to ensure conceptual continuity and maximum retention."
                        </p>
                    </Card>

                    <Card className="p-8">
                        <h3 className="font-bold text-white text-lg mb-6 border-b border-white/5 pb-4">Course Vitals</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Lessons</div>
                                <div className="text-white font-bold">{lessons.length || '--'}</div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Global Rank</div>
                                <div className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Alpha Phase</div>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/5">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Your Mastery</p>
                                    <span className="text-4xl font-display font-bold text-white">{course.progress || 0}%</span>
                                </div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Target 100%</span>
                            </div>
                            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden ring-4 ring-white/[0.02]">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                    style={{ width: `${course.progress || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
