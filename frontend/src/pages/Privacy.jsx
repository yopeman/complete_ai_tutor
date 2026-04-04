import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ArrowLeft, ShieldCheck, FileText, Lock, Eye } from 'lucide-react';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            {/* Ambient background glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px]"></div>
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                        <ShieldCheck size={14} /> Security Protocol v2.6
                    </div>
                    <h1 className="text-5xl font-display font-bold mb-6 tracking-tight">Privacy Policy</h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        Your intellectual growth is your own. We prioritize the security and confidentiality
                        of your cognitive learning data across our multi-agent AI environments.
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <Lock className="text-indigo-400" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold">1. Data Encryption</h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-4">
                            All lesson interactions, quiz results, and AI tutor conversations are encrypted
                            using AES-256 standard protocols. Your data is stored in isolated cognitive nodes
                            to prevent unauthorized cross-access.
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-500">
                            <li className="flex items-center gap-2 bg-slate-950/50 p-3 rounded-lg border border-white/5">
                                [✓] TLS 1.3 End-to-End Encryption
                            </li>
                            <li className="flex items-center gap-2 bg-slate-950/50 p-3 rounded-lg border border-white/5">
                                [✓] Zero-Knowledge Knowledge Storage
                            </li>
                        </ul>
                    </section>

                    <section className="p-4 border-l-2 border-emerald-500/30 ml-4">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                            <Eye className="text-emerald-400" size={20} />
                            2. AI Model Training
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            Our AI agents use your performance data locally to personalize your academic
                            experience. We **do not** sell your interaction history to third-party
                            advertising networks. Your cognitive footprint remains within the AI Tutor OS ecosystem.
                        </p>
                    </section> section

                    <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <FileText className="text-amber-400" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold">3. Information Collection</h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-6 my-6">
                            "We collect only what is necessary to architect your personalized learning journey."
                        </p>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="p-6 rounded-2xl bg-slate-950/50 border border-white/5">
                                <h3 className="font-bold mb-2">Account Meta-Data</h3>
                                <p className="text-sm text-slate-500">Email addresses are used strictly for authentication and high-priority system notifications via our neural relay (Email System).</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-950/50 border border-white/5">
                                <h3 className="font-bold mb-2">Performance Analytics</h3>
                                <p className="text-sm text-slate-500">Lesson completion times and flashcard mastery levels are calculated to refine your progressive difficulty scaling.</p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-20 pt-12 border-t border-white/10 flex items-center justify-between gap-8">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Last Protocol Update: April 2026
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        © AI Tutor Platform • Privacy Unit
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Privacy;
