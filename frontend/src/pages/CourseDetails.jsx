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
    ChevronDown,
    ChevronUp,
    Mic,
    Trash2,
    Volume2,
    Lock
} from 'lucide-react';
import SmartMarkdown from '../components/ui/SmartMarkdown';
import VoiceInputButton from '../components/chat/VoiceInputButton';
import TTSButton from '../components/ui/TTSButton';

const CourseDetails = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [progressRecords, setProgressRecords] = useState([]);
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
            const [courseRes, lessonsRes, progressRes] = await Promise.all([
                api.get(`/courses/${courseId}`),
                api.get(`/courses/${courseId}/lessons`).catch(() => ({ data: [] })),
                api.get('/progress').catch(() => ({ data: [] }))
            ]);

            setCourse(courseRes.data);
            setLessons(lessonsRes.data);
            setProgressRecords(progressRes.data);
            setManualPlan(courseRes.data.course_plan || '');
        } catch (error) {
            console.error('Error fetching course data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate actual progress percentage
    const calculateProgress = () => {
        if (!lessons.length) return 0;
        const completed = lessons.filter(l => l.status === 'completed').length;
        return Math.round((completed / lessons.length) * 100);
    };

    const courseProgress = calculateProgress();

    const handleInstall = async () => {
        setInstalling(true);
        try {
            const response = await api.post(`/courses/${courseId}/install`);
            setLessons(response.data);
            const courseRes = await api.get(`/courses/${courseId}`);
            setCourse(courseRes.data);
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
            const formData = new FormData();
            formData.append('prompt', aiPrompt);
            if (sessionId) {
                formData.append('session_id', sessionId);
            }
            const response = await api.put(`/courses/${courseId}/plans/ai`, formData);
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

    const handleVoiceComplete = async (blob) => {
        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append('audio_file', blob, 'voice_input.webm');
            if (sessionId) formData.append('session_id', sessionId);

            const response = await api.put(`/courses/${courseId}/plans/ai`, formData);
            setCourse(response.data);
            setManualPlan(response.data.course_plan);
            setAiPrompt('');
            if (response.data.session_id) setSessionId(response.data.session_id);
        } catch (error) {
            console.error('Voice AI Update failed:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

        setIsUpdating(true);
        try {
            await api.delete(`/courses/${courseId}`);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('Failed to delete course. Please try again.');
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
                            <div className="flex-1"></div>
                            <button
                                onClick={handleDeleteCourse}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all font-bold uppercase tracking-widest text-[10px]"
                                disabled={isUpdating}
                                title="Delete Course"
                            >
                                <Trash2 size={14} /> Delete Path
                            </button>
                        </div>
                        <h1 className="text-5xl font-display font-bold text-white mb-6 leading-tight">{course.title}</h1>
                        <p className="text-slate-400 text-xl leading-relaxed max-w-3xl">
                            {course.description || 'Architecting your path to mastery...'}
                        </p>
                    </section>

                    {/* Course Architecture Refinement (Hackathon-Winning Layout) */}
                    <section className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Sparkles className="text-indigo-400 animate-pulse" size={24} /> Course Blueprint
                            </h2>
                            <button
                                onClick={() => setShowPlan(!showPlan)}
                                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-all text-xs font-bold uppercase tracking-[0.2em] group"
                            >
                                {showPlan ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                <span className="group-hover:translate-x-1 transition-transform">{showPlan ? 'Hide Draft' : 'View Blueprint'}</span>
                            </button>
                        </div>

                        {/* Blueprint Visualization */}
                        <div className="p-8 space-y-8">
                            {showPlan && (
                                <div className="p-8 bg-slate-950/60 rounded-[2rem] border border-white/5 animate-in zoom-in-95 fade-in duration-500 shadow-inner relative group">
                                    <div className="prose prose-invert prose-indigo max-w-none 
                                        prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
                                        prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-indigo-400 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/5
                                        prose-p:text-slate-400 prose-p:leading-relaxed
                                        prose-li:text-slate-400 prose-code:text-indigo-300
                                    ">
                                        <SmartMarkdown>
                                            {manualPlan || course.course_plan || "*No learning plan available yet.*"}
                                        </SmartMarkdown>
                                    </div>
                                    {course.course_plan && (
                                        <div className="flex justify-end mt-6 pt-4 border-t border-white/5">
                                            <TTSButton text={course.course_plan} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Refinement Controls (BELOW the blueprint) - Only show if not deployed */}
                            {lessons.length === 0 && (
                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex flex-wrap gap-4 items-center mb-6">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-4">
                                            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></div>
                                            Architectural Refinement
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setIsEditingAi(!isEditingAi); setIsEditingDirect(false); }}
                                            className={`gap-2 rounded-xl transition-all ${isEditingAi ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/5'}`}
                                        >
                                            <Wand2 size={16} /> Refine with AI
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setIsEditingDirect(!isEditingDirect); setIsEditingAi(false); }}
                                            className={`gap-2 rounded-xl transition-all ${isEditingDirect ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/5'}`}
                                        >
                                            <Edit3 size={16} /> Manual Blueprint Edit
                                        </Button>
                                    </div>

                                    {/* AI Refinement Panel */}
                                    {isEditingAi && (
                                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl animate-in slide-in-from-bottom-4 duration-300">
                                            <form onSubmit={handleAiUpdate} className="relative group">
                                                <textarea
                                                    placeholder="Ask the AI Architect to add, remove, or modify topics..."
                                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 pl-6 pr-40 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-xl resize-none min-h-[64px] max-h-[300px] custom-scrollbar overflow-y-auto"
                                                    value={aiPrompt}
                                                    onChange={(e) => {
                                                        setAiPrompt(e.target.value);
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleAiUpdate(e);
                                                        }
                                                    }}
                                                    disabled={isUpdating}
                                                    rows={1}
                                                />
                                                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                                                    <VoiceInputButton
                                                        onRecordingComplete={handleVoiceComplete}
                                                        isDisabled={isUpdating}
                                                    />
                                                    <Button type="submit" disabled={isUpdating || !aiPrompt.trim()} className="h-10 px-8 rounded-xl gap-2 font-bold uppercase tracking-widest text-xs">
                                                        {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Process Update'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Direct Edit Panel */}
                                    {isEditingDirect && (
                                        <div className="p-6 bg-slate-950/80 border border-white/10 rounded-3xl animate-in slide-in-from-bottom-4 duration-300">
                                            <textarea
                                                className="w-full min-h-[320px] bg-slate-950 border border-white/10 rounded-2xl p-6 text-slate-300 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-xl custom-scrollbar overflow-y-auto"
                                                value={manualPlan}
                                                onChange={(e) => {
                                                    setManualPlan(e.target.value);
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = Math.max(320, e.target.scrollHeight) + 'px';
                                                }}
                                                disabled={isUpdating}
                                            />
                                            <div className="flex justify-end gap-3 pt-4">
                                                <Button variant="outline" size="sm" onClick={() => setIsEditingDirect(false)}>Cancel</Button>
                                                <Button onClick={handleDirectUpdate} disabled={isUpdating} className="gap-2 px-8 rounded-xl font-bold uppercase tracking-widest text-xs">
                                                    {isUpdating ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save & Apply Blueprint</>}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
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
                                {lessons.map((lesson, index) => {
                                    const progress = progressRecords.find(p => p.lesson_id === lesson.id);
                                    const isLessonLocked = lesson.is_locked && lesson.status !== 'completed';

                                    return (
                                        <Card
                                            key={lesson.id}
                                            className={`flex items-center justify-between py-5 px-8 group transition-all ${isLessonLocked
                                                    ? 'opacity-60 cursor-not-allowed'
                                                    : 'cursor-pointer hover:bg-white/[0.02]'
                                                }`}
                                            onClick={() => !isLessonLocked && navigate(`/lessons/${lesson.id}`)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors text-lg">{lesson.title}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lesson {lesson.day_number}</p>
                                                        {progress && (
                                                            <>
                                                                <div className="h-2 w-2 rounded-full bg-slate-800"></div>
                                                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Score: {progress.quiz_score}%</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${lesson.status === 'completed' ? 'text-emerald-500' :
                                                        lesson.status === 'in_progress' ? 'text-amber-500' :
                                                            'text-slate-500'
                                                    }`}>
                                                    {lesson.status === 'completed' ? <CheckCircle2 size={18} /> :
                                                        lesson.status === 'in_progress' ? <Circle size={18} className="fill-amber-500/20" /> :
                                                            <Circle size={18} />}
                                                    {lesson.status ? lesson.status.replace('_', ' ') : 'Not Started'}
                                                </div>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLessonLocked
                                                        ? 'bg-slate-900 border border-white/5 text-slate-600'
                                                        : 'bg-white/5 group-hover:bg-indigo-500 group-hover:text-white text-slate-400'
                                                    }`}>
                                                    {isLessonLocked ? <Lock size={16} /> : <Play className="ml-1" size={18} fill="currentColor" />}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
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
                                    <span className="text-4xl font-display font-bold text-white">{courseProgress}%</span>
                                </div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Target 100%</span>
                            </div>
                            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden ring-4 ring-white/[0.02]">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                    style={{ width: `${courseProgress}%` }}
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
