import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Activity, AlertTriangle, Zap, RefreshCw, Flame } from 'lucide-react';

interface TrainingCyclePoint {
  cycle: number;
  timeLabel: string;
  latencyMs: number;
  actorLoss: number;
  criticConfidence: number;
  hasSpike: boolean;
  spikeReason?: string;
  // Intensity score 0 to 1 for heatmap color interpolation
  heatIntensity: number;
}

// Generate realistic time-series training cycle data with periodic self-correction latency spikes
const generateInitialCycles = (): TrainingCyclePoint[] => {
  const points: TrainingCyclePoint[] = [];
  const baseTime = Date.now() - 24 * 5000;

  for (let i = 1; i <= 24; i++) {
    const isSpike = i % 7 === 0 || i === 18;
    const latency = isSpike
      ? +(110 + Math.random() * 85).toFixed(1)
      : +(12 + Math.random() * 18).toFixed(1);

    const heatIntensity = isSpike
      ? Math.min(1.0, latency / 200)
      : Math.min(0.35, latency / 50);

    const time = new Date(baseTime + i * 5000);
    const timeLabel = `${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;

    points.push({
      cycle: i,
      timeLabel,
      latencyMs: latency,
      actorLoss: +(Math.random() * 0.12).toFixed(4),
      criticConfidence: isSpike ? +(0.65 + Math.random() * 0.15).toFixed(2) : +(0.91 + Math.random() * 0.08).toFixed(2),
      hasSpike: isSpike,
      spikeReason: isSpike ? 'Critic Loopback Self-Correction Sequence' : undefined,
      heatIntensity
    });
  }
  return points;
};

// Map heat intensity to cybernetic palette (Emerald nominal -> Amber medium -> Crimson Spike)
const getHeatColor = (latencyMs: number): string => {
  if (latencyMs >= 120) return '#f43f5e'; // Crimson spike
  if (latencyMs >= 75) return '#fb923c';  // Orange / Amber
  if (latencyMs >= 40) return '#facc15';  // Yellow warning
  if (latencyMs >= 22) return '#2dd4bf';  // Teal
  return '#10b981';                      // Emerald nominal
};

export const LatencyHeatmap: React.FC = () => {
  const [cycleData, setCycleData] = useState<TrainingCyclePoint[]>(generateInitialCycles);
  const [viewMode, setViewMode] = useState<'matrix' | 'stream'>('matrix');
  const [selectedCycle, setSelectedCycle] = useState<TrainingCyclePoint | null>(null);

  // Periodic append to simulate ongoing training cycles
  useEffect(() => {
    const interval = setInterval(() => {
      setCycleData(prev => {
        const nextCycleNum = prev[prev.length - 1].cycle + 1;
        const isSpike = Math.random() > 0.75;
        const latency = isSpike
          ? +(115 + Math.random() * 80).toFixed(1)
          : +(11 + Math.random() * 16).toFixed(1);

        const now = new Date();
        const timeLabel = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const newPoint: TrainingCyclePoint = {
          cycle: nextCycleNum,
          timeLabel,
          latencyMs: latency,
          actorLoss: +(Math.random() * 0.12).toFixed(4),
          criticConfidence: isSpike ? +(0.68 + Math.random() * 0.14).toFixed(2) : +(0.92 + Math.random() * 0.07).toFixed(2),
          hasSpike: isSpike,
          spikeReason: isSpike ? 'Reflective Critic Weight Adjustment Loop' : undefined,
          heatIntensity: isSpike ? Math.min(1.0, latency / 200) : Math.min(0.35, latency / 50)
        };

        return [...prev.slice(1), newPoint];
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleSimulateCycleSpike = () => {
    setCycleData(prev => {
      const nextCycleNum = prev[prev.length - 1].cycle + 1;
      const spikeLatency = +(165 + Math.random() * 55).toFixed(1);
      const now = new Date();
      const timeLabel = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const spikePoint: TrainingCyclePoint = {
        cycle: nextCycleNum,
        timeLabel,
        latencyMs: spikeLatency,
        actorLoss: +(0.1150).toFixed(4),
        criticConfidence: 0.71,
        hasSpike: true,
        spikeReason: 'Forced Metacognitive Constraint Violation & Retrial',
        heatIntensity: 0.98
      };
      return [...prev.slice(1), spikePoint];
    });
  };

  const peakLatency = Math.max(...cycleData.map(d => d.latencyMs));
  const spikeCount = cycleData.filter(d => d.hasSpike).length;
  const avgLatency = (cycleData.reduce((acc, curr) => acc + curr.latencyMs, 0) / cycleData.length).toFixed(1);

  return (
    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded space-y-4">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          <span className="text-slate-200 font-bold">
            Training Cycle Latency Heatmap & Spike Monitor
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-rose-400">{spikeCount} Spikes Detected</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                viewMode === 'matrix' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              Heatmap Matrix
            </button>
            <button
              onClick={() => setViewMode('stream')}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                viewMode === 'stream' ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              Latency Wave
            </button>
          </div>

          <button
            onClick={handleSimulateCycleSpike}
            className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 rounded text-[11px] flex items-center gap-1 transition-colors"
            title="Inject high-latency critic self-correction spike"
          >
            <Zap className="w-3 h-3 text-rose-400" />
            <span>Simulate Spike</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 bg-slate-950 border border-slate-800 rounded">
          <span className="text-slate-500 block text-[10px]">AVG CYCLE LATENCY</span>
          <span className="text-slate-200 font-bold tabular-nums text-sm">{avgLatency} ms</span>
        </div>
        <div className="p-2 bg-slate-950 border border-slate-800 rounded">
          <span className="text-slate-500 block text-[10px]">PEAK SPIKE LATENCY</span>
          <span className="text-rose-400 font-bold tabular-nums text-sm">{peakLatency.toFixed(1)} ms</span>
        </div>
        <div className="p-2 bg-slate-950 border border-slate-800 rounded">
          <span className="text-slate-500 block text-[10px]">SPIKE INCIDENCE</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm">
            {((spikeCount / cycleData.length) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="p-2 bg-slate-950 border border-slate-800 rounded">
          <span className="text-slate-500 block text-[10px]">CRITIC OVERHEAD</span>
          <span className="text-emerald-400 font-bold tabular-nums text-sm">Nominal JIT</span>
        </div>
      </div>

      {/* Recharts Visualization Viewport */}
      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'matrix' ? (
            <BarChart
              data={cycleData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedCycle(e.activePayload[0].payload as TrainingCyclePoint);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                unit="ms"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TrainingCyclePoint;
                    return (
                      <div className="p-3 bg-slate-950 border border-slate-700 rounded text-xs font-mono shadow-2xl space-y-1">
                        <div className="flex justify-between gap-4 text-slate-400 text-[10px]">
                          <span>TRAINING CYCLE #{data.cycle}</span>
                          <span>{data.timeLabel}</span>
                        </div>
                        <div className="text-slate-100 font-bold text-sm">
                          Latency: <span style={{ color: getHeatColor(data.latencyMs) }}>{data.latencyMs} ms</span>
                        </div>
                        <div className="text-slate-300">Loss: {data.actorLoss}</div>
                        <div className="text-cyan-400">Critic Conf: {(data.criticConfidence * 100).toFixed(1)}%</div>
                        {data.hasSpike && (
                          <div className="text-rose-400 font-semibold text-[11px] pt-1 border-t border-slate-800">
                            ⚠ High-Latency Spike: {data.spikeReason}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="latencyMs" radius={[3, 3, 0, 0]}>
                {cycleData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getHeatColor(entry.latencyMs)}
                    opacity={entry.hasSpike ? 1.0 : 0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart
              data={cycleData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                  <stop offset="60%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                unit="ms"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TrainingCyclePoint;
                    return (
                      <div className="p-2.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono shadow-xl">
                        <span className="text-slate-400 text-[10px] block">CYCLE #{data.cycle} ({data.timeLabel})</span>
                        <span className="text-slate-100 font-bold block">{data.latencyMs} ms</span>
                        {data.hasSpike && <span className="text-rose-400 text-[10px] block font-bold">LATENCY SPIKE</span>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="latencyMs"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#latencyGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Heatmap Color Scale Legend */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Latency Intensity:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>&lt;22ms Nominal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" />
            <span>22-40ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span>40-75ms Extended</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-rose-300 font-bold">&gt;120ms Spike (Critic Loop)</span>
          </div>
        </div>

        <div className="text-slate-500">
          Recharts Time-Series Engine · 24 Rolling Sample Windows
        </div>
      </div>

    </div>
  );
};
