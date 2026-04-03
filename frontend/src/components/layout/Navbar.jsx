import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4 flex-1">
                <button className="md:hidden text-slate-400 hover:text-white">
                    <Menu size={24} />
                </button>
                <div className="relative w-full max-w-md hidden md:block group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search lessons, tutors, or flashcards..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-full py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm text-slate-200"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative text-slate-400 hover:text-white transition-colors">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900"></span>
                </button>

                <div className="h-8 w-px bg-slate-800"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-white">{user?.username}</p>
                        <p className="text-xs text-slate-500 capitalize">{user?.native_language} Learner</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 p-[2px] shadow-lg shadow-indigo-500/20">
                        <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-sm font-bold text-indigo-400">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
