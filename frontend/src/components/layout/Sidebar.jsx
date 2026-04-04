import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    MessageSquare,
    Layers,
    BrainCircuit,
    Settings,
    LogOut,
    ChevronRight,
    Award,
    History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ onMenuClick }) => {
    const { logout, user } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: BookOpen, label: 'My Courses', path: '/courses' },
        { icon: MessageSquare, label: 'AI Tutor Chat', path: '/chat' },
        { icon: Layers, label: 'Flashcards', path: '/flashcards' },
        { icon: BrainCircuit, label: 'Progress', path: '/progress' },
        { icon: Award, label: 'Certificates', path: '/certificates' },
        { icon: History, label: 'Payments', path: '/payments' },
    ];

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full">
            <div className="p-6">
                <div className="text-2xl font-display font-bold text-indigo-400">AI Tutor</div>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onMenuClick}
                        className={({ isActive }) => `
              flex items-center justify-between px-4 py-3 rounded-xl transition-all group
              ${isActive
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
            `}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="bg-slate-800/40 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                           
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
