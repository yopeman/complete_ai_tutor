import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '', native_language: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // 1. Register User
            await api.post('/auth/register', formData);

            // 2. Automagically Login after registration
            const loginData = new URLSearchParams();
            loginData.append('username', formData.username);
            loginData.append('password', formData.password);

            const response = await api.post('/auth/login', loginData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            await login(response.data.access_token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <Link to="/" className="text-3xl font-display font-bold text-indigo-400 mb-2 block">AI Tutor</Link>
                    <h2 className="text-2xl font-bold text-white">Create your account</h2>
                    <p className="text-slate-400 mt-2">Join thousands of learners today</p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                    placeholder="johndoe"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Native Language</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <span className="text-xs font-bold">LN</span>
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                    placeholder="e.g. English, Turkish"
                                    value={formData.native_language}
                                    onChange={(e) => setFormData({ ...formData, native_language: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    Create Account
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 mt-8 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
