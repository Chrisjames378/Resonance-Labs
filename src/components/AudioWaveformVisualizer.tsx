import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Volume2, VolumeX, AlertTriangle, ShieldCheck, Activity, Sliders, Sparkles, RefreshCw, Radio } from 'lucide-react';
import { useAudioCore } from '../hooks/useAudioCore.ts';

interface AudioWaveformVisualizerProps {
  initialEmpathy?: number;
  onEmpathyChange?: (val: number) => void;
  className?: string;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  initialEmpathy = 0.85,
  onEmpathyChange,
  className = ''
}) => {
  const {
    isInitialized,
    liveConfidence,
    isBreached,
    initializeAudioEngine,
    setTimelineAutomation,
    analyserNodeRef,
    audioContextRef,
    volume,
    setVolume,
    isMuted,
    toggleMute
  } = useAudioCore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [empathy, setEmpathy] = useState<number>(initialEmpathy);
  const [visualizerMode, setVisualizerMode] = useState<'both' | 'frequency' | 'oscilloscope'>('both');
  const [activeRampLabel, setActiveRampLabel] = useState<string | null>(null);
  const [peakValues, setPeakValues] = useState<number[]>([]);

  // Update automation when slider moves
  const handleEmpathySlider = (newVal: number) => {
    setEmpathy(newVal);
    setTimelineAutomation(newVal, 0.15);
    onEmpathyChange?.(newVal);
    setActiveRampLabel(null);
  };

  // Preset ramp transitions using setTimelineAutomation
  const triggerAutomationPreset = (targetEmpathy: number, durationSec: number, label: string) => {
    setActiveRampLabel(label);
    setEmpathy(targetEmpathy);
    setTimelineAutomation(targetEmpathy, durationSec);
    onEmpathyChange?.(targetEmpathy);

    setTimeout(() => {
      setActiveRampLabel(null);
    }, durationSec * 1000 + 400);
  };

  // High-performance Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    // Subtle technical grid
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const analyser = analyserNodeRef.current;

    // If not initialized yet, render an ambient placeholder cyber wave
    if (!isInitialized || !analyser) {
      const now = performance.now() * 0.002;
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // emerald-500
      ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
      ctx.shadowBlur = 8;

      for (let x = 0; x < width; x += 3) {
        const y = height / 2 + Math.sin(x * 0.02 + now) * 18 + Math.cos(x * 0.04 - now * 1.5) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(renderCanvas);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);

    const renderHeight = height;
    const halfHeight = height / 2;

    // Mode: Frequency Spectrum (or upper half in 'both')
    if (visualizerMode === 'frequency' || visualizerMode === 'both') {
      const barAreaHeight = visualizerMode === 'both' ? halfHeight - 10 : renderHeight - 20;
      const barCount = 48;
      const barWidth = Math.floor((width - (barCount * 2)) / barCount);
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = freqData[i * step] || 0;
        const percent = val / 255;
        const barHeight = percent * (barAreaHeight - 10);
        const x = i * (barWidth + 2) + 4;
        const y = visualizerMode === 'both' ? halfHeight - 10 - barHeight : renderHeight - 15 - barHeight;

        // Gradient color: Cyan/Emerald or Red/Amber if breached
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isBreached) {
          grad.addColorStop(0, '#f87171'); // red-400
          grad.addColorStop(0.7, '#ea580c'); // orange-600
          grad.addColorStop(1, '#7f1d1d'); // red-900
        } else {
          grad.addColorStop(0, '#34d399'); // emerald-400
          grad.addColorStop(0.6, '#06b6d4'); // cyan-500
          grad.addColorStop(1, '#0f766e'); // teal-700
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak cap tracker
        const currentPeak = peakValues[i] || 0;
        const newPeak = Math.max(currentPeak * 0.96, barHeight);
        if (newPeak > 2) {
          ctx.fillStyle = isBreached ? '#fca5a5' : '#67e8f9';
          ctx.fillRect(x, visualizerMode === 'both' ? halfHeight - 10 - newPeak - 2 : renderHeight - 15 - newPeak - 2, barWidth, 2);
        }
      }
    }

    // Mode: Oscilloscope Waveform (or lower half in 'both')
    if (visualizerMode === 'oscilloscope' || visualizerMode === 'both') {
      const waveAreaY = visualizerMode === 'both' ? halfHeight + 10 : 10;
      const waveAreaH = visualizerMode === 'both' ? halfHeight - 20 : renderHeight - 20;
      const centerY = waveAreaY + waveAreaH / 2;

      // Glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = isBreached ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)';
      ctx.strokeStyle = isBreached ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i] / 128.0; // 0..2
        const y = centerY + (v - 1.0) * (waveAreaH / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center reference datum line
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
    }

    // Middle boundary separator for 'both' mode
    if (visualizerMode === 'both') {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, halfHeight);
      ctx.lineTo(width, halfHeight);
      ctx.stroke();
    }

    animationFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [isInitialized, analyserNodeRef, visualizerMode, isBreached, peakValues]);

  // Canvas size and resize sync
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation cycle
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl ${className}`}>
      {/* Top Header / Status Strip */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isInitialized ? (isBreached ? 'bg-red-500 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]') : 'bg-slate-600'}`} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
                Autonomous Audio Core & Waveform Visualizer
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Web Audio Worklet 60FPS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live harmonic oscillator modulated by critic reflection loopback and automation curves
            </p>
          </div>
        </div>

        {/* Telemetry Pills */}
        <div className="flex items-center gap-3">
          {/* Critic Breach Indicator */}
          <div className={`px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
            isBreached
              ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse'
              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
          }`}>
            {isBreached ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isBreached ? 'CRITIC BREACH DETECTED' : 'CRITIC BOUNDARY STABLE'}</span>
          </div>

          {/* Live Confidence Metric */}
          <div className="px-2.5 py-1 rounded text-xs font-mono bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Confidence:</span>
            <span className={`font-semibold ${isBreached ? 'text-red-400' : 'text-emerald-400'}`}>
              {(liveConfidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* HTML5 Canvas Surface */}
      <div className="relative w-full h-64 sm:h-72 bg-slate-950">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Floating View Mode Switcher */}
        <div className="absolute top-3 right-3 flex items-center bg-slate-900/90 backdrop-blur border border-slate-700 rounded p-0.5 text-xs font-mono">
          <button
            onClick={() => setVisualizerMode('both')}
            className={`px-2.5 py-1 rounded transition-colors ${
              visualizerMode === 'both' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dual View
          </button>
          <button
            onClick={() => setVisualizerMode('frequency')}
            className={`px-2.5 py-1 rounded transition-colors ${
              visualizerMode === 'frequency' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Spectrum
          </button>
          <button
            onClick={() => setVisualizerMode('oscilloscope')}
            className={`px-2.5 py-1 rounded transition-colors ${
              visualizerMode === 'oscilloscope' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Oscilloscope
          </button>
        </div>

        {/* Overlay when engine not started */}
        {!isInitialized && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
            <Radio className="w-10 h-10 text-emerald-400 mb-3 animate-pulse" />
            <h4 className="text-base font-semibold text-slate-100">Audio Worklet Engine Offline</h4>
            <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
              Initialize the low-latency Web Audio API graph and spin up the Autonomous Audio Processor worklet with real-time feedback.
            </p>
            <button
              onClick={initializeAudioEngine}
              className="px-5 py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Initialize Audio Engine
            </button>
          </div>
        )}
      </div>

      {/* Control Surface & Empathy Automation Strip */}
      <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-5">
        
        {/* Main Automation Parameter: Empathy Factor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <label htmlFor="empathy-slider" className="text-slate-300 font-medium flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Timeline Parameter: Empathy Factor (<code className="text-cyan-400">empathyFactor</code>)</span>
            </label>
            <div className="flex items-center gap-2">
              {activeRampLabel && (
                <span className="text-[11px] text-cyan-400 animate-pulse font-sans">
                  Automating: {activeRampLabel}...
                </span>
              )}
              <span className="font-bold text-slate-100 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {empathy.toFixed(3)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              id="empathy-slider"
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              value={empathy}
              onChange={(e) => handleEmpathySlider(parseFloat(e.target.value))}
              disabled={!isInitialized}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0.00 (Critic Breach Zone)</span>
            <span>0.35 (Safety Threshold)</span>
            <span>0.85 (Baseline Equilibrium)</span>
            <span>1.00 (Maximum Sympathetic Harmonic)</span>
          </div>
        </div>

        {/* Linear Automation Presets (triggering setTimelineAutomation) */}
        <div>
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Automated Timeline Curves (<code>AudioParam.linearRampToValueAtTime</code>):</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => triggerAutomationPreset(0.20, 0.4, 'Critic Stress Breach')}
              disabled={!isInitialized}
              className="px-3 py-2 rounded bg-slate-950 border border-red-900/60 hover:border-red-500 text-left transition-colors disabled:opacity-40 group cursor-pointer"
            >
              <div className="text-xs font-semibold text-red-400 group-hover:text-red-300">
                Critic Stress Ramp
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Target 0.20 over 0.4s · Triggers breach telemetry
              </div>
            </button>

            <button
              onClick={() => triggerAutomationPreset(0.85, 1.2, 'Equilibrium Restore')}
              disabled={!isInitialized}
              className="px-3 py-2 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500 text-left transition-colors disabled:opacity-40 group cursor-pointer"
            >
              <div className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                Restore Equilibrium
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Target 0.85 over 1.2s · Smooth harmonic recovery
              </div>
            </button>

            <button
              onClick={() => triggerAutomationPreset(0.98, 2.5, 'Resonance Ascent')}
              disabled={!isInitialized}
              className="px-3 py-2 rounded bg-slate-950 border border-cyan-900/60 hover:border-cyan-500 text-left transition-colors disabled:opacity-40 group cursor-pointer"
            >
              <div className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                Peak Resonance Ramp
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Target 0.98 over 2.5s · High-order fifth harmonics
              </div>
            </button>
          </div>
        </div>

        {/* Audio Monitoring / Volume Control */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              disabled={!isInitialized}
              className={`p-2 rounded border transition-colors ${
                isMuted
                  ? 'bg-amber-950/60 border-amber-600/70 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-100'
              } disabled:opacity-40`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Volume:</span>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                disabled={!isInitialized || isMuted}
                className="w-24 h-1.5 bg-slate-800 rounded appearance-none accent-emerald-500 disabled:opacity-40 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400 w-8">
                {isMuted ? 'Muted' : `${Math.round(volume * 200)}%`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>Graph: {audioContextRef.current ? audioContextRef.current.state.toUpperCase() : 'STOPPED'}</span>
            <span>·</span>
            <span>Rate: 44.1kHz</span>
            <span>·</span>
            <span>FFT: 256 Bins</span>
          </div>
        </div>

      </div>
    </div>
  );
};
