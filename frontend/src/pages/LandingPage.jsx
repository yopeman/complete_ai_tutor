import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            {/* Header */}
            <header className="container mx-auto px-6 py-8 flex justify-between items-center">
                <div className="text-2xl font-display font-bold text-indigo-400">AI Tutor</div>
                <nav className="space-x-8 hidden md:flex">
                    <a href="#" className="hover:text-indigo-300 transition-colors">Features</a>
                    <a href="#" className="hover:text-indigo-300 transition-colors">Pricing</a>
                    <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/20">Sign In</Link>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 py-24 flex flex-col items-center text-center">
                <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-8">
                    Personalized Learning <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                        Powered by Multi-Agent AI
                    </span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mb-12">
                    Experience the future of education. Our platform uses advanced AI agents to curate,
                    teach, and assess your learning journey in real-time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all">
                        Get Started for Free
                    </Link>
                    <button className="border border-slate-700 hover:bg-slate-800 px-10 py-4 rounded-xl text-lg font-semibold transition-all">
                        Watch Demo
                    </button>
                </div>

                {/* Decorative elements */}
                <div className="mt-20 relative w-full max-w-4xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-25"></div>
                    <div className="relative bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-b border-slate-700">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="p-8 h-64 flex items-center justify-center text-slate-500 font-mono italic">
                            Platform Preview Coming Soon...
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
