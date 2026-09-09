import React, { useState, useMemo } from 'react';
import { BookmarkItem, StoryMode } from '../types';
import {
  Bookmark,
  X,
  Search,
  Trash2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  MapPin,
  Calendar,
  Download,
  BookOpen,
  Compass,
  Baby,
  ListChecks,
  GitCompare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkItem[];
  onRemoveBookmark: (bookmarkId: string) => void;
  onClearAllBookmarks: () => void;
  onSpeak: (text: string) => void;
  onStopSpeak: () => void;
  isSpeaking: boolean;
  onSelectMonumentToExplore?: (monumentName: string) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onClearAllBookmarks,
  onSpeak,
  onStopSpeak,
  isSpeaking,
  onSelectMonumentToExplore,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bm) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        bm.monumentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bm.monumentLocation && bm.monumentLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        bm.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMode =
        selectedModeFilter === 'all' ||
        (bm.mode && bm.mode === selectedModeFilter) ||
        (selectedModeFilter === 'standard' && (!bm.mode || bm.mode === 'standard'));

      return matchesSearch && matchesMode;
    });
  }, [bookmarks, searchQuery, selectedModeFilter]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePlay = (id: string, text: string) => {
    if (isSpeaking && currentlyPlayingId === id) {
      onStopSpeak();
      setCurrentlyPlayingId(null);
    } else {
      setCurrentlyPlayingId(id);
      onSpeak(text);
    }
  };

  const handleExportAll = () => {
    if (bookmarks.length === 0) return;

    const content = bookmarks
      .map(
        (bm, idx) =>
          `# ${idx + 1}. ${bm.monumentName} (${bm.monumentLocation || 'India'})\n` +
          `Saved on: ${new Date(bm.savedAt).toLocaleDateString()} | Mode: ${bm.mode || 'Standard'}\n\n` +
          `${bm.content}\n\n` +
          `---\n`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `heritage-monument-stories-${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatSavedDate = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const getModeBadge = (mode?: StoryMode) => {
    switch (mode) {
      case 'story':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            <BookOpen className="w-3 h-3 text-amber-700" />
            Story Mode
          </span>
        );
      case 'guide':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
            <Compass className="w-3 h-3 text-purple-700" />
            Tourist Guide
          </span>
        );
      case 'child':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Baby className="w-3 h-3 text-emerald-700" />
            Child-Friendly
          </span>
        );
      case 'facts':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
            <ListChecks className="w-3 h-3 text-blue-700" />
            Fact Sheet
          </span>
        );
      case 'compare':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
            <GitCompare className="w-3 h-3 text-rose-700" />
            Comparison
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-300">
            <Sparkles className="w-3 h-3 text-amber-700" />
            Narrative
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-300 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-amber-900 text-stone-100 flex items-center justify-between border-b border-amber-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-800 flex items-center justify-center text-amber-200 border border-amber-700 shadow-inner">
              <Bookmark className="w-5 h-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Cinzel'] font-bold text-base sm:text-lg text-amber-50">
                  Saved Monument Stories
                </h2>
                <span className="text-[11px] bg-amber-800/90 text-amber-200 px-2 py-0.5 rounded-full font-semibold border border-amber-700">
                  {bookmarks.length} {bookmarks.length === 1 ? 'Story' : 'Stories'}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Stored in local browser storage for offline reading & study
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {bookmarks.length > 0 && (
              <button
                onClick={handleExportAll}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs font-medium border border-amber-600/50 transition-colors"
                title="Download all saved stories as a Markdown file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export (.md)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-amber-800/80 text-amber-200 transition-colors"
              title="Close bookmarks"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        {bookmarks.length > 0 && (
          <div className="px-5 py-3 bg-amber-50/60 border-b border-stone-200 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved stories or monuments..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-700 text-stone-800 placeholder:text-stone-400"
              />
            </div>

            {/* Mode filter buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                onClick={() => setSelectedModeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  selectedModeFilter === 'all'
                    ? 'bg-amber-800 text-white font-semibold'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                All ({bookmarks.length})
              </button>
              <button
                onClick={() => setSelectedModeFilter('story')}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  selectedModeFilter === 'story'
                    ? 'bg-amber-800 text-white font-semibold'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                Stories
              </button>
              <button
                onClick={() => setSelectedModeFilter('guide')}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  selectedModeFilter === 'guide'
                    ? 'bg-amber-800 text-white font-semibold'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                Guided Tours
              </button>
              <button
                onClick={() => setSelectedModeFilter('child')}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  selectedModeFilter === 'child'
                    ? 'bg-amber-800 text-white font-semibold'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                Child Friendly
              </button>
              <button
                onClick={() => setSelectedModeFilter('facts')}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  selectedModeFilter === 'facts'
                    ? 'bg-amber-800 text-white font-semibold'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                Facts
              </button>
            </div>
          </div>
        )}

        {/* Stories Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-stone-50/50">
          {bookmarks.length === 0 ? (
            <div className="py-14 px-4 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center mb-4 shadow-sm border border-amber-200">
                <Bookmark className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="font-['Cinzel'] font-bold text-base sm:text-lg text-stone-800 mb-1.5">
                No Bookmarked Stories Yet
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-5">
                Save your favorite historical narratives, guided tours, and architectural fact sheets for later by clicking the bookmark ribbon on any story response. All bookmarks persist automatically in your browser's local storage.
              </p>
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-left shadow-xs">
                <span className="text-[11px] font-bold text-amber-900 block mb-1.5">
                  How to bookmark:
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
                  When Heritage Storyteller shares a story, look for the <Bookmark className="w-3 h-3 inline text-amber-700" /> bookmark button at the top of the message card and click it to save.
                </p>
                {onSelectMonumentToExplore && (
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-stone-500 w-full mb-1">
                      Try exploring these iconic sites:
                    </span>
                    {['Taj Mahal', 'Qutub Minar', 'Sun Temple, Konark', 'Ajanta Caves'].map((monument) => (
                      <button
                        key={monument}
                        onClick={() => {
                          onClose();
                          onSelectMonumentToExplore(monument);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        {monument}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <p className="text-sm font-medium mb-1">No bookmarked stories matched your filter</p>
              <p className="text-xs text-stone-400">
                Try searching for a different keyword or resetting your mode filter.
              </p>
            </div>
          ) : (
            filteredBookmarks.map((bm) => {
              const isExpanded = expandedStoryId === bm.id;
              const isCurrentPlaying = isSpeaking && currentlyPlayingId === bm.id;
              const isCopied = copiedId === bm.id;

              return (
                <div
                  key={bm.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-amber-300 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 mb-3 border-b border-stone-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-['Cinzel'] font-bold text-base text-stone-900">
                          {bm.monumentName}
                        </h3>
                        {getModeBadge(bm.mode)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        {bm.monumentLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-700" />
                            {bm.monumentLocation}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          Saved {formatSavedDate(bm.savedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePlay(bm.id, bm.content)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                          isCurrentPlaying
                            ? 'bg-amber-700 text-white border-amber-800 animate-pulse'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                        title={isCurrentPlaying ? 'Stop narration' : 'Listen to story'}
                      >
                        {isCurrentPlaying ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden xs:inline text-[11px]">
                          {isCurrentPlaying ? 'Stop' : 'Listen'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleCopy(bm.id, bm.content)}
                        className="p-1.5 rounded-lg border bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 text-xs transition-colors"
                        title="Copy story text"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => onRemoveBookmark(bm.id)}
                        className="p-1.5 rounded-lg border bg-stone-50 hover:bg-rose-50 text-stone-500 hover:text-rose-700 border-stone-200 hover:border-rose-200 text-xs transition-colors"
                        title="Remove from bookmarks"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Story preview / Full content */}
                  <div className="text-stone-800 text-xs sm:text-sm">
                    {isExpanded ? (
                      <div className="prose prose-stone prose-sm max-w-none prose-headings:font-['Cinzel'] prose-headings:text-amber-950 prose-headings:font-bold prose-h2:text-base prose-h2:border-b prose-h2:border-amber-200/60 prose-h2:pb-1 prose-h2:mt-3 prose-h2:mb-2 prose-h3:text-sm prose-p:leading-relaxed prose-p:my-1.5">
                        <ReactMarkdown>{bm.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div>
                        <p className="line-clamp-3 text-stone-600 leading-relaxed">
                          {bm.content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').slice(0, 320)}...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Toggle view button */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setExpandedStoryId(isExpanded ? null : bm.id)}
                      className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      {isExpanded ? 'Collapse Story' : 'Read Full Story'}
                    </button>

                    {onSelectMonumentToExplore && (
                      <button
                        onClick={() => {
                          onClose();
                          onSelectMonumentToExplore(bm.monumentName);
                        }}
                        className="text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
                      >
                        <span>Explore in Chat</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        {bookmarks.length > 0 && (
          <div className="px-5 py-3 bg-stone-100/80 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
            <span className="text-[11px] text-stone-500">
              {filteredBookmarks.length} of {bookmarks.length} saved {bookmarks.length === 1 ? 'story' : 'stories'} shown
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to remove all saved monument bookmarks?')) {
                    onClearAllBookmarks();
                  }
                }}
                className="text-rose-700 hover:text-rose-900 font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Bookmarks</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
