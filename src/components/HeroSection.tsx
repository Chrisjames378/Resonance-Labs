import React, { useState, useEffect } from 'react';
import { ArrowRight, Activity, Terminal, Cpu } from 'lucide-react';
import { fetchTelemetry } from '../services/api.ts';
import { MetacognitiveTelemetry } from '../types/index.ts';

interface HeroSectionProps {
  onNavigate: (tab: string) => void;
  onOpenWaitlist: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate, onOpenWaitlist }) => {
  const [telemetry, setTelemetry] = useState<MetacognitiveTelemetry | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchTelemetry('proj_default').then((data) => {
      if (mounted) setTelemetry(data);
    });
    const interval = setInterval(() => {
      fetchTelemetry('proj_default').then((data) => {
        if (mounted) setTelemetry(data);
      });
    }, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="relative pt-8 pb-12 border-b border-slate-800 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unboxed Metadata Header */}
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-4 tracking-wide">
          <span>Resonance R&D Platform</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span>WebGPU & Wasm Runtime</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span>Computational Metacognition</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span>PostgreSQL & Express Gateway</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Core Narrative */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight max-w-2xl">
                Low-Latency Hybrid AI Architectures with Computational Metacognition
              </h1>
              
              <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
                Resonance Labs bridges theoretical deep learning and production engineering. Design custom layer topologies in the browser, monitor Actor-Critic reflection loops with reflective inner monologues, and orchestrate multi-model inferencing pipelines.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('designer')}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Open Studio Canvas
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('curriculum')}
                  className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Explore Lesson 01
                </button>

                <button
                  onClick={onOpenWaitlist}
                  className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors underline-offset-4 hover:underline"
                >
                  Request Early Access
                </button>
              </div>
            </div>

            {/* Live Telemetry Aggregator Preview */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-mono">
                <span className="flex items-center gap-2 text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  System Hardware Telemetry (Aggregator v1.0)
                </span>
                <span>Host: x86_64 Linux · State: Nominal</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Metacognitive Conf.</div>
                  <div className="text-xl font-mono tabular-nums font-bold text-emerald-400 mt-0.5">
                    {telemetry ? (telemetry.metrics.metacognitiveConfidence * 100).toFixed(1) : '91.4'}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Floor: 85.0%</div>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Inference Speed</div>
                  <div className="text-xl font-mono tabular-nums font-bold text-cyan-400 mt-0.5">
                    {telemetry ? telemetry.metrics.tokensPerSec.toFixed(1) : '48.5'}
                    <span className="text-xs text-slate-400 font-normal ml-1">tok/s</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">WebGPU JIT</div>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Task Accuracy</div>
                  <div className="text-xl font-mono tabular-nums font-bold text-slate-200 mt-0.5">
                    {telemetry ? (telemetry.metrics.accuracy * 100).toFixed(1) : '94.2'}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Loss: 0.041</div>
                </div>

                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Hardware Load</div>
                  <div className="text-xl font-mono tabular-nums font-bold text-emerald-400 mt-0.5">
                    {telemetry ? telemetry.metrics.hardwareThreadEfficiency : 94}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Threads: Optimal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Topology Visual */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="relative rounded border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
              {!imageError ? (
                <img
                  src="/src/assets/images/hero_neural_topology_1793141967010.jpg"
                  alt="Resonance Labs Neural Topology Visualization"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-80 sm:h-96 object-cover"
                />
              ) : (
                <div className="w-full h-80 sm:h-96 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-6 text-center">
                  <div>
                    <Cpu className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                    <p className="text-sm font-mono text-slate-300">Resonance Neural Topology Network</p>
                    <p className="text-xs text-slate-500 mt-1">Multi-Layer Actor-Critic Architecture</p>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-slate-300 font-medium">Topology: Multi-Layer Actor-Critic</span>
                <span className="text-emerald-400 font-bold">Parameters: 3.5M Active</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
