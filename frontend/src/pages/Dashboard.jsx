import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Sparkles, BookOpen, Clock, ChevronRight, Loader2, XCircle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Dashboard = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);
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

    const resetConversation = () => {
        setSessionId(null);
        setAiResponse(null);
        setPrompt('');
    };

    return (
        <div className="space-y-10">
            {/* Hero / Generator Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-10 shadow-2xl shadow-indigo-500/20">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl font-display font-bold text-white mb-4">
                        {sessionId ? "Architecting your path..." : "What do you want to learn today?"}
                    </h1>

                    {!aiResponse && !sessionId && (
                        <p className="text-indigo-100 mb-8 text-lg">
                            Tell our AI Tutor what you're interested in, and we'll architect a personalized curriculum just for you.
                        </p>
                    )}

                    {/* AI Conversation Display */}
                    {isGenerating && !aiResponse && (
                        <div className="mb-8 flex items-center gap-3 text-white/60 animate-pulse bg-white/5 border border-white/10 p-4 rounded-2xl w-fit">
                            <Loader2 className="animate-spin" size={18} />
                            <span className="text-sm font-medium">Architect is processing your request...</span>
                        </div>
                    )}

                    {aiResponse && (
                        <div className="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0">
                                    <Sparkles className="text-indigo-600" size={24} />
                                </div>
                                <div className="flex-1 text-indigo-50 prose prose-invert max-w-none 
                                    prose-p:leading-relaxed prose-p:text-indigo-100/80
                                    prose-headings:text-white prose-headings:font-display
                                    prose-li:my-1 prose-li:text-indigo-100/70
                                    prose-strong:text-white prose-strong:font-bold
                                ">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={resetConversation}
                                    className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    <RotateCcw size={14} /> Clear & Restart
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleGenerateCourse} className="relative group">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={aiResponse ? "Type your answer here..." : "e.g. Master Python for Data Science..."}
                            className="w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl py-5 pl-6 pr-32 text-white placeholder:text-indigo-200/60 focus:ring-4 focus:ring-white/20 outline-none transition-all"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isGenerating}
                        />
                        <div className="absolute right-2 top-2 bottom-2">
                            <Button
                                type="submit"
                                disabled={isGenerating || !prompt.trim()}
                                className="h-full bg-white text-indigo-600 hover:bg-indigo-50 px-6 rounded-xl flex items-center gap-2 shadow-lg"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} /> {sessionId ? 'Reply' : 'Generate'}</>}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full mr-20 -mb-20 blur-3xl"></div>
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
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <Card key={course.id} className="group flex flex-col h-full cursor-pointer hover:ring-2 hover:ring-indigo-500/50 transition-all duration-300" onClick={() => navigate(`/courses/${course.id}`)}>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-100'}`}>
                                            {course.status || 'In Progress'}
                                        </span>
                                        <button className="text-white/20 group-hover:text-white transition-colors">
                                            <ChevronRight size={20} />
                                        </button>
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
