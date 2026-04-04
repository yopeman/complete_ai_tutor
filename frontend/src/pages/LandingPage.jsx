import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BrainCircuit, Rocket, ArrowRight, Mail, Phone } from 'lucide-react';

// Custom SVG component to resolve lucide-react export issues for Github
const GithubLogo = ({ size = 16, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
);

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
            </div>

            {/* Header */}
            <header className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <BrainCircuit className="text-white" size={24} />
                    </div>
                    <div className="text-2xl font-display font-bold text-white tracking-tight">AI<span className="text-indigo-400">Tutor</span></div>
                </div>
                <nav className="flex items-center gap-4">
                    <Link to="/login" className="text-slate-400 hover:text-white transition-colors font-medium px-4">Sign In</Link>
                    <Link to="/register" className="bg-white text-slate-900 hover:bg-slate-200 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm">
                        Get Started
                    </Link>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 pt-20 pb-32 relative z-10">
                <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles size={14} /> The Future of Education is Here
                    </div>

                    <h1 className="text-6xl md:text-8xl font-display font-bold leading-[1.1] mb-8 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        Architect Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 animate-gradient">
                            Own Knowledge.
                        </span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        A revolution in learning. Our multi-agent AI environment doesn't just teach—it builds
                        personalized academic blueprints tailored to your cognitive profile.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <Link to="/register" className="group bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-[2rem] text-lg font-bold transition-all shadow-2xl shadow-indigo-500/25 flex items-center gap-3">
                            Start Journey <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="px-12 py-5 rounded-[2rem] text-lg font-bold border border-white/10 hover:bg-white/5 transition-all flex items-center gap-3 backdrop-blur-sm">
                            <Rocket size={20} className="text-emerald-400" /> System Specs
                        </button>
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="container mx-auto px-6 py-16 border-t border-white/5 relative z-10">
                <div className="flex flex-col gap-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-500 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-500/10">
                                <BrainCircuit className="text-white" size={18} />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">AI<span className="text-indigo-400">Tutor</span></span>
                        </div>

                        {/* Horizontal Contact Info */}
                        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                            <a href="https://github.com/mareligncode" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-all">
                                    <GithubLogo size={16} />
                                </div>
                                <span className="text-xs font-bold font-mono tracking-wider">mareligncode</span>
                            </a>
                            <a href="mailto:yimermarelign@gmail.com" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-all">
                                    <Mail size={16} />
                                </div>
                                <span className="text-xs font-bold font-mono tracking-wider">yimermarelign@gmail.com</span>
                            </a>
                            <a href="tel:0945342453" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-all">
                                    <Phone size={16} />
                                </div>
                                <span className="text-xs font-bold font-mono tracking-wider">0945342453</span>
                            </a>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                        <nav className="flex gap-10">
                            <Link to="/terms" className="text-xs font-black text-slate-300 hover:text-indigo-400 transition-all uppercase tracking-[0.2em]">Terms</Link>
                            <Link to="/privacy" className="text-xs font-black text-slate-300 hover:text-indigo-400 transition-all uppercase tracking-[0.2em]">Privacy</Link>
                        </nav>
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] text-center md:text-right">
                            Architecting Finalist Cognitive Deployment • © 2026 AI Tutor Platform
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
