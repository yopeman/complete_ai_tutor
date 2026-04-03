import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
    BrainCircuit,
    Trophy,
    BookOpen,
    Target,
    CheckCircle2,
    Zap,
    TrendingUp,
    Calendar,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Progress = () => {
    const [stats, setStats] = useState({
        totalCourses: 0,
        completedLessons: 0,
        averageScore: 0,
        totalPoints: 0
    });
    const [courseProgress, setCourseProgress] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProgressData();
    }, []);

    const fetchProgressData = async () => {
        setLoading(true);
        try {
            const [coursesRes, progressRes] = await Promise.all([
                api.get('/courses'),
                api.get('/progress')
            ]);

            const courses = coursesRes.data;
            const progress = progressRes.data;

            // Calculate Global Stats
            const totalScore = progress.reduce((acc, curr) => acc + (curr.quiz_score || 0), 0);
            const avgScore = progress.length > 0 ? Math.round(totalScore / progress.length) : 0;

            setStats({
                totalCourses: courses.length,
                completedLessons: progress.length,
                averageScore: avgScore,
                totalPoints: progress.length * 100 // Simplified gamification
            });

            // Calculate Progress per Course
            const courseDetails = await Promise.all(courses.map(async (course) => {
                const lessonsRes = await api.get(`/courses/${course.id}/lessons`);
                const lessons = lessonsRes.data;
                const completed = lessons.filter(l => l.status === 'completed').length;
                const percentage = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;

                // Get avg score for this course
                const lessonIds = lessons.map(l => l.id);
                const courseProgressRecords = progress.filter(p => lessonIds.includes(p.lesson_id));
                const courseAvg = courseProgressRecords.length > 0
                    ? Math.round(courseProgressRecords.reduce((a, b) => a + b.quiz_score, 0) / courseProgressRecords.length)
                    : 0;

                return {
                    ...course,
                    percentage,
                    averageScore: courseAvg,
                    lessonCount: lessons.length,
                    completedCount: completed
                };
            }));

            setCourseProgress(courseDetails);

            // Recent Activity
            const activity = progress.slice(0, 5).map(p => {
                return {
                    ...p,
                    date: new Date(p.created_at).toLocaleDateString(),
                    type: 'quiz_passed'
                };
            });
            setRecentActivity(activity);

        } catch (error) {
            console.error('Error fetching progress data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="text-slate-400 animate-pulse font-bold tracking-widest uppercase text-xs">Analyzing Progress...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header / Global Analytics */}
            <section className="relative p-1 rounded-[3rem] bg-slate-900 border border-white/5 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="relative z-10 bg-slate-950/40 backdrop-blur-3xl rounded-[2.8rem] p-10 lg:p-14">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                                <TrendingUp size={14} /> Performance Analytics v1.0
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-display font-bold text-white">Your Mastery Journey</h1>
                            <p className="text-slate-400 text-lg lg:text-xl max-w-xl">
                                Tracking your evolution across {stats.totalCourses} academic blueprints and {stats.completedLessons} mastery units.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                                <div className="text-indigo-400 mb-2"><Trophy size={24} /></div>
                                <div className="text-3xl font-display font-bold text-white">{stats.averageScore}%</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Mastery</div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                                <div className="text-emerald-400 mb-2"><Zap size={24} /></div>
                                <div className="text-3xl font-display font-bold text-white">{stats.totalPoints}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Credits</div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                                <div className="text-amber-400 mb-2"><CheckCircle2 size={24} /></div>
                                <div className="text-3xl font-display font-bold text-white">{stats.completedLessons}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Units Passed</div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                                <div className="text-indigo-400 mb-2"><BookOpen size={24} /></div>
                                <div className="text-3xl font-display font-bold text-white">{stats.totalCourses}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Architects</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Detailed Course Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Target className="text-indigo-400" /> Blueprint Performance
                    </h2>

                    <div className="space-y-4">
                        {courseProgress.map((course) => (
                            <Card key={course.id} className="p-8 hover:bg-white/[0.02] transition-all group cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                                            <BrainCircuit size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight mb-1">{course.title}</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                                {course.completedCount} of {course.lessonCount} Modules Completed
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-display font-bold text-white">{course.percentage}%</div>
                                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Overall Progress</div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden ring-1 ring-white/5 shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                            style={{ width: `${course.percentage}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[10px] font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            Avg Quiz Mastery: <span className="text-white">{course.averageScore}%</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-indigo-400 group-hover:gap-3 transition-all">
                                            Continue Blueprint <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Calendar className="text-amber-400" /> Recent Activity
                    </h2>

                    <Card className="p-8">
                        {recentActivity.length > 0 ? (
                            <div className="space-y-10 relative">
                                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-800"></div>
                                {recentActivity.map((act, idx) => (
                                    <div key={idx} className="relative flex gap-6">
                                        <div className={`w-8 h-8 rounded-full border-2 border-slate-950 flex items-center justify-center shrink-0 z-10 transition-all ${act.is_passed ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}>
                                            <CheckCircle2 size={16} className="text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-white leading-tight">Mastery Unit Evaluation</h4>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                Quiz Passed • {act.quiz_score}% Score
                                            </p>
                                            <p className="text-[10px] text-indigo-400/50 uppercase tracking-widest font-bold">{act.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center opacity-30">
                                <TrendingUp size={48} className="mx-auto mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">No activity recorded</p>
                            </div>
                        )}

                        <div className="mt-10 pt-10 border-t border-white/5 text-center">
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">End of History</p>
                        </div>
                    </Card>

                    <Card className="bg-indigo-600 p-8 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <h3 className="text-xl font-bold text-white mb-2 relative z-10">Study Goal</h3>
                        <p className="text-indigo-100/70 text-sm leading-relaxed mb-6 relative z-10">Keep a 100% pass rate to maintain your Alpha Rank.</p>
                        <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 rounded-xl font-bold uppercase tracking-widest text-[10px] relative z-10" onClick={() => navigate('/dashboard')}>Back to Architect</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Progress;
