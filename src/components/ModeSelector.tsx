import React from 'react';
import { StoryMode } from '../types';
import { BookOpen, Baby, ListChecks, Compass, GitCompare, Sparkles } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: StoryMode;
  onSelectMode: (mode: StoryMode) => void;
  onQuickAction: (actionPrompt: string, mode: StoryMode) => void;
  selectedMonumentName?: string;
  disabled?: boolean;
}

interface ModeConfig {
  mode: StoryMode;
  title: string;
  queryLabel: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const MODES: ModeConfig[] = [
  {
    mode: 'story',
    title: 'Storytelling',
    queryLabel: 'Tell me a story',
    description: 'Immersive historical narrative & lore',
    icon: BookOpen,
    color: 'text-amber-700 bg-amber-50 border-amber-300',
  },
  {
    mode: 'guide',
    title: 'Tourist Guide',
    queryLabel: 'Act as a tourist guide',
    description: 'Professional walking tour on site',
    icon: Compass,
    color: 'text-purple-700 bg-purple-50 border-purple-300',
  },
  {
    mode: 'child',
    title: 'For a Child',
    queryLabel: 'Explain for a child',
    description: 'Simple language for a 10-year-old',
    icon: Baby,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  },
  {
    mode: 'facts',
    title: 'Give Facts',
    queryLabel: 'Give me facts',
    description: 'Concise factual bullet points',
    icon: ListChecks,
    color: 'text-blue-700 bg-blue-50 border-blue-300',
  },
  {
    mode: 'compare',
    title: 'Compare',
    queryLabel: 'Compare monuments',
    description: 'Compare with another dataset monument',
    icon: GitCompare,
    color: 'text-rose-700 bg-rose-50 border-rose-300',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  onQuickAction,
  selectedMonumentName,
  disabled,
}) => {
  return (
    <div className="bg-amber-100/40 border border-amber-200/80 rounded-xl p-3 sm:p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 font-['Cinzel']">
            Special Guide Modes
          </span>
        </div>
        <p className="text-[11px] text-stone-600">
          Click any prompt below to query {selectedMonumentName ? `"${selectedMonumentName}"` : 'the active monument'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {MODES.map((item) => {
          const Icon = item.icon;
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              id={`mode-btn-${item.mode}`}
              disabled={disabled}
              onClick={() => {
                onSelectMode(item.mode);
                const queryText = selectedMonumentName
                  ? `${item.queryLabel} about ${selectedMonumentName}`
                  : item.queryLabel;
                onQuickAction(queryText, item.mode);
              }}
              className={`text-left p-2.5 rounded-lg border transition-all duration-200 group flex flex-col justify-between ${
                isActive
                  ? 'border-amber-700 bg-amber-50 shadow-sm ring-1 ring-amber-700'
                  : 'border-stone-200/90 bg-white/90 hover:border-amber-400 hover:bg-amber-50/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-stone-900">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-800' : 'text-stone-600 group-hover:text-amber-700'}`} />
                  <span>"{item.queryLabel}"</span>
                </div>
              </div>
              <span className="text-[10px] text-stone-500 leading-tight">
                {item.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

