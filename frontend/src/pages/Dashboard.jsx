import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Sparkles, BookOpen, Clock, ChevronRight, Loader2, XCircle, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VoiceInputButton from '../components/chat/VoiceInputButton';

const Dashboard = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const inputRef = useRef(null);

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            const courseList = response.data;

            // Fetch progress for each course concurrently
            const coursesWithProgress = await Promise.all(courseList.map(async (course) => {
                try {
                    const lessonsRes = await api.get(`/courses/${course.id}/lessons`);
                    const lessons = lessonsRes.data || [];
                    const total = lessons.length;
                    const completed = lessons.filter(l => l.status === 'completed').length;
                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return { ...course, progress };
                } catch (err) {
                    console.error(`Error fetching progress for course ${course.id}:`, err);
                    return { ...course, progress: 0 };
                }
            }));

            setCourses(coursesWithProgress);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCourse = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            // Include session_id to maintain conversation context
            const payload = {
                prompt: prompt,
                session_id: sessionId
            };

            const response = await api.post('/courses', payload);

            // Set session ID for next turn
            if (response.data.session_id) {
                setSessionId(response.data.session_id);
            }

            // Check if a course was created
            if (response.data.course) {
                navigate(`/courses/${response.data.course.id}`);
            } else {
                // Otherwise show the AI response (clarifying questions)
                setAiResponse(response.data.response);
                setPrompt('');
                fetchCourses(); // In case some draft was saved
            }
        } catch (error) {
            console.error('Generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleVoiceComplete = async (blob) => {
        setIsGenerating(true);
        setAiResponse(null);
        try {
            const formData = new FormData();
            formData.append('audio', blob, 'voice_input.webm');
            if (sessionId) formData.append('session_id', sessionId);

            const response = await api.post('/courses', formData);

            if (response.data.session_id) {
                setSessionId(response.data.session_id);
            }

            if (response.data.course) {
                navigate(`/courses/${response.data.course.id}`);
            } else {
                setAiResponse(response.data.response);
                setPrompt('');
            }
        } catch (error) {
            console.error('Voice generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteCourse = async (e, courseId) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

        try {
            await api.delete(`/courses/${courseId}`);
            // Remove from local state
            setCourses(courses.filter(c => c.id !== courseId));
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('Failed to delete course. Please try again.');
        }
    };

    const resetConversation = () => {
        setSessionId(null);
        setAiResponse(null);
        setPrompt('');
    };

    return (
        <div className="space-y-10">
            {/* Hero / Command Center Generator */}
            <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-white/5 shadow-2xl p-1 lg:p-2">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

                <div className="relative z-10 bg-slate-950/80 backdrop-blur-2xl rounded-[2.8rem] p-12 lg:p-16 border border-white/10 overflow-hidden shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)]">
                    {/* Landing Page Gradient Glows */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -ml-20 -mb-20"></div>

                    {/* Animated Beam */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>

                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-indigo-100 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                            <Sparkles size={14} className="animate-pulse" /> AI Academic Architect v2.0
                        </div>

                        <h1 className="text-4xl lg:text-6xl font-display font-bold text-white mb-4 leading-tight">
                            {sessionId ? "Refining your journey..." : "What do you want to master today?"}
                        </h1>

                        {!aiResponse && !sessionId && (
                            <p className="text-indigo-100/70 text-lg lg:text-xl max-w-2xl mx-auto">
                                Transform any goal into a professional, structured learning path in seconds.
                            </p>
                        )}

                        {/* AI Conversation Display */}
                        {isGenerating && !aiResponse && (
                            <div className="flex items-center justify-center gap-3 text-white/50 animate-pulse py-4">
                                <Loader2 className="animate-spin" size={20} />
                                <span className="text-sm font-bold uppercase tracking-[0.2em]">Architecting Curriculum...</span>
                            </div>
                        )}

                        {aiResponse && (
                            <div className="p-8 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 animate-in zoom-in-95 duration-500 shadow-2xl text-left">
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-xl">
                                        <Sparkles className="text-indigo-600" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="prose prose-invert prose-indigo max-w-none 
                                            prose-p:text-lg prose-p:leading-relaxed prose-p:text-indigo-50
                                            prose-strong:text-white prose-strong:font-bold
                                            prose-li:text-indigo-100/80
                                        ">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-indigo-200/50 uppercase tracking-widest italic">Awaiting your response...</span>
                                            <button
                                                onClick={resetConversation}
                                                className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-all uppercase tracking-widest group"
                                            >
                                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Start Over
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleGenerateCourse} className="relative max-w-2xl mx-auto group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-indigo-300 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={aiResponse ? "Provide more details..." : "e.g. Fullstack Web Development in 3 months..."}
                                    className="w-full bg-slate-900/50 border border-white/10 backdrop-blur-3xl rounded-[1.5rem] py-6 pl-8 pr-40 text-white text-lg placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-2xl"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isGenerating}
                                />
                                <div className="absolute right-3 top-3 bottom-3 flex items-center gap-2">
                                    <VoiceInputButton
                                        onRecordingComplete={handleVoiceComplete}
                                        isDisabled={isGenerating}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={isGenerating || !prompt.trim()}
                                        className="h-full bg-white text-slate-900 hover:bg-slate-100 px-8 rounded-2xl flex items-center gap-3 shadow-xl font-bold uppercase tracking-widest text-[10px]"
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={16} className="text-indigo-600" /> {sessionId ? 'Continue' : 'Architect'}</>}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {!sessionId && (
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] w-full mb-2">Architectural Presets</span>
                                {['React Native', 'Machine Learning', 'UI Design', 'Go Backend'].map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => setPrompt(`I want to learn ${topic}`)}
                                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all shadow-lg shadow-black/20"
                                    >
                                        + {topic}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Course Grid */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <BookOpen className="text-indigo-400" /> My Learning Paths
                    </h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-800/20 rounded-3xl animate-pulse border border-slate-800"></div>
                        ))}
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <Card key={course.id} className="group flex flex-col h-full cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all duration-300" onClick={() => navigate(`/courses/${course.id}`)}>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-100'}`}>
                                            {course.status || 'In Progress'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleDeleteCourse(e, course.id)}
                                                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                                                title="Delete Course"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="text-white/20 group-hover:text-white transition-colors">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-6 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
                                        {course.title}
                                    </h3>
                                </div>

                                <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium tracking-wide">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Clock size={14} className="text-indigo-500/50" /> {course.estimated_duration_days || '--'} Days
                                        </div>
                                        <span className="text-indigo-400">{course.progress || 0}% Complete</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden ring-1 ring-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000"
                                            style={{ width: `${course.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : searchQuery ? (
                    <div className="text-center py-20 bg-slate-800/10 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <XCircle className="text-slate-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                        <p className="text-slate-500">We couldn't find any courses matching "{searchQuery}"</p>
                        <button onClick={() => navigate('/dashboard')} className="mt-6 text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-xs">Clear Search</button>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-800/10 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="text-slate-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Courses Yet</h3>
                        <p className="text-slate-500">Ready to start your journey? Use the AI generator above!</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
