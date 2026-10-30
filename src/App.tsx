import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { NeuralDesigner } from './components/NeuralDesigner.tsx';
import { MetacognitiveConsole } from './components/MetacognitiveConsole.tsx';
import { ModelRouter } from './components/ModelRouter.tsx';
import { CurriculumLesson } from './components/CurriculumLesson.tsx';
import { DatabaseApiInspector } from './components/DatabaseApiInspector.tsx';
import { AudioWaveformVisualizer } from './components/AudioWaveformVisualizer.tsx';
import { WaitlistModal } from './components/WaitlistModal.tsx';
import { PricingModal } from './components/PricingModal.tsx';
import { UserSubscription, SubscriptionTier } from './types/index.ts';
import { getUserBilling } from './services/api.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('designer');
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [pricingInitialTier, setPricingInitialTier] = useState<SubscriptionTier>('pro');

  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    userId: 'demo-user-1',
    email: 'chris.james378@gmail.com',
    tier: 'pro',
    billingStatus: 'ACTIVE',
    billingCycle: 'monthly',
    tokenBalance: 8450,
    tokensConsumed: 1550,
    tokenLimitMonthly: 10000,
    paypalSubscriptionId: 'I-BW0K948D4U6E',
    paypalCustomerId: 'CUST-RES-378',
    lastPaymentDate: new Date(Date.now() - 6 * 86400000).toISOString(),
    nextBillingDate: new Date(Date.now() + 24 * 86400000).toISOString()
  });

  useEffect(() => {
    getUserBilling('demo-user-1')
      .then((sub) => {
        if (sub) {
          setUserSubscription(sub);
        }
      })
      .catch((err) => {
        console.warn('Failed to load initial billing status:', err);
      });
  }, []);

  const handleOpenPricing = (tier?: SubscriptionTier) => {
    if (tier) {
      setPricingInitialTier(tier);
    }
    setIsPricingOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* 1-Row 3-Zone Top Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenWaitlist={() => setIsWaitlistOpen(true)}
        userSubscription={userSubscription}
        onOpenPricing={handleOpenPricing}
      />

      {/* Hero Section (Displayed on Studio Canvas) */}
      {activeTab === 'designer' && (
        <HeroSection
          onNavigate={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenWaitlist={() => setIsWaitlistOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'designer' && (
          <NeuralDesigner
            onSimulationRun={(_params) => {
              // Simulated WebGPU event
            }}
          />
        )}

        {activeTab === 'metacognition' && (
          <MetacognitiveConsole />
        )}

        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                Autonomous Audio Core Engine & Waveforms
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Real-time Web Audio API processor worklet generating sympathetic harmonics with 60FPS dual-mode frequency spectrum and oscilloscope rendering.
              </p>
            </div>
            <AudioWaveformVisualizer initialEmpathy={0.85} />
          </div>
        )}

        {activeTab === 'router' && (
          <ModelRouter />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumLesson
            onNavigateToStudio={() => {
              setActiveTab('designer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseApiInspector />
        )}
      </main>

      {/* Quiet Production Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Resonance Labs</span>
            <span aria-hidden="true">·</span>
            <span>Computational Metacognition R&D</span>
            <span aria-hidden="true">·</span>
            <span>PayPal Billing Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              onClick={() => handleOpenPricing()}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Pricing & Plans ($29/mo)
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className="hover:text-slate-300 transition-colors"
            >
              Audio Worklet Core
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className="hover:text-slate-300 transition-colors"
            >
              PostgreSQL Schema (DDL)
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className="hover:text-slate-300 transition-colors"
            >
              Curriculum Lesson 01
            </button>
            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Developer Waitlist
            </button>
          </div>
        </div>
      </footer>

      {/* Waitlist Registration Modal */}
      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />

      {/* Interactive PayPal Pricing & Checkout Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentSubscription={userSubscription}
        onSubscriptionUpdated={(updated) => setUserSubscription(updated)}
        initialSelectedTier={pricingInitialTier}
      />

    </div>
  );
}
