import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle2, Sliders, Activity, BrainCircuit, BookOpen, X } from 'lucide-react';
import { InnerMonologueStep, MetacognitiveTelemetry } from '../types/index.ts';
import { runMetacognitiveLoopSim, fetchTelemetry, subscribeTelemetrySSE } from '../services/api.ts';
import { LatencyHeatmap } from './LatencyHeatmap.tsx';
import { MetacognitiveD3AreaChart } from './MetacognitiveD3AreaChart.tsx';
import { EducationalTooltip, EDUCATIONAL_GLOSSARY } from './EducationalTooltip.tsx';

export const MetacognitiveConsole: React.FC = () => {
  const [prompt, setPrompt] = useState('Synthesize low-latency speech synthesis weights while suppressing acoustic harmonic distortion.');
  const [confidenceFloor, setConfidenceFloor] = useState(0.85);
  const [empathyFactor, setEmpathyFactor] = useState(0.85);
  const [metacognitionFactor, setMetacognitionFactor] = useState(0.90);
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    steps: InnerMonologueStep[];
    finalResult: string;
    totalAttempts: number;
    converged: boolean;
    totalTimeMs: number;
  } | null>(null);

  const [telemetry, setTelemetry] = useState<MetacognitiveTelemetry | null>(null);
  const [imageError, setImageError] = useState(false);
  const [lossThreshold, setLossThreshold] = useState<number>(0.08);
  const [isLossWarning, setIsLossWarning] = useState<boolean>(false);
  const [lossAlertLog, setLossAlertLog] = useState<string | null>(null);
  const [useSSE, setUseSSE] = useState<boolean>(true);
  const [sseActive, setSseActive] = useState<boolean>(false);

  // Monitor live telemetry stream via Server-Sent Events (SSE) or polling fallback
  useEffect(() => {
    let active = true;

    const handleNewTelemetry = (data: MetacognitiveTelemetry) => {
      if (!active || !data) return;
      setTelemetry(data);
      const currentLoss = data.metrics.loss;
      if (currentLoss > lossThreshold) {
        setIsLossWarning(true);
        setLossAlertLog(
          `Loss spike detected: ${currentLoss.toFixed(4)} > threshold ${lossThreshold.toFixed(4)} at ${new Date().toLocaleTimeString()}`
        );
      } else {
        setIsLossWarning(false);
      }
    };

    if (useSSE && typeof window !== 'undefined' && window.EventSource) {
      setSseActive(true);
      const unsubscribe = subscribeTelemetrySSE(
        'proj_default',
        (data) => {
          handleNewTelemetry(data);
        },
        () => {
          // If SSE encounters an error, revert to polling gracefully
          setSseActive(false);
        }
      );

      return () => {
        active = false;
        unsubscribe();
      };
    } else {
      setSseActive(false);
      const fetchLatest = () => {
        fetchTelemetry('proj_default').then((data) => {
          handleNewTelemetry(data);
        });
      };
      fetchLatest();
      const interval = setInterval(fetchLatest, 3500);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [lossThreshold, useSSE]);

  // Immediate manual loss spike simulation for testing
  const handleSimulateLossSpike = () => {
    if (telemetry) {
      const spikedLoss = +(0.1250 + Math.random() * 0.04).toFixed(4);
      setTelemetry({
        ...telemetry,
        metrics: {
          ...telemetry.metrics,
          loss: spikedLoss
        }
      });
      setIsLossWarning(spikedLoss > lossThreshold);
      setLossAlertLog(`Manual spike injected: ${spikedLoss.toFixed(4)} > threshold ${lossThreshold.toFixed(4)}`);
    }
  };

  const handleExecuteLoop = async () => {
    setIsRunning(true);
    setSimulationResult(null);

    const result = await runMetacognitiveLoopSim(
      prompt,
      confidenceFloor,
      empathyFactor,
      metacognitionFactor
    );

    setSimulationResult(result);
    setIsRunning(false);
  };

  const handleReset = () => {
    setSimulationResult(null);
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-emerald-400" />
            Metacognitive Control Console
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Observe the Actor-Critic{' '}
            <EducationalTooltip term="Reflection Loopback" position="bottom">
              reflection loop
            </EducationalTooltip>{' '}
            in real time. Watch candidate tokens undergo{' '}
            <EducationalTooltip term="Inner Monologue" position="bottom">
              inner monologue
            </EducationalTooltip>{' '}
            evaluation and autonomous self-correction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGlossaryModal(true)}
            className="px-3 py-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/80 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Browse full educational glossary of Actor-Critic metacognitive terms"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Glossary & Rules
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </button>
          <button
            onClick={handleExecuteLoop}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? 'Evaluating Reflection...' : 'Execute Metacognitive Loop'}
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Reflection Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Loop Configuration & Actor Input */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Actor Prompt Card */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded space-y-4">
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
              <EducationalTooltip term="Actor Model">
                Actor Model Prompt & Objective
              </EducationalTooltip>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none font-mono leading-relaxed"
              placeholder="Enter prompt or architectural task objective..."
            />

            {/* Quick Prompt Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 font-mono">Curated Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Synthesize low-latency speech synthesis weights',
                  'Evaluate quantum noise in audio waveform',
                  'Calibrate Actor-Critic confidence boundary'
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPrompt(preset)}
                    className="text-[11px] font-mono px-2 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded transition-colors text-left cursor-pointer"
                  >
                    {preset.substring(0, 32)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Critic Sliders & Thresholds */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <EducationalTooltip term="Critic Model">
                  Critic Threshold Controls
                </EducationalTooltip>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">Lesson 01 Alignment</span>
            </div>

            {/* Target Confidence Floor */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <EducationalTooltip term="Confidence Floor" position="top">
                  <span className="text-slate-300 font-medium">Confidence Floor Threshold</span>
                </EducationalTooltip>
                <span className="text-emerald-400 font-bold tabular-nums font-mono">
                  {confidenceFloor.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.60"
                max="0.98"
                step="0.01"
                value={confidenceFloor}
                onChange={(e) => setConfidenceFloor(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Any candidate variant scoring below {confidenceFloor.toFixed(2)} triggers automatic{' '}
                <EducationalTooltip term="Reflection Loopback" showIcon={false}>
                  self-correction loopback
                </EducationalTooltip>.
              </p>
            </div>

            {/* Metacognition Factor */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <EducationalTooltip term="Metacognition Factor" position="top">
                  <span className="text-slate-300 font-medium">Metacognition Factor</span>
                </EducationalTooltip>
                <span className="text-cyan-400 font-bold tabular-nums font-mono">
                  {metacognitionFactor.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="1.00"
                step="0.01"
                value={metacognitionFactor}
                onChange={(e) => setMetacognitionFactor(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Empathy Factor */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <EducationalTooltip term="Empathy Factor" position="top">
                  <span className="text-slate-300 font-medium">Empathy Factor</span>
                </EducationalTooltip>
                <span className="text-slate-200 font-bold tabular-nums font-mono">
                  {empathyFactor.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="1.00"
                step="0.01"
                value={empathyFactor}
                onChange={(e) => setEmpathyFactor(parseFloat(e.target.value))}
                className="w-full accent-slate-300 cursor-pointer"
              />
            </div>

          </div>

          {/* Diagrammatic Reference Card */}
          <div className="rounded border border-slate-800 bg-slate-900 overflow-hidden">
            {!imageError ? (
              <img
                src="/src/assets/images/metacognitive_critic_core_1793141966994.jpg"
                alt="Actor-Critic Dual Neural Loop Diagram"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="h-48 flex items-center justify-center bg-slate-950 p-4 text-center">
                <span className="text-xs font-mono text-slate-500">Actor-Critic Dual Loop Diagram</span>
              </div>
            )}
            <div className="p-3 bg-slate-950 text-xs font-mono text-slate-400 border-t border-slate-800 flex justify-between">
              <EducationalTooltip term="Actor Model">Policy Network (Actor)</EducationalTooltip>
              <EducationalTooltip term="Critic Model">Value Network (Critic)</EducationalTooltip>
            </div>
          </div>

        </div>

        {/* Right Column: Execution Scratchpad & Reflection Trace */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Inner Monologue Scratchpad Card */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <EducationalTooltip term="Inner Monologue">
                  Inner Monologue Scratchpad & Reflection Trace
                </EducationalTooltip>
              </span>
              <span className="text-xs font-mono text-slate-500">
                {simulationResult ? `${simulationResult.totalAttempts} Iteration(s)` : 'Awaiting Run'}
              </span>
            </div>

            {isRunning && (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-mono text-slate-300">
                  Actor generating candidate variant · Critic computing inner monologue...
                </p>
              </div>
            )}

            {!isRunning && !simulationResult && (
              <div className="py-12 text-center text-slate-500 font-mono text-xs">
                Click <strong className="text-emerald-400">"Execute Metacognitive Loop"</strong> to watch the Actor model generate candidate text, evaluate confidence against the {confidenceFloor.toFixed(2)} floor, and execute self-correction.
              </div>
            )}

            {/* Simulation Results Breakdown */}
            {!isRunning && simulationResult && (
              <div className="space-y-4">
                
                {simulationResult.steps.map((step) => {
                  const passed = step.passedFloor;
                  return (
                    <div
                      key={step.attempt}
                      className={`p-4 rounded border transition-colors ${
                        passed
                          ? 'bg-emerald-950/20 border-emerald-800/80'
                          : 'bg-amber-950/20 border-amber-900/70'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono pb-2 mb-2 border-b border-slate-800/80">
                        <span className="font-semibold text-slate-200">
                          Iteration #{step.attempt} Execution Trace
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 tabular-nums">{step.executionTimeMs} ms</span>
                          <span className={`font-bold tabular-nums ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                            Confidence: {(step.confidenceScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Actor Output */}
                      <div className="text-xs font-mono text-slate-300 mb-2">
                        <EducationalTooltip term="Actor Model" showIcon={false}>
                          <span className="text-slate-500">Actor Output:</span>
                        </EducationalTooltip>{' '}
                        {step.actorCandidate}
                      </div>

                      {/* Inner Monologue */}
                      <div className="p-2.5 bg-slate-950/90 rounded border border-slate-800 text-xs font-mono text-slate-400 mb-2">
                        <EducationalTooltip term="Inner Monologue">
                          <span className="text-emerald-400 font-bold block mb-1">Inner Monologue Reflection:</span>
                        </EducationalTooltip>
                        {step.monologueSummary}
                      </div>

                      {/* Self-Correction Warning */}
                      {!passed && step.selfCorrectionReason && (
                        <div className="flex items-start gap-2 text-xs font-mono text-amber-300 mt-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{step.selfCorrectionReason}</span>
                        </div>
                      )}

                      {passed && (
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mt-2">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Confidence threshold satisfied. Token output cleared for synthesis.</span>
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* Final Synthesized Output Banner */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">
                    Final Validated Output
                  </div>
                  <div className="text-sm font-mono text-slate-100 font-medium leading-relaxed">
                    {simulationResult.finalResult}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-900 flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Total Latency: {simulationResult.totalTimeMs} ms</span>
                    <span>
                      <EducationalTooltip term="Reflection Loopback" showIcon={false}>
                        Self-Correction Converged:
                      </EducationalTooltip>{' '}
                      {simulationResult.converged ? 'YES' : 'MAX ATTEMPTS'}
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Live Relational Stream Telemetry Card */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-slate-300 font-semibold">
                  Live Gateway Stream
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {useSSE ? '`/api/v1/telemetry/sse/:id`' : '`/api/v1/telemetry/stream/:id`'}
                </span>
                <button
                  onClick={() => setUseSSE(!useSSE)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    useSSE && sseActive
                      ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-400'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle between Server-Sent Events (SSE) and HTTP Polling"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${useSSE && sseActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {useSSE && sseActive ? 'SSE Active (Live Push)' : 'Polling (3.5s)'}
                </button>
              </div>
              
              {/* Loss Threshold Tuning & Spike Test */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <EducationalTooltip term="Loss Alert Ceiling" position="bottom">
                  <span className="text-slate-400 text-[11px]">Loss Alert Ceiling:</span>
                </EducationalTooltip>
                <input
                  type="number"
                  step="0.01"
                  min="0.02"
                  max="0.20"
                  value={lossThreshold}
                  onChange={(e) => setLossThreshold(parseFloat(e.target.value) || 0.08)}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-center font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                  title="Configure threshold to trigger red visual warning"
                />
                <button
                  onClick={handleSimulateLossSpike}
                  className="px-2 py-0.5 bg-slate-950 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-rose-300 rounded text-[11px] transition-colors cursor-pointer"
                  title="Force a loss spike above threshold to test red visual warning"
                >
                  Test Spike
                </button>
              </div>
            </div>

            {telemetry && (
              <div className="space-y-3">
                {/* Visual Loss Warning Alert Banner */}
                {isLossWarning && (
                  <div className="p-3 bg-rose-950/70 border border-rose-600 rounded flex items-center justify-between text-xs font-mono text-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.2)] animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <span className="font-bold text-rose-300">Warning: Loss Threshold Breached! </span>
                        <span>Current loss ({telemetry.metrics.loss.toFixed(4)}) is above threshold ({lossThreshold.toFixed(4)}). Gradient divergence risk detected.</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500 shrink-0 uppercase tracking-wider">
                      CRITICAL
                    </span>
                  </div>
                )}

                {/* Metrics Grid with Red Warning Styling */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  
                  {/* Current Loss Metric - Turns Red on Threshold Breach */}
                  <div
                    className={`p-2.5 rounded transition-all ${
                      isLossWarning
                        ? 'bg-rose-950/60 border border-rose-500 ring-1 ring-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)] animate-pulse'
                        : 'bg-slate-950 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`block text-[10px] ${isLossWarning ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                        {isLossWarning ? 'LOSS [EXCEEDED]' : 'CURRENT LOSS'}
                      </span>
                      {isLossWarning && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    </div>
                    <span
                      className={`font-bold tabular-nums text-sm block mt-0.5 ${
                        isLossWarning ? 'text-rose-400 font-extrabold' : 'text-slate-200'
                      }`}
                    >
                      {telemetry.metrics.loss}
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${isLossWarning ? 'text-rose-300 font-semibold' : 'text-slate-500'}`}>
                      {isLossWarning ? `Threshold: ${lossThreshold.toFixed(3)}` : `Ceiling: ${lossThreshold.toFixed(3)}`}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[10px]">ACCURACY</span>
                    <span className="text-emerald-400 font-bold tabular-nums text-sm block mt-0.5">
                      {(telemetry.metrics.accuracy * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Confidence band</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                    <EducationalTooltip term="Critic Confidence" position="top">
                      <span className="text-slate-500 block text-[10px]">CRITIC CONFIDENCE</span>
                    </EducationalTooltip>
                    <span className="text-cyan-400 font-bold tabular-nums text-sm block mt-0.5">
                      {(telemetry.metrics.metacognitiveConfidence * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Floor: {(confidenceFloor * 100).toFixed(0)}%</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                    <span className="text-slate-500 block text-[10px]">THROUGHPUT</span>
                    <span className="text-slate-200 font-bold tabular-nums text-sm block mt-0.5">
                      {telemetry.metrics.tokensPerSec} tok/s
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">WebGPU Stream</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
                  <span className="text-[11px] font-mono text-slate-500 uppercase block">Active Gateway Reflections:</span>
                  {telemetry.internalReflections.map((ref, idx) => (
                    <div key={idx} className="text-xs font-mono text-slate-300">
                      <span className="text-emerald-400">›</span> {ref}
                    </div>
                  ))}
                  {lossAlertLog && (
                    <div className="text-[11px] font-mono text-rose-400 pt-1 border-t border-slate-900 mt-1">
                      <span>Telemetry notice: </span>{lossAlertLog}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Real-Time D3.js Area Chart for Metacognitive Confidence (SSE Stream) */}
          <MetacognitiveD3AreaChart
            latestTelemetry={telemetry}
            confidenceFloor={confidenceFloor}
            sseActive={useSSE && sseActive}
          />

          {/* Time-Series Latency Heatmap & Spike Monitor (Recharts) */}
          <LatencyHeatmap />

        </div>

      </div>

      {/* Educational Terminology Glossary Modal */}
      {showGlossaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    Metacognitive Actor-Critic Glossary
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                      Educational Reference
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive definitions, convergence criteria, and mathematical rules for the studio.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGlossaryModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close glossary modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Glossary Content Grid */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(EDUCATIONAL_GLOSSARY).map((concept) => (
                  <div
                    key={concept.term}
                    className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-semibold uppercase">
                        {concept.category || 'Architecture'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Ref: {concept.term.slice(0, 12)}</span>
                    </div>

                    <h4 className="font-bold text-slate-100 font-mono text-sm pt-0.5">
                      {concept.term}
                    </h4>

                    <p className="text-slate-300 leading-relaxed text-xs">
                      {concept.shortDefinition}
                    </p>

                    {concept.detailedExplanation && (
                      <p className="text-[11px] text-slate-400 border-t border-slate-900 pt-2 leading-relaxed">
                        {concept.detailedExplanation}
                      </p>
                    )}

                    {concept.formulaOrRule && (
                      <div className="p-2 bg-slate-900/90 rounded border border-slate-800 font-mono text-[11px] text-cyan-300">
                        <span className="text-slate-500 block text-[10px] uppercase">Rule / Formula:</span>
                        {concept.formulaOrRule}
                      </div>
                    )}

                    {concept.impactOnOutput && (
                      <div className="text-[10px] text-amber-300/90 font-sans pt-1">
                        <strong>Studio Impact: </strong>{concept.impactOnOutput}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Tip: Hover over any dotted label in the console to inspect definitions in-place.</span>
              <button
                onClick={() => setShowGlossaryModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
