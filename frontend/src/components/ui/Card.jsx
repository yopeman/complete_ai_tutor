import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, hover = true, ...props }) => {
    return (
        <div
            className={twMerge(
                'bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 transition-all ring-1 ring-white/5',
                hover && 'hover:bg-slate-800/60 hover:border-slate-600 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
