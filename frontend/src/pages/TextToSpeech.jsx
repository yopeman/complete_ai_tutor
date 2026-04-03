import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, Square, ArrowLeft, Volume2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TextToSpeech = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const textToRead = location.state?.text || '';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  // Initialize SpeechSynthesis on mount
  useEffect(() => {
    if (!textToRead) return;

    const synth = window.speechSynthesis;
    // Cancel any ongoing speech when mounting to ensure clean slate
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance;

    // Handle end of speech
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        console.error('SpeechSynthesis error:', event.error);
      }
      setIsPlaying(false);
      setIsPaused(false);
    };

    // Auto-play immediately
    synth.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);

    return () => {
      // Cleanup on unmount
      synth.cancel();
    };
  }, [textToRead]);

  const handlePlayPause = () => {
    const synth = window.speechSynthesis;
    if (isPlaying) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    } else {
      if (utteranceRef.current) {
        synth.speak(utteranceRef.current);
        setIsPlaying(true);
        setIsPaused(false);
      }
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleBack = () => {
    navigate(-1); // Go back to the chat history
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Immersive Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-violet-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
        
        {/* Pulsing effect when playing */}
        <div className={twMerge(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[50vh] bg-emerald-500/5 rounded-full blur-[150px] transition-opacity duration-1000",
          isPlaying && !isPaused ? "opacity-100 animate-pulse" : "opacity-0"
        )}></div>
      </div>

      {/* Header */}
      <header className="h-20 flex items-center px-8 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl relative z-20 shrink-0">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="ml-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Volume2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Active Reader</h1>
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Listening Mode</p>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="max-w-3xl mx-auto w-full px-6 py-12 pb-32">
          {!textToRead ? (
            <div className="text-center mt-20">
              <p className="text-slate-400">No text provided to read.</p>
              <button 
                onClick={handleBack}
                className="mt-6 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="prose prose-invert prose-lg md:prose-xl max-w-none
              prose-p:text-slate-200 prose-p:leading-relaxed prose-p:mb-6
              prose-headings:text-white prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
              prose-strong:text-white prose-strong:font-bold
              prose-code:bg-slate-900/80 prose-code:text-emerald-400 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-base prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-2xl prose-pre:my-6 prose-pre:p-6
              prose-ul:my-4 prose-li:text-slate-300 prose-li:my-2
              prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/10 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:text-slate-300
              prose-a:text-indigo-400 md:leading-[1.8]"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{textToRead}</ReactMarkdown>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Player Controls */}
      {textToRead && (
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-30">
          <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-center gap-6">
            
            <button
              onClick={handleStop}
              disabled={!isPlaying && !isPaused}
              className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Stop"
            >
              <Square size={20} fill="currentColor" />
            </button>

            <button
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95"
              title={isPlaying && !isPaused ? "Pause" : "Play"}
            >
              {isPlaying && !isPaused ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
