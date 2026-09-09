import React from 'react';
import { Volume2, Pause, Play, Square } from 'lucide-react';

interface AudioNarrationBarProps {
  isSpeaking: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const AudioNarrationBar: React.FC<AudioNarrationBarProps> = ({
  isSpeaking,
  isPaused,
  onPause,
  onResume,
  onStop,
}) => {
  if (!isSpeaking) return null;

  return (
    <div
      role="region"
      aria-label="Audio narration controls"
      className="fixed bottom-4 right-4 z-40 bg-stone-900/95 text-stone-100 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-500/40 backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-amber-600/30 flex items-center justify-center text-amber-400">
          <Volume2 className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <span className="text-xs font-semibold block text-amber-300">
            {isPaused ? 'Narration Paused' : 'Heritage Storyteller Narrating...'}
          </span>
          <span className="text-[10px] text-stone-400">Audio tour guide (en-IN)</span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2 border-l border-stone-700 pl-3">
        {isPaused ? (
          <button
            type="button"
            onClick={onResume}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center justify-center shadow-xs"
            title="Resume narration"
            aria-label="Resume narration"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors flex items-center justify-center shadow-xs"
            title="Pause narration"
            aria-label="Pause narration"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
        )}

        <button
          type="button"
          onClick={onStop}
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-stone-800 hover:bg-red-900/80 text-red-300 hover:text-white transition-colors flex items-center justify-center shadow-xs"
          title="Stop narration"
          aria-label="Stop narration"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
