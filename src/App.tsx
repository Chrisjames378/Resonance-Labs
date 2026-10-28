import { useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { NeuralDesigner } from './components/NeuralDesigner.tsx';
import { MetacognitiveConsole } from './components/MetacognitiveConsole.tsx';
import { ModelRouter } from './components/ModelRouter.tsx';
import { CurriculumLesson } from './components/CurriculumLesson.tsx';
import { DatabaseApiInspector } from './components/DatabaseApiInspector.tsx';
import { WaitlistModal } from './components/WaitlistModal.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('designer');
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

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
            <span>AI Studios Build</span>
          </div>

          <div className="flex items-center gap-6">
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
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
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

    </div>
  );
}
