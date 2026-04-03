import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

const VoiceInputButton = ({ onRecordingComplete, isDisabled }) => {
    const { isRecording, formatTime, recordingTime, startRecording, stopRecording, audioBlob, setAudioBlob } = useVoiceRecorder();

    React.useEffect(() => {
        if (audioBlob) {
            onRecordingComplete(audioBlob);
            setAudioBlob(null);
        }
    }, [audioBlob, onRecordingComplete, setAudioBlob]);

    return (
        <div className="flex items-center gap-2">
            {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-[11px] font-bold text-red-500 font-mono">{formatTime(recordingTime)}</span>
                </div>
            )}
            <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isDisabled}
                className={`
                    w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 shadow-lg
                    ${isRecording
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-600/25 active:scale-95'
                        : 'bg-slate-700 hover:bg-slate-600 shadow-black/20 text-slate-300 hover:text-white'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
            >
                {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
            </button>
        </div>
    );
};

export default VoiceInputButton;
