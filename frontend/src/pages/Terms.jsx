import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ArrowLeft, ShieldCheck, FileText, Lock, Eye, AlertCircle } from 'lucide-react';

const Terms = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            {/* Ambient background glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px]"></div>
            </div>

            <header className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-indigo-500/50 transition-all">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="font-bold text-slate-400 group-hover:text-white transition-colors">Back to Base</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <BrainCircuit className="text-white" size={20} />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 max-w-4xl pt-12 pb-24 relative z-10">
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <ShieldCheck size={14} /> Service Terms v1.2
                    </div>
                    <h1 className="text-5xl font-display font-bold mb-6 tracking-tight">Terms of Use</h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        By accessing the AI Tutor Platform, you are engaging with a specialized AI-driven
                        academic ecosystem. Please review your rights and responsibilities.
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm shadow-2xl shadow-indigo-500/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <FileText className="text-indigo-400" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold">1. License of Use</h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                            We grant you a non-exclusive, non-transferable license to access our course content,
                            AITutor chat functions, and certification system for personal, academic purposes.
                            Unauthorized duplication of generated course nodes remains strictly prohibited.
                        </p>
                    </section>

                    <section className="p-10 border border-white/10 rounded-3xl bg-slate-950/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                <AlertCircle className="text-orange-400" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold underline underline-offset-8 decoration-orange-500/30">2. Academic Integrity</h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            The AI Tutor platform is designed to supplement your cognitive effort, not replace it.
                            You agree to complete all lesson quizzes, flashcards, and course modules with
                            genuine effort as per the AITutor Ethics Protocol.
                        </p>
                        <div className="flex flex-col gap-3">
                            <div className="p-4 rounded-xl bg-slate-900/50 border-l-2 border-orange-500/50">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Warning // Infraction 401</p>
                                <p className="text-sm text-slate-300">Using automated systems to "brute force" lesson completions will result in immediate certificate invalidation.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
                                <BrainCircuit className="text-slate-400" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold">3. Certification & Mastery</h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-6 my-6">
                            "Mastery is the final frontier of the AI Tutor journey. Certificates are earned, not issued."
                        </p>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Certificates are only generated upon 100% completion of all sub-nodes (lessons) in a
                            course module. We reserve the right to audit certificates in the event of system glitches.
                        </p>
                    </section>
                </div>

                <div className="mt-20 pt-12 border-t border-white/10 flex items-center justify-between gap-8">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Last Protocol Update: April 2026
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        © AI Tutor Platform • Legal Unit
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Terms;
