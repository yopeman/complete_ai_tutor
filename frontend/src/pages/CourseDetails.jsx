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
    Calendar
} from 'lucide-react';

const CourseDetails = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);

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
            setLessons(response.data);
            // Refresh course to update status if needed
            const courseRes = await api.get(`/courses/${courseId}`);
            setCourse(courseRes.data);
        } catch (error) {
            console.error('Installation failed:', error);
        } finally {
            setInstalling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="text-slate-400 animate-pulse">Loading course architect details...</p>
            </div>
        );
    }

    if (!course) return <div className="text-white">Course not found.</div>;

    return (
        <div className="space-y-8 pb-20">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Course Info */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                {course.status || 'Draft'}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                <Calendar size={14} /> Created {new Date().toLocaleDateString()}
                            </div>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-white mb-4">{course.title}</h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            {course.description || 'No description provided for this AI-generated course.'}
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <BookOpen className="text-indigo-400" /> Curriculum
                        </h2>

                        {lessons.length > 0 ? (
                            <div className="space-y-3">
                                {lessons.map((lesson, index) => (
                                    <Card
                                        key={lesson.id}
                                        className="flex items-center justify-between py-4 px-6 group cursor-pointer"
                                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 group-hover:text-indigo-400 transition-colors">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{lesson.title}</h4>
                                                <p className="text-xs text-slate-500">Video • {index * 5 + 10} mins</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {lesson.is_completed ? (
                                                <CheckCircle2 className="text-emerald-500" size={20} />
                                            ) : (
                                                <Circle className="text-slate-700" size={20} />
                                            )}
                                            <Play className="text-slate-600 group-hover:text-white transition-colors" size={18} />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center">
                                <Sparkles className="text-indigo-500/30 mx-auto mb-4" size={48} />
                                <h3 className="text-xl font-bold text-white mb-2">Curriculum Not Yet Installed</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-8">
                                    The AI has architected the plan, but you need to start the generation process to create your lessons.
                                </p>
                                <Button
                                    onClick={handleInstall}
                                    disabled={installing}
                                    className="gap-2 px-8"
                                >
                                    {installing ? <Loader2 className="animate-spin" /> : <Download size={18} />}
                                    Install Lesson Content
                                </Button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar info */}
                <div className="space-y-6">
                    <Card className="bg-indigo-600/5 border-indigo-500/20">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-400" /> AI Tutor Insight
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed italic">
                            "This course is optimized for your {course.native_language || 'native'} background. I've focused on practical applications and core conceptual breakthroughs."
                        </p>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-white mb-4">Course Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Modules</span>
                                <span className="text-white font-medium">{lessons.length || '--'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Avg. Mastery</span>
                                <span className="text-white font-medium">--%</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Time Est.</span>
                                <span className="text-white font-medium">~6 Hours</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-700/50">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Overall Progress</p>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-2xl font-bold text-white">{course.progress || 0}%</span>
                                <span className="text-xs text-slate-500">Target: 95%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
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
