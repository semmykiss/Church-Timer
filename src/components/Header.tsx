import React from 'react';
import { Monitor } from 'lucide-react';

interface HeaderProps {
  currentView: 'controller' | 'stage';
  onSelectView: (view: 'controller' | 'stage') => void;
  onOpenStageScreen: () => void;
  onOpenShareModal: () => void;
  onOpenThemeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenStageScreen,
  onOpenShareModal,
  onOpenThemeModal,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
        >
          SanctuaryTimer
        </a>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onSelectView('controller')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'controller' ? 'text-white font-semibold underline underline-offset-8 decoration-emerald-500' : 'text-slate-400'
          }`}
        >
          Director Console
        </button>
        <button
          onClick={() => onSelectView('stage')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'stage' ? 'text-white font-semibold underline underline-offset-8 decoration-emerald-500' : 'text-slate-400'
          }`}
        >
          Stage Display
        </button>
        <button
          onClick={onOpenShareModal}
          className="text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Online URLs
        </button>
        <button
          onClick={onOpenThemeModal}
          className="text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Theme & Colors
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenStageScreen}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Monitor className="w-4 h-4" />
          <span>Open Stage Screen</span>
        </button>
      </div>
    </header>
  );
};
