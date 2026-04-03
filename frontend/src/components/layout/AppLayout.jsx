import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const AppLayout = () => {
    return (
        <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden">
            {/* Sidebar - Desktop */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-8 relative">
                    {/* Subtle background glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] pointer-events-none -z-10"></div>

                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
