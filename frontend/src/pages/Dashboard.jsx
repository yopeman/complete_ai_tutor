import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Sparkles,
    BookOpen,
    Trophy,
    Layers,
    BrainCircuit,
    MessageSquare,
    ChevronRight,
    Loader2,
    Play,
    CheckCircle2,
    Zap,
    TrendingUp,
    Target,
    Clock,
    Flame,
    ArrowRight
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Data States
    const [courses, setCourses] = useState([]);
    const [progressRecords, setProgressRecords] = useState([]);
    const [flashcardCount, setFlashcardCount] = useState(0);
    const [stats, setStats] = useState({
        totalCourses: 0,
        completedLessons: 0,
        averageScore: 0,
        inProgressCourses: 0
    });
    const [continueLesson, setContinueLesson] = useState(null);
    const [continueCourse, setContinueCourse] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [coursesRes, progressRes, flashcardsRes] = await Promise.all([
                api.get('/courses'),
                api.get('/progress').catch(() => ({ data: [] })),
                api.get('/flashcards').catch(() => ({ data: [] }))
            ]);

            const courseList = coursesRes.data;
            const progress = progressRes.data;
            const flashcards = flashcardsRes.data;

            setFlashcardCount(Array.isArray(flashcards) ? flashcards.length : 0);
            setProgressRecords(progress.slice(0, 5));

            // Enrich courses with lesson data
            const enrichedCourses = await Promise.all(courseList.map(async (course) => {
                try {
                    const lessonsRes = await api.get(`/courses/${course.id}/lessons`);
                    const lessons = lessonsRes.data || [];
                    const total = lessons.length;
                    const completed = lessons.filter(l => l.status === 'completed').length;
                    const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

                    // Find first incomplete lesson for resume
                    const firstIncomplete = lessons.find(l => l.status !== 'completed' && !l.is_locked);

                    return { ...course, lessons, progressPct, completedCount: completed, totalLessons: total, firstIncompleteLesson: firstIncomplete };
                } catch {
                    return { ...course, lessons: [], progressPct: 0, completedCount: 0, totalLessons: 0, firstIncompleteLesson: null };
                }
            }));

            setCourses(enrichedCourses);

            // Stats
            const totalCompleted = enrichedCourses.reduce((acc, c) => acc + c.completedCount, 0);
            const totalScore = progress.reduce((acc, p) => acc + (p.quiz_score || 0), 0);
            const avgScore = progress.length > 0 ? Math.round(totalScore / progress.length) : 0;
            const inProgress = enrichedCourses.filter(c => c.progressPct > 0 && c.progressPct < 100).length;

            setStats({
                totalCourses: courseList.length,
                completedLessons: totalCompleted,
                averageScore: avgScore,
                inProgressCourses: inProgress
            });

            // Continue Learning: find the most recent in-progress course
            const activeCourse = enrichedCourses.find(c => c.firstIncompleteLesson);
            if (activeCourse) {
                setContinueCourse(activeCourse);
                setContinueLesson(activeCourse.firstIncompleteLesson);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const greetingTime = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const recentCourses = [...courses].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
    const completedCourses = courses.filter(c => c.progressPct === 100).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <p className="text-slate-400 font-medium animate-pulse">Loading your command center...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* ═══ Welcome Hero + Continue Learning ═══ */}
            <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-white/5 shadow-2xl p-1 lg:p-2">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] -mr-40 -mt-40"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

                <div className="relative z-10 bg-slate-950/80 backdrop-blur-2xl rounded-[2.8rem] p-10 lg:p-14 border border-white/10 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                                <Flame size={14} className="animate-pulse" /> Command Center
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-display font-bold text-white leading-tight">
                                {greetingTime()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{user?.username || 'Learner'}</span>
                            </h1>
                            <p className="text-slate-400 text-lg max-w-xl">
                                {continueLesson
                                    ? "Pick up right where you left off. Your next lesson is ready."
                                    : courses.length > 0
                                        ? "All caught up! Start a new course to keep learning."
                                        : "Welcome aboard! Create your first course to begin your journey."
                                }
                            </p>
                        </div>

                        {/* Continue Learning CTA */}
                        {continueLesson && continueCourse && (
                            <div
                                onClick={() => navigate(`/lessons/${continueLesson.id}`)}
                                className="w-full lg:w-auto min-w-[320px] p-6 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/30 rounded-[2rem] cursor-pointer hover:border-indigo-400/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-all duration-500 group"
                            >
                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">
                                    <Play size={12} fill="currentColor" /> Continue Learning
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                                    {continueLesson.title}
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    {continueCourse.title}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden mr-4">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${continueCourse.progressPct}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-400">{continueCourse.progressPct}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ═══ Stats Strip ═══ */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: BookOpen, label: 'Total Courses', value: stats.totalCourses, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                    { icon: CheckCircle2, label: 'Lessons Completed', value: stats.completedLessons, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    { icon: Trophy, label: 'Avg. Mastery', value: `${stats.averageScore}%`, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                    { icon: Layers, label: 'Flashcards', value: flashcardCount, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
                ].map((stat, idx) => (
                    <Card key={idx} className={`p-6 ${stat.bg} ${stat.border} border backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}>
                        <div className={`${stat.color} mb-3`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="text-3xl font-display font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                    </Card>
                ))}
            </section>

            {/* ═══ Quick Actions ═══ */}
            <section>
                <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <Zap className="text-amber-400" size={22} /> Quick Actions
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Sparkles, label: 'New Course', desc: 'Generate with AI', path: '/courses', gradient: 'from-indigo-600 to-violet-600', shadow: 'shadow-indigo-500/20' },
                        { icon: MessageSquare, label: 'AI Tutor Chat', desc: 'Ask anything', path: '/chat', gradient: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/20' },
                        { icon: Layers, label: 'Flashcards', desc: 'Study & review', path: '/flashcards', gradient: 'from-violet-600 to-purple-600', shadow: 'shadow-violet-500/20' },
                        { icon: TrendingUp, label: 'Progress', desc: 'View analytics', path: '/progress', gradient: 'from-amber-600 to-orange-600', shadow: 'shadow-amber-500/20' },
                    ].map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigate(action.path)}
                            className={`group p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 text-left active:scale-[0.98]`}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg ${action.shadow} group-hover:scale-110 transition-transform duration-300`}>
                                <action.icon size={22} className="text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{action.label}</h3>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{action.desc}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* ═══ Active Courses + Recent Activity ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Active Courses */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <Target className="text-indigo-400" size={22} /> Recent Courses
                        </h2>
                        {courses.length > 0 && (
                            <button
                                onClick={() => navigate('/courses')}
                                className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors group"
                            >
                                View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>

                    {recentCourses.length > 0 ? (
                        <div className="space-y-4">
                            {recentCourses.map(course => (
                                <Card
                                    key={course.id}
                                    className="p-6 hover:bg-white/[0.02] transition-all group cursor-pointer"
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                                <BrainCircuit size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{course.title}</h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                                    {course.completedCount} of {course.totalLessons} lessons • {course.estimated_duration_days || '--'} day program
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xl font-display font-bold text-white">{course.progressPct}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden ring-1 ring-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                            style={{ width: `${course.progressPct}%` }}
                                        ></div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : courses.length > 0 ? (
                        <Card className="p-10 text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="text-emerald-400" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">All Caught Up!</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                {completedCourses > 0
                                    ? `You've completed ${completedCourses} course${completedCourses > 1 ? 's' : ''}. Start a new one to keep learning!`
                                    : "Your courses haven't been started yet. Jump in!"
                                }
                            </p>
                            <Button onClick={() => navigate('/courses')} className="gap-2 rounded-xl">
                                <Sparkles size={16} /> Create New Course
                            </Button>
                        </Card>
                    ) : (
                        <Card className="p-10 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="text-slate-600" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No Courses Yet</h3>
                            <p className="text-slate-500 text-sm mb-6">Create your first AI-powered course to get started.</p>
                            <Button onClick={() => navigate('/courses')} className="gap-2 rounded-xl">
                                <Sparkles size={16} /> Create Your First Course
                            </Button>
                        </Card>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Clock className="text-amber-400" size={22} /> Recent Activity
                    </h2>

                    <Card className="p-6">
                        {progressRecords.length > 0 ? (
                            <div className="space-y-8 relative">
                                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-800"></div>
                                {progressRecords.map((record, idx) => (
                                    <div key={idx} className="relative flex gap-5">
                                        <div className={`w-8 h-8 rounded-full border-2 border-slate-950 flex items-center justify-center shrink-0 z-10 ${record.is_passed
                                            ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                            : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                                            }`}>
                                            <CheckCircle2 size={14} className="text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-white leading-tight">Quiz Evaluation</h4>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                {record.is_passed ? 'Passed' : 'Needs Review'} • {record.quiz_score}%
                                            </p>
                                            <p className="text-[10px] text-indigo-400/50 uppercase tracking-widest font-bold">
                                                {new Date(record.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center opacity-40">
                                <TrendingUp size={40} className="mx-auto mb-3" />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No activity yet</p>
                                <p className="text-[10px] text-slate-600 mt-1">Complete lessons to see your progress here.</p>
                            </div>
                        )}
                    </Card>

                    {/* Motivational Card */}
                    <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group border-0">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                                <Flame className="text-white" size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Keep the Momentum</h3>
                            <p className="text-indigo-100/70 text-sm leading-relaxed mb-6">
                                Consistency is key to mastery. Complete a lesson today to maintain your streak!
                            </p>
                            <Button
                                onClick={() => continueLesson ? navigate(`/lessons/${continueLesson.id}`) : navigate('/courses')}
                                className="w-full bg-white text-indigo-600 hover:bg-slate-100 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                            >
                                {continueLesson ? 'Resume Learning' : 'Start Learning'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
