import React from 'react';
import { Volume2, Pause, Play, Square } from 'lucide-react';

interface AudioNarrationBarProps {
  isSpeaking: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  currentTitle?: string;
}

export const AudioNarrationBar: React.FC<AudioNarrationBarProps> = ({
  isSpeaking,
  isPaused,
  onPause,
  onResume,
  onStop,
  currentTitle,
}) => {
  if (!isSpeaking) return null;

  return (
    <div
      role="region"
      aria-label="Voice Assistant audio narration controls"
      className="fixed bottom-4 right-4 z-40 bg-stone-900/95 text-stone-100 px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-500/50 backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-amber-600/30 flex items-center justify-center text-amber-400 relative">
          <Volume2 className="w-5 h-5 animate-pulse" />
          {!isPaused && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          )}
        </div>
        <div className="max-w-[200px] sm:max-w-[280px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
              🎙️ Voice Assistant
            </span>
            {!isPaused && (
              <span className="flex items-center gap-0.5 h-2.5">
                <span className="w-0.5 h-2 bg-amber-400 animate-pulse"></span>
                <span className="w-0.5 h-3 bg-amber-300 animate-pulse delay-75"></span>
                <span className="w-0.5 h-1.5 bg-amber-400 animate-pulse delay-150"></span>
              </span>
            )}
          </div>
          <span className="text-xs font-semibold block text-stone-100 truncate">
            {isPaused ? 'Narration Paused' : currentTitle || 'Narrating Story & Facts...'}
          </span>
          <span className="text-[10px] text-stone-400">Audio tour guide (en-IN)</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 ml-2 border-l border-stone-700 pl-3">
        {isPaused ? (
          <button
            type="button"
            onClick={onResume}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer"
            title="Resume narration"
            aria-label="Resume voice narration"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors flex items-center justify-center shadow-xs cursor-pointer"
            title="Pause narration"
            aria-label="Pause voice narration"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
        )}

        <button
          type="button"
          onClick={onStop}
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-stone-800 hover:bg-red-900/80 text-red-300 hover:text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer"
          title="Stop narration"
          aria-label="Stop voice narration"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
