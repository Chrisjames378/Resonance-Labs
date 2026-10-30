import React from 'react';
import { Cpu } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenWaitlist: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onOpenWaitlist }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element brand wordmark */}
        <button
          onClick={() => onSelectTab('designer')}
          className="flex items-center gap-2.5 text-left text-slate-100 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
        >
          <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition-colors">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">Resonance Labs</span>
        </button>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400" aria-label="Main Navigation">
          <button
            onClick={() => onSelectTab('designer')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-left ${
              activeTab === 'designer'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Studio Canvas
          </button>
          
          <button
            onClick={() => onSelectTab('metacognition')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-left ${
              activeTab === 'metacognition'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Actor-Critic Console
          </button>

          <button
            onClick={() => onSelectTab('router')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-left ${
              activeTab === 'router'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Multi-Model Router
          </button>

          <button
            onClick={() => onSelectTab('curriculum')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-left ${
              activeTab === 'curriculum'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Curriculum (Lesson 01)
          </button>

          <button
            onClick={() => onSelectTab('audio')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-left ${
              activeTab === 'audio'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Audio Core & Waveforms
          </button>

          <button
            onClick={() => onSelectTab('database')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-left ${
              activeTab === 'database'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            Database & API Gateway
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenWaitlist}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors whitespace-nowrap shrink-0 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Join Developer Waitlist
          </button>
        </div>
      </div>
    </header>
  );
};
