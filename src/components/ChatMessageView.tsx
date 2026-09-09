import React, { useState } from 'react';
import { ChatMessage, MonumentKnowledgeDoc } from '../types';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  MapPin,
  Landmark,
  Compass,
  Baby,
  BookOpen,
  ListChecks,
  AlertCircle,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageViewProps {
  message: ChatMessage;
  onSpeak: (text: string) => void;
  onStopSpeak: () => void;
  isSpeakingThis: boolean;
  onSelectMonumentChip?: (monument: MonumentKnowledgeDoc) => void;
  availableMonuments?: MonumentKnowledgeDoc[];
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export const ChatMessageView: React.FC<ChatMessageViewProps> = ({
  message,
  onSpeak,
  onStopSpeak,
  isSpeakingThis,
  onSelectMonumentChip,
  availableMonuments = [],
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xl bg-amber-900 text-stone-50 rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border border-amber-800">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
              Explorer
            </span>
            {message.mode && message.mode !== 'standard' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-800 text-amber-200 border border-amber-700/60 font-medium">
                {message.mode === 'story' && '📖 Story Mode'}
                {message.mode === 'child' && '🧒 Child Friendly'}
                {message.mode === 'facts' && '📋 Facts'}
                {message.mode === 'guide' && '🎙️ Tourist Guide'}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant response
  const isNotFound =
    message.isNotFound ||
    message.content.includes('I could not find this information in my monument knowledge collection.');

  return (
    <div className="flex justify-start mb-6">
      <div className="w-full max-w-3xl bg-white border border-stone-200/90 rounded-2xl rounded-tl-sm p-4 sm:p-6 shadow-sm">
        {/* Assistant Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-800 text-amber-50 flex items-center justify-center text-xs shadow-sm">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="font-['Cinzel'] font-bold text-xs sm:text-sm text-stone-900 tracking-wide">
                Heritage Storyteller AI
              </span>
              <span className="text-[11px] text-stone-500 block sm:inline sm:ml-2">
                Grounding: Uploaded Monument Knowledge Files
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Requirement 2 & 4: Speaker button 🔊 for voice output */}
            <button
              type="button"
              id={`speaker-btn-${message.id}`}
              onClick={() => {
                if (isSpeakingThis) {
                  onStopSpeak();
                } else {
                  onSpeak(message.content);
                }
              }}
              className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs select-none ${
                isSpeakingThis
                  ? 'bg-amber-800 text-white border-amber-900 ring-2 ring-amber-400/60 animate-pulse'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
              title={isSpeakingThis ? 'Stop speaking narration' : 'Read aloud with audio tour guide voice'}
              aria-label={isSpeakingThis ? 'Stop speaking this response' : 'Read this response aloud'}
            >
              {isSpeakingThis ? (
                <>
                  <VolumeX className="w-4 h-4 text-amber-200" />
                  <span className="font-semibold text-amber-100">Stop Speaking</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-amber-800" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl border bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200 text-xs transition-colors flex items-center justify-center shadow-2xs"
              title="Copy response text"
              aria-label="Copy response text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {!isNotFound && onToggleBookmark && (
              <button
                type="button"
                onClick={onToggleBookmark}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors shadow-2xs ${
                  isBookmarked
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-medium'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                }`}
                title={isBookmarked ? 'Remove story from bookmarks' : 'Save story to bookmarks'}
                aria-label={isBookmarked ? 'Remove from bookmarks' : 'Save to bookmarks'}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isBookmarked ? 'fill-amber-700 text-amber-700' : 'text-stone-600'
                  }`}
                />
                <span className="hidden sm:inline text-xs">
                  {isBookmarked ? 'Saved' : 'Bookmark'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Content presentation */}
        {isNotFound ? (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 my-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-stone-800 mb-1">
                  "I could not find this information in my monument knowledge collection."
                </p>
                <p className="text-xs text-stone-600 leading-relaxed mb-3">
                  Under strict historical accuracy rules, I only describe monuments present in my verified uploaded knowledge repository.
                </p>
                {availableMonuments.length > 0 && (
                  <div>
                    <span className="text-[11px] font-medium text-stone-700 uppercase tracking-wider block mb-1.5">
                      Explore an indexed monument from the collection:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableMonuments.slice(0, 6).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => onSelectMonumentChip?.(m)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-amber-100 text-stone-800 border border-stone-200 font-medium transition-colors"
                        >
                          🏛️ {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="prose prose-stone prose-sm max-w-none prose-headings:font-['Cinzel'] prose-headings:text-amber-950 prose-headings:font-bold prose-h2:text-base prose-h2:border-b prose-h2:border-amber-200/60 prose-h2:pb-1 prose-h2:mt-4 prose-h2:mb-2 prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1.5 prose-p:leading-relaxed prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Rule 9 reminder badge / prompt pill */}
        {!isNotFound && message.content.includes('Would you like to explore another monument?') && (
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
            <span className="flex items-center gap-1 text-amber-800 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Ready for the next historical journey
            </span>
            <span className="text-[11px] text-stone-400">
              Select any monument above or ask about another site
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
