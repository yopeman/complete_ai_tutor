import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const TTSButton = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    return () => {
      // Don't cancel immediately on unmount in all cases, but for this simple app it's fine.
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  const handleSpeak = () => {
    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      window.speechSynthesis.cancel(); // Cancel any current speech
      if (!text) return;
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      className={twMerge(
        "p-1.5 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
        isPlaying 
          ? "text-indigo-400 bg-indigo-500/10" 
          : "text-slate-400 hover:text-indigo-300 hover:bg-white/5"
      )}
      title={isPlaying ? (isPaused ? "Resume reading" : "Pause reading") : "Listen"}
    >
      {isPlaying ? (
        isPaused ? (
          <><Play size={12} fill="currentColor" /> Resume</>
        ) : (
          <><Pause size={12} fill="currentColor" /> Pause</>
        )
      ) : (
        <><Volume2 size={12} /> Read Aloud</>
      )}
    </button>
  );
};

export default TTSButton;
