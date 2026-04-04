import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize2,
} from 'lucide-react';

const PresentationViewer = ({ slides = [], onExit }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [audioBlobUrls, setAudioBlobUrls] = useState({});
    const [audioLoading, setAudioLoading] = useState(false);
    const audioRef = useRef(null);
    const animFrameRef = useRef(null);
    const containerRef = useRef(null);

    const slide = slides[currentSlide];
    const totalSlides = slides.length;

    // ── Enter browser fullscreen on mount ──────────────────────────
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                const el = containerRef.current || document.documentElement;
                if (el.requestFullscreen) {
                    await el.requestFullscreen();
                } else if (el.webkitRequestFullscreen) {
                    await el.webkitRequestFullscreen();
                } else if (el.msRequestFullscreen) {
                    await el.msRequestFullscreen();
                }
            } catch (err) {
                console.warn('Fullscreen request failed:', err);
            }
        };
        enterFullscreen();
        document.body.style.overflow = 'hidden';

        // Listen for fullscreen exit via Esc (browser handles it)
        const onFsChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                // User pressed Esc or exited fullscreen natively
            }
        };
        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('fullscreenchange', onFsChange);
            document.removeEventListener('webkitfullscreenchange', onFsChange);
            // Exit fullscreen on unmount
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        };
    }, []);

    // ── Pre-fetch audio blobs via fetch with ngrok header ──────────
    useEffect(() => {
        let cancelled = false;
        const fetchAudioBlobs = async () => {
            const urls = {};
            for (let i = 0; i < slides.length; i++) {
                if (cancelled) break;
                const audioPath = slides[i]?.audio_path;
                if (!audioPath) continue;
                try {
                    const resp = await fetch(audioPath, {
                        headers: {
                            'ngrok-skip-browser-warning': 'true',
                        },
                    });
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    const blob = await resp.blob();
                    if (!cancelled) {
                        urls[i] = URL.createObjectURL(blob);
                    }
                } catch (err) {
                    console.warn(`Failed to fetch audio for slide ${i}:`, err);
                }
            }
            if (!cancelled) setAudioBlobUrls(urls);
        };
        fetchAudioBlobs();
        return () => {
            cancelled = true;
        };
    }, [slides]);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(audioBlobUrls).forEach(u => URL.revokeObjectURL(u));
        };
    }, [audioBlobUrls]);

    // ── Keyboard Controls ──────────────────────────────────────────
    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'ArrowRight':
                setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
                break;
            case 'ArrowLeft':
                setCurrentSlide(prev => Math.max(prev - 1, 0));
                break;
            case ' ':
                e.preventDefault();
                if (audioRef.current) {
                    if (audioRef.current.paused) {
                        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
                    } else {
                        audioRef.current.pause();
                        setIsPlaying(false);
                    }
                }
                break;
            case 'Escape':
                handleExit();
                break;
        }
    }, [totalSlides]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // ── Audio progress tracking ────────────────────────────────────
    const trackProgress = useCallback(() => {
        if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
        }
        animFrameRef.current = requestAnimationFrame(trackProgress);
    }, []);

    // ── Load & auto-play audio on slide change ─────────────────────
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setAudioProgress(0);
        setAudioDuration(0);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        const blobUrl = audioBlobUrls[currentSlide];
        if (blobUrl && audioRef.current) {
            setAudioLoading(true);
            audioRef.current.src = blobUrl;
            audioRef.current.load();

            const onCanPlay = () => {
                setAudioLoading(false);
                setAudioDuration(audioRef.current?.duration || 0);
                audioRef.current?.play().then(() => {
                    setIsPlaying(true);
                    animFrameRef.current = requestAnimationFrame(trackProgress);
                }).catch(() => setIsPlaying(false));
                audioRef.current?.removeEventListener('canplaythrough', onCanPlay);
            };
            audioRef.current.addEventListener('canplaythrough', onCanPlay);
        }
    }, [currentSlide, audioBlobUrls]);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                animFrameRef.current = requestAnimationFrame(trackProgress);
            }).catch(() => { });
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        setAudioProgress(0);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };

    const handleProgressClick = (e) => {
        if (!audioRef.current || !audioDuration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = pct * audioDuration;
        setAudioProgress(audioRef.current.currentTime);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !audioRef.current.muted;
        setIsMuted(!isMuted);
    };

    const goNext = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
    const goPrev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    const handleExit = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setIsPlaying(false);
        // Exit browser fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
        onExit?.();
    };

    const formatTime = (sec) => {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // ── Render slide content ───────────────────────────────────────
    const renderContent = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} style={{ height: '16px' }} />;

            if (trimmed.startsWith('- ')) {
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}
                    >
                        <div style={{
                            width: '12px', height: '12px', borderRadius: '50%', marginTop: '10px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #818cf8, #a855f7)',
                            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                        }} />
                        <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)', color: '#e2e8f0', lineHeight: 1.7, fontWeight: 300, margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: formatInlineCode(trimmed.slice(2)) }}
                        />
                    </motion.div>
                );
            }

            return (
                <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                    style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.8rem)', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '16px', fontWeight: 300 }}
                    dangerouslySetInnerHTML={{ __html: formatInlineCode(trimmed) }}
                />
            );
        });
    };

    const formatInlineCode = (text) => {
        return text.replace(
            /`([^`]+)`/g,
            '<code style="padding:3px 10px;border-radius:8px;background:rgba(99,102,241,0.15);color:#a5b4fc;font-family:monospace;font-size:0.9em;border:1px solid rgba(99,102,241,0.2)">$1</code>'
        );
    };

    if (!slides.length) return null;

    // ── Shared button style for < and > ────────────────────────────
    const navBtnStyle = {
        width: '56px', height: '56px', borderRadius: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.2s', zIndex: 10,
        backdropFilter: 'blur(10px)', border: 'none',
        fontFamily: 'monospace',
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                width: '100vw', height: '100vh', zIndex: 99999,
                backgroundColor: '#020617',
                display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Hidden audio element */}
            <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto" />

            {/* ── Top Bar ─────────────────────────────────────────────── */}
            <div style={{
                height: '56px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 20px',
                background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Maximize2 style={{ color: '#818cf8' }} size={16} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                        Slide {currentSlide + 1} / {totalSlides}
                    </span>
                </div>

                {/* EXIT BUTTON */}
                <button
                    onClick={handleExit}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px', borderRadius: '12px',
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#f87171', fontSize: '13px', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}
                    title="Exit Presentation"
                >
                    <X size={16} /> EXIT
                </button>
            </div>

            {/* ── Slide Content Area ──────────────────────────────────── */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                background: 'radial-gradient(ellipse at center, rgba(30,27,75,0.4) 0%, #020617 70%)',
            }}>
                {/* Decorative slide number watermark */}
                <div style={{
                    position: 'absolute', top: '20px', right: '40px',
                    fontSize: '150px', fontWeight: 900, color: 'rgba(255,255,255,0.015)',
                    lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
                }}>
                    {String(currentSlide + 1).padStart(2, '0')}
                </div>

                {/* < PREVIOUS BUTTON */}
                {currentSlide > 0 && (
                    <button
                        onClick={goPrev}
                        style={{
                            ...navBtnStyle,
                            position: 'absolute',
                            left: '24px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.8)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(99,102,241,0.3)';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                        }}
                        title="Previous Slide (←)"
                    >
                        &lt;
                    </button>
                )}

                {/* > NEXT BUTTON */}
                {currentSlide < totalSlides - 1 && (
                    <button
                        onClick={goNext}
                        style={{
                            ...navBtnStyle,
                            position: 'absolute',
                            right: '24px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(99,102,241,0.2)',
                            color: '#a5b4fc',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(99,102,241,0.4)';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                            e.currentTarget.style.color = '#a5b4fc';
                        }}
                        title="Next Slide (→)"
                    >
                        &gt;
                    </button>
                )}

                {/* Slide content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 50, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.96 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{ width: '100%', maxWidth: '900px', padding: '40px 80px', zIndex: 5 }}
                    >
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                            style={{
                                fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
                                background: 'linear-gradient(to right, #fff, #fff, #c7d2fe)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                marginBottom: '28px', lineHeight: 1.2,
                            }}
                        >
                            {slide?.title}
                        </motion.h1>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            style={{
                                width: '80px', height: '4px', borderRadius: '4px', marginBottom: '32px',
                                background: 'linear-gradient(to right, #6366f1, #a855f7)',
                                transformOrigin: 'left',
                            }}
                        />

                        <div>{renderContent(slide?.content)}</div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Bottom Audio Bar ────────────────────────────────────── */}
            <div style={{
                height: '72px', borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)',
                padding: '0 20px', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0,
            }}>
                {/* Play/Pause */}
                <button
                    onClick={toggleAudio}
                    style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: '#4f46e5', border: 'none', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 8px 20px rgba(79,70,229,0.3)', flexShrink: 0,
                    }}
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                    {audioLoading ? (
                        <div style={{
                            width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff', borderRadius: '50%', animation: 'ppt-spin 0.8s linear infinite',
                        }} />
                    ) : isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
                </button>

                {/* Progress bar */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div
                        onClick={handleProgressClick}
                        style={{
                            width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)',
                            borderRadius: '6px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            height: '100%',
                            width: audioDuration ? `${(audioProgress / audioDuration) * 100}%` : '0%',
                            background: 'linear-gradient(to right, #6366f1, #a855f7)',
                            borderRadius: '6px', transition: 'width 0.1s linear',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>
                        <span>{formatTime(audioProgress)}</span>
                        <span>{formatTime(audioDuration)}</span>
                    </div>
                </div>

                {/* Mute */}
                <button
                    onClick={toggleMute}
                    style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                        color: isMuted ? '#ef4444' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {/* Slide dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            style={{
                                width: i === currentSlide ? '22px' : '9px', height: '9px',
                                borderRadius: '9px', border: 'none', padding: 0, cursor: 'pointer',
                                background: i === currentSlide ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.3s',
                            }}
                        />
                    ))}
                </div>
            </div>

            <style>{`@keyframes ppt-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default PresentationViewer;
