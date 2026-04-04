import React from 'react';
import { X, CreditCard, Sparkles, ShieldCheck, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import Button from './Button';

const PaymentModal = ({ isOpen, onClose, checkoutUrl, message }) => {
    if (!isOpen) return null;

    const handleContinuePayment = () => {
        if (checkoutUrl) {
            window.open(checkoutUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">

                {/* Background glow effects */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none"></div>

                {/* Modal Header */}
                <div className="relative p-8 pb-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                            <CreditCard className="text-white" size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">Unlock Premium Learning</h3>
                            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">AI Tutor Pro Upgrade</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-8 relative">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6">
                        <p className="text-slate-300 text-base leading-relaxed">
                            {message || "You've reached your free lesson limit. Unlock unlimited access to all courses, interactive AI tutoring, and personalized learning paths."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Premium Benefits</h4>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { icon: <Zap size={16} className="text-amber-400" />, text: "Unlimited Interactive Lessons" },
                                { icon: <Sparkles size={16} className="text-indigo-400" />, text: "Unlimited AI Tutor Interactions" },
                                { icon: <ShieldCheck size={16} className="text-emerald-400" />, text: "Verified Course Certificates" }
                            ].map((benefit, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        {benefit.icon}
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">{benefit.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-8 pt-0 mt-auto flex flex-col gap-4 relative">
                    <Button
                        onClick={handleContinuePayment}
                        className="w-full h-16 rounded-2xl text-lg font-bold bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-500/20 group transition-all"
                    >
                        <span className="flex items-center justify-center gap-2">
                            Continue to Payment
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </span>
                    </Button>

                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 text-sm font-bold uppercase tracking-widest py-2 transition-colors"
                    >
                        I'll do it later
                    </button>

                    <p className="text-[10px] text-center text-slate-600 font-medium">
                        Secure checkout powered by <span className="text-slate-400 font-bold uppercase tracking-tight">Chapa</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
