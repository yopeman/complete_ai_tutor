import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
    Award,
    Download,
    ExternalLink,
    Search,
    Calendar,
    Loader2,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const response = await api.get('/certificates');
            setCertificates(response.data);
        } catch (error) {
            console.error('Error fetching certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (cert) => {
        if (cert.content) {
            if (cert.content.startsWith('http')) {
                window.open(cert.content, '_blank');
            } else {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(cert.content);
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }
        }
    };

    const filteredCertificates = certificates.filter(cert => {
        // We might need to fetch course titles too if not included in cert response
        // but for now let's assume certificate_code or something is searchable
        return cert.certificate_code.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="text-slate-400 animate-pulse font-bold tracking-widest uppercase text-xs">Retrieving Certifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header section */}
            <section className="relative p-1 rounded-[3rem] bg-slate-900 border border-white/5 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="relative z-10 bg-slate-950/40 backdrop-blur-3xl rounded-[2.8rem] p-10 lg:p-14">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                                <Award size={14} /> Academic Achievements
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-display font-bold text-white leading-tight">Your Certification <br />Portfolio</h1>
                            <p className="text-slate-400 text-lg lg:text-xl max-w-xl">
                                A collection of your verified academic achievements and course masteries.
                            </p>
                        </div>
                        <div className="w-full lg:w-72 space-y-4">
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md text-center">
                                <div className="text-4xl font-display font-bold text-white mb-1">{certificates.length}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Certificates</div>
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
                        placeholder="Search by certificate code..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Certificates Grid */}
            {filteredCertificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCertificates.map((cert) => (
                        <Card
                            key={cert.id}
                            className="group overflow-hidden flex flex-col hover:border-emerald-500/30 transition-all duration-500"
                        >
                            {/* Certificate Preview Mockup */}
                            <div className="h-48 bg-slate-950 flex items-center justify-center relative overflow-hidden group-hover:bg-emerald-950/20 transition-colors">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative w-32 h-40 bg-white/5 border border-white/10 rounded-lg shadow-2xl flex flex-col p-3 transform transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <Award size={12} className="text-emerald-400" />
                                        <div className="w-4 h-4 rounded-full bg-emerald-500/20"></div>
                                    </div>
                                    <div className="h-1 w-12 bg-white/20 mb-1"></div>
                                    <div className="h-1 w-8 bg-white/10 mb-3"></div>
                                    <div className="h-2 w-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 mb-1"></div>
                                    <div className="h-2 w-2/3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 mb-4"></div>
                                    <div className="mt-auto flex justify-center">
                                        <div className="w-8 h-8 rounded-full border border-emerald-500/30 flex items-center justify-center">
                                            <CheckCircle2 size={10} className="text-emerald-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 text-[8px] font-mono text-slate-700 group-hover:text-emerald-400/30 transition-colors">
                                    {cert.certificate_code}
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-[0.2em]">Verified</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(cert.issue_date).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors">Course Completion Certificate</h3>
                                <p className="text-xs text-slate-500 font-mono mb-8">Ref: {cert.certificate_code}</p>

                                <div className="mt-auto flex gap-3">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-xl gap-2 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/10"
                                        onClick={() => handleDownload(cert)}
                                    >
                                        <Download size={14} /> Download PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border-white/10 hover:bg-white/5"
                                        onClick={() => navigate(`/courses/${cert.course_id}`)}
                                        title="View Course"
                                    >
                                        <ExternalLink size={14} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center bg-slate-900/30 border-2 border-dashed border-white/5 rounded-[3rem]">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-600">
                        <Award size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Certificates Yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                        Complete all modules in a learning blueprint to 100% mastery to unlock your official academic certifications.
                    </p>
                    <Button onClick={() => navigate('/courses')} className="gap-2 px-8 py-5 rounded-2xl group">
                        Browse Modules <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Certificates;
