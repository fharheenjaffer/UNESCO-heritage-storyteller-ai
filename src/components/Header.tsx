import React from 'react';
import { Landmark, BookOpen, Sparkles, FolderUp, RotateCcw, Bookmark } from 'lucide-react';

interface HeaderProps {
  monumentsCount: number;
  onOpenKnowledgeModal: () => void;
  onResetChat: () => void;
  customDocsCount: number;
  bookmarksCount: number;
  onOpenBookmarksModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  monumentsCount,
  onOpenKnowledgeModal,
  onResetChat,
  customDocsCount,
  bookmarksCount,
  onOpenBookmarksModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-amber-900 text-stone-100 shadow-md border-b border-amber-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-inner text-amber-50 border border-amber-400/30">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Cinzel'] text-lg sm:text-xl font-bold tracking-wide text-amber-100">
                Heritage Storyteller AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-800/80 text-amber-200 border border-amber-700/50">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Indian Monuments
              </span>
            </div>
            <p className="text-xs text-amber-200/80 hidden xs:block">
              Historically grounded storytelling & architectural exploration
            </p>
          </div>
        </div>

        {/* Actions & Knowledge Base indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="open-bookmarks-btn"
            onClick={onOpenBookmarksModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/60 hover:bg-amber-950/90 text-amber-100 border border-amber-700/60 transition-colors shadow-sm"
            title="Saved Monument Stories in Browser Storage"
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarksCount > 0 ? 'fill-amber-300 text-amber-300' : 'text-amber-300'}`} />
            <span>Saved Stories</span>
            <span className="bg-amber-700 text-amber-100 font-semibold px-1.5 py-0.2 rounded-full text-[10px]">
              {bookmarksCount}
            </span>
          </button>

          <button
            id="open-knowledge-base-btn"
            onClick={onOpenKnowledgeModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/60 hover:bg-amber-950/90 text-amber-100 border border-amber-700/60 transition-colors shadow-sm"
            title="Manage Monument Knowledge Files"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>Knowledge Base</span>
            <span className="bg-amber-700 text-amber-100 font-semibold px-1.5 py-0.2 rounded-full text-[10px]">
              {monumentsCount}
            </span>
            {customDocsCount > 0 && (
              <span className="bg-emerald-700 text-emerald-100 px-1 py-0.2 rounded-full text-[10px]" title="Uploaded custom docs">
                +{customDocsCount}
              </span>
            )}
          </button>

          <button
            id="reset-chat-btn"
            onClick={onResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-800/40 hover:bg-amber-800/80 text-amber-200 border border-amber-700/40 transition-colors"
            title="Start a new exploration session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>
        </div>
      </div>
    </header>
  );
};
