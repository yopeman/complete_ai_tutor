import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({ children, className, variant = 'primary', size = 'md', ...props }) => {
    const variants = {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20',
        secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
        outline: 'border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10',
        ghost: 'hover:bg-slate-800 text-slate-400 hover:text-white',
        danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <button
            className={twMerge(
                'inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
