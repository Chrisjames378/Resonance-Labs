import React from 'react';
import { Cpu, Zap, Coins, Sparkles } from 'lucide-react';
import { UserSubscription, SubscriptionTier } from '../types/index.ts';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenWaitlist: () => void;
  userSubscription?: UserSubscription;
  onOpenPricing?: (tier?: SubscriptionTier) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  onSelectTab, 
  onOpenWaitlist,
  userSubscription,
  onOpenPricing
}) => {
  const tier = userSubscription?.tier || 'hobby';
  const tokenBalance = userSubscription?.tokenBalance ?? 1000;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => onSelectTab('designer')}
          className="flex items-center gap-2.5 text-left text-slate-100 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm"
        >
          <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition-colors">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">Resonance Labs</span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-slate-400" aria-label="Main Navigation">
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
            Curriculum
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

        {/* Zone 3: Active Tier Badge, Token Meter & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          
          {/* Token Balance Counter Pill */}
          {onOpenPricing && (
            <button
              onClick={() => onOpenPricing()}
              title="Click to refill Gemini Interaction tokens"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs font-mono transition-colors group"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-slate-300 font-semibold">{tokenBalance.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">Tokens</span>
              <span className="text-amber-400 font-bold ml-0.5 text-xs">+</span>
            </button>
          )}

          {/* Active Subscription Tier Pill */}
          {onOpenPricing && (
            tier === 'hobby' ? (
              <button
                onClick={() => onOpenPricing('pro')}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Click to upgrade to Pro Researcher tier via PayPal"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Hobby</span>
                <span className="text-emerald-400 font-bold text-[11px] ml-0.5 hidden sm:inline">Upgrade ($29)</span>
              </button>
            ) : tier === 'pro' ? (
              <button
                onClick={() => onOpenPricing()}
                className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/60 rounded text-xs font-mono text-emerald-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-colors"
                title="Active PayPal Pro Subscription - Click to manage or view tiers"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span className="font-bold text-[11px] tracking-wide">PRO</span>
                <span className="text-[10px] text-emerald-400/80 font-normal hidden sm:inline">Researcher</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenPricing()}
                className="px-2.5 py-1 bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/60 rounded text-xs font-mono text-cyan-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-colors"
                title="Active PayPal Enterprise Subscription - Click to manage"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-[11px] tracking-wide">STUDIO</span>
              </button>
            )
          )}

          {/* Pricing CTA */}
          {onOpenPricing && (
            <button
              onClick={() => onOpenPricing()}
              className="px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 rounded transition-colors whitespace-nowrap shrink-0 hidden md:inline-flex items-center gap-1"
            >
              <span>Pricing</span>
            </button>
          )}

          {/* Waitlist Button */}
          <button
            onClick={onOpenWaitlist}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors whitespace-nowrap shrink-0 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Waitlist
          </button>
        </div>
      </div>
    </header>
  );
};
