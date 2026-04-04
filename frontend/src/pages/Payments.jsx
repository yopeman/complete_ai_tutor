import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
    CreditCard,
    History,
    Search,
    Calendar,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    ExternalLink,
    TrendingUp,
    Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/payments');
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.tx_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.status.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'COMPLETED' && payment.status.toUpperCase() === 'COMPLETED') ||
            (statusFilter === 'PENDING' && payment.status.toUpperCase() === 'PENDING');

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
                return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'FAILED':
                return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'PENDING':
                return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default:
                return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
                return <CheckCircle2 size={14} />;
            case 'FAILED':
                return <XCircle size={14} />;
            case 'PENDING':
                return <Clock size={14} />;
            default:
                return <Clock size={14} />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="text-slate-400 animate-pulse font-bold tracking-widest uppercase text-xs">Retrieving Payment Records...</p>
            </div>
        );
    }

    const totalSpent = payments.reduce((acc, p) => p.status === 'COMPLETED' ? acc + p.amount : acc, 0);

    return (
        <div className="space-y-10 pb-20">
            {/* Header section */}
            <section className="relative p-1 rounded-[3rem] bg-slate-900 border border-white/5 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="relative z-10 bg-slate-950/40 backdrop-blur-3xl rounded-[2.8rem] p-10 lg:p-14">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                                <Shield size={14} /> Financial Records
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-display font-bold text-white leading-tight">Payment <br />Master Log</h1>
                            <p className="text-slate-400 text-lg lg:text-xl max-w-xl">
                                Track all your premium unlocking transactions and subscription history in one secure place.
                            </p>
                        </div>
                        <div className="w-full lg:w-80 grid grid-cols-1 gap-4">
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md text-center">
                                <div className="text-4xl font-display font-bold text-white mb-1 uppercase leading-none">{totalSpent} <span className="text-sm font-bold text-slate-500">ETB</span></div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Investment</div>
                            </div>
                            <div className="p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 text-center">
                                <div className="text-2xl font-display font-bold text-indigo-400 mb-1">{payments.length}</div>
                                <div className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">Logged Events</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by transaction reference..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5">
                    <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        All Time
                    </button>
                    <button
                        onClick={() => setStatusFilter('COMPLETED')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'COMPLETED' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Successful
                    </button>
                    <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === 'PENDING' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Pending
                    </button>
                </div>
            </div>

            {/* Payments List */}
            {filteredPayments.length > 0 ? (
                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="px-8 py-6">Transaction Ref</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6 text-right">Amount</th>
                                    <th className="px-8 py-6">Date</th>
                                    <th className="px-8 py-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all">
                                                    <CreditCard size={14} />
                                                </div>
                                                <span className="font-mono text-sm text-slate-400 group-hover:text-white transition-colors">
                                                    {payment.tx_ref}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(payment.status)}`}>
                                                {getStatusIcon(payment.status)}
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-base font-bold text-white">{payment.amount} <span className="text-[10px] text-slate-500 ml-1 uppercase">ETB</span></span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                <Calendar size={12} />
                                                {new Date(payment.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-2">
                                                {payment.status === 'PENDING' && payment.checkout_url && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold uppercase tracking-widest"
                                                        onClick={() => window.open(payment.checkout_url, '_blank')}
                                                    >
                                                        Pay Now
                                                    </Button>
                                                )}
                                                {payment.status === 'COMPLETED' && (
                                                    <button
                                                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                                        title="Verified Transaction"
                                                    >
                                                        <Shield size={16} className="text-emerald-500/50" />
                                                    </button>
                                                )}
                                                <button
                                                    className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                                    onClick={() => navigate(`/courses/${payment.course_id}`)}
                                                    title="View Course"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="py-24 text-center bg-slate-900/30 border-2 border-dashed border-white/5 rounded-[3rem]">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-600">
                        <History size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Payment History</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                        You haven't initiated any premium transactions yet. Unlock your first course to keep learning.
                    </p>
                    <Button onClick={() => navigate('/dashboard')} className="gap-2 px-8 py-5 rounded-2xl group">
                        Unlock Courses <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Payments;
