import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Square,
} from 'lucide-react';

interface VoiceStatusBarProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  speechError: string | null;
  onDismissError: () => void;
  isSpeechSupported: boolean;
  onStopSpeaking: () => void;
  onStopListening: () => void;
  interimTranscript?: string;
  selectedLanguage?: string;
}

export const VoiceStatusBar: React.FC<VoiceStatusBarProps> = ({
  isListening,
  isProcessing,
  isSpeaking,
  autoSpeak,
  onToggleAutoSpeak,
  speechError,
  onDismissError,
  isSpeechSupported,
  onStopSpeaking,
  onStopListening,
  interimTranscript,
  selectedLanguage = 'English (India)',
}) => {
  return (
    <div className="w-full space-y-2 mb-2">
      {/* Active State Banners (Accessibility Statuses: Listening..., Processing..., Speaking...) */}

      {/* 1. Listening Status */}
      {isListening && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 bg-red-500/15 border-2 border-red-500 text-red-950 px-3.5 py-2.5 rounded-xl shadow-sm animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-red-600" />
                  Listening...
                </span>
                <span className="text-[11px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-medium">
                  {selectedLanguage} (en-IN)
                </span>
              </div>
              <p className="text-xs text-stone-800 mt-0.5 truncate italic font-serif">
                {interimTranscript ? `"${interimTranscript}"` : 'Speak your monument question now...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStopListening}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors flex-shrink-0"
            aria-label="Stop listening"
          >
            <MicOff className="w-4 h-4" />
            <span className="hidden xs:inline">Done</span>
          </button>
        </div>
      )}

      {/* 2. Processing Status */}
      {isProcessing && !isListening && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 bg-amber-100/90 border border-amber-300 text-amber-950 px-3.5 py-2 rounded-xl text-xs font-medium animate-in fade-in"
        >
          <Loader2 className="w-4 h-4 text-amber-800 animate-spin flex-shrink-0" />
          <span>
            <strong>Processing...</strong> Converting speech to text and preparing your guide query.
          </span>
        </div>
      )}

      {/* 3. Speaking Status */}
      {isSpeaking && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2.5 bg-amber-900 text-amber-50 px-3.5 py-2.5 rounded-xl text-xs shadow-sm animate-in fade-in border border-amber-700"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex items-center gap-0.5 h-4 flex-shrink-0">
              <span className="w-1 h-3 bg-amber-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-4 bg-amber-200 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce"></span>
              <span className="w-1 h-4 bg-amber-300 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
            </div>
            <div className="truncate">
              <span className="font-bold text-amber-200 uppercase tracking-wider text-[11px] block">
                Speaking...
              </span>
              <span className="text-stone-300 text-[11px] truncate block">
                Heritage Audio Tour Guide narration in English (India)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onStopSpeaking}
            className="min-h-[44px] px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-red-800 text-amber-100 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-amber-600 flex-shrink-0"
            aria-label="Stop speaking response"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Speaking</span>
          </button>
        </div>
      )}

      {/* Fallback Warning: Speech recognition unsupported or error */}
      {speechError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-2 bg-amber-50 border border-amber-300 text-amber-950 p-2.5 rounded-xl text-xs animate-in fade-in"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-900">Speech Notice</span>
              <p className="text-stone-700 text-[11px] leading-relaxed">{speechError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="text-stone-500 hover:text-stone-800 p-1 text-xs"
            aria-label="Dismiss error notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Voice Controls Bar: Auto-Speak Toggle & Language Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1 text-xs">
        {/* Requirement 3: Auto-Speak Mode Toggle */}
        <label
          htmlFor="auto-speak-toggle"
          className="inline-flex items-center gap-2 cursor-pointer select-none py-1 group"
          title="When enabled, every bot response will be automatically narrated aloud using the audio tour guide voice"
        >
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              id="auto-speak-toggle"
              checked={autoSpeak}
              onChange={onToggleAutoSpeak}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-amber-700/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-800"></div>
          </div>
          <div className="flex items-center gap-1.5 text-stone-700 group-hover:text-stone-900">
            {autoSpeak ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-800" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
            )}
            <span className="font-semibold text-xs text-stone-800">
              Automatically read responses aloud
            </span>
          </div>
        </label>

        {/* Audio Guide Voice Badge */}
        <div className="flex items-center gap-2 text-[11px] text-stone-500">
          <span className="hidden sm:inline-flex items-center gap-1 bg-stone-100 border border-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-medium">
            <Sparkles className="w-3 h-3 text-amber-700" />
            Voice: {selectedLanguage} (en-IN)
          </span>
          {!isSpeechSupported && (
            <span className="text-amber-800 font-medium text-[10px]">
              Microphone fallback: Keyboard input active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
