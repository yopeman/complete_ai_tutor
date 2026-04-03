import React, { useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Navbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('search') || '');

    const handleSearch = (e) => {
        const value = e.target.value;
        setQuery(value);
        if (value.trim()) {
            navigate(`/dashboard?search=${encodeURIComponent(value.trim())}`);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <header className="h-20 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xl shadow-black/20">
            {/* Left Section */}
            <div className="flex items-center gap-4 flex-1">
                <button className="md:hidden text-slate-400 hover:text-white transition-colors">
                    <Menu size={24} />
                </button>
            </div>

            {/* Center Section - Search Bar */}
            <div className="flex-[2] max-w-xl hidden md:block group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search your learning paths..."
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-full py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm text-white placeholder:text-slate-500 shadow-inner group-hover:border-slate-600/50"
                        value={query}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-6 flex-1 justify-end">
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
