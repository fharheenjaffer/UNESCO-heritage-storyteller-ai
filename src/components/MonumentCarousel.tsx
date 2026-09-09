import React from 'react';
import { MonumentKnowledgeDoc } from '../types';
import { Landmark, MapPin, Award, UploadCloud, HelpCircle } from 'lucide-react';

interface MonumentCarouselProps {
  monuments: MonumentKnowledgeDoc[];
  selectedMonumentId?: string;
  onSelectMonument: (monument: MonumentKnowledgeDoc) => void;
  onTestUnknownMonument: () => void;
}

export const MonumentCarousel: React.FC<MonumentCarouselProps> = ({
  monuments,
  selectedMonumentId,
  onSelectMonument,
  onTestUnknownMonument,
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-amber-800" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-800 font-['Cinzel']">
            Monuments In Knowledge Base ({monuments.length})
          </h2>
        </div>
        <button
          onClick={onTestUnknownMonument}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-amber-800 hover:underline transition-colors"
          title="Verify Rule 5: Check how AI responds to monuments absent from the knowledge files"
        >
          <HelpCircle className="w-3 h-3 text-stone-500" />
          <span>Test Unindexed Monument (Rule 5)</span>
        </button>
      </div>

      {/* Horizontal Scrollable Bar */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-300">
        {monuments.map((m) => {
          const isSelected = selectedMonumentId === m.id;
          return (
            <button
              key={m.id}
              id={`monument-card-${m.id}`}
              onClick={() => onSelectMonument(m)}
              className={`flex-shrink-0 w-52 sm:w-56 text-left p-2.5 rounded-xl border transition-all duration-150 relative group ${
                isSelected
                  ? 'border-amber-700 bg-amber-50/90 shadow-sm ring-2 ring-amber-600/60'
                  : 'border-amber-200/70 bg-white/90 hover:border-amber-400 hover:bg-amber-50/40'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-semibold text-xs text-stone-900 line-clamp-1 group-hover:text-amber-900">
                  {m.name}
                </span>
                {m.unescoStatus && (
                  <span
                    className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1 py-0.2 rounded"
                    title="UNESCO World Heritage Site"
                  >
                    <Award className="w-2.5 h-2.5" />
                    UNESCO
                  </span>
                )}
                {m.isCustom && (
                  <span
                    className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/90 px-1 py-0.2 rounded"
                    title="User Uploaded Knowledge File"
                  >
                    <UploadCloud className="w-2.5 h-2.5" />
                    Custom
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] text-stone-600 mb-1.5 line-clamp-1">
                <MapPin className="w-3 h-3 text-amber-700 flex-shrink-0" />
                <span>{m.location}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-500 border-t border-stone-100 pt-1.5">
                <span className="truncate max-w-[140px]">{m.builtBy || m.era || 'Historic India'}</span>
                <span className="font-medium text-amber-800 text-[9px] uppercase tracking-wider">
                  {isSelected ? 'Selected' : 'Explore'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
