import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { MetacognitiveTelemetry } from '../types/index.ts';
import { Activity, ShieldCheck, AlertTriangle, TrendingUp, Radio, RefreshCw, BarChart2 } from 'lucide-react';

interface MetacognitiveD3AreaChartProps {
  latestTelemetry: MetacognitiveTelemetry | null;
  confidenceFloor?: number;
  sseActive?: boolean;
  maxHistoryPoints?: number;
}

interface ConfidenceDataPoint {
  id: string;
  timestamp: Date;
  timeLabel: string;
  confidence: number;
  loss: number;
  floor: number;
  isBreach: boolean;
}

export const MetacognitiveD3AreaChart: React.FC<MetacognitiveD3AreaChartProps> = ({
  latestTelemetry,
  confidenceFloor = 0.85,
  sseActive = true,
  maxHistoryPoints = 25
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Maintain rolling history of confidence telemetry
  const [history, setHistory] = useState<ConfidenceDataPoint[]>(() => {
    // Pre-seed with initial baseline points so the chart is immediately interactive
    const now = Date.now();
    const initialPoints: ConfidenceDataPoint[] = [];
    for (let i = 18; i >= 0; i--) {
      const time = new Date(now - i * 1500);
      const conf = +(0.88 + Math.random() * 0.09).toFixed(4);
      initialPoints.push({
        id: `init_${i}`,
        timestamp: time,
        timeLabel: d3.timeFormat('%H:%M:%S')(time),
        confidence: conf,
        loss: +(0.03 + Math.random() * 0.05).toFixed(4),
        floor: confidenceFloor,
        isBreach: conf < confidenceFloor
      });
    }
    return initialPoints;
  });

  const [hoveredPoint, setHoveredPoint] = useState<ConfidenceDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Last telemetry timestamp tracked to avoid duplicate point appends
  const lastProcessedTimestamp = useRef<string | null>(null);

  // Ingest incoming SSE / live stream telemetry
  useEffect(() => {
    if (!latestTelemetry || isPaused) return;

    if (lastProcessedTimestamp.current === latestTelemetry.timestamp) {
      return;
    }
    lastProcessedTimestamp.current = latestTelemetry.timestamp;

    const pointTime = new Date(latestTelemetry.timestamp || Date.now());
    const conf = latestTelemetry.metrics?.metacognitiveConfidence ?? 0.90;
    const loss = latestTelemetry.metrics?.loss ?? 0.05;

    const newPoint: ConfidenceDataPoint = {
      id: `pt_${Date.now()}_${Math.random().toString(16).substring(2, 6)}`,
      timestamp: pointTime,
      timeLabel: d3.timeFormat('%H:%M:%S')(pointTime),
      confidence: conf,
      loss,
      floor: confidenceFloor,
      isBreach: conf < confidenceFloor
    };

    setHistory((prev) => {
      const next = [...prev, newPoint];
      if (next.length > maxHistoryPoints) {
        return next.slice(next.length - maxHistoryPoints);
      }
      return next;
    });
  }, [latestTelemetry, confidenceFloor, isPaused, maxHistoryPoints]);

  // Compute summary metrics
  const stats = useMemo(() => {
    if (history.length === 0) {
      return { current: 0.90, avg: 0.90, min: 0.85, max: 0.95, breaches: 0 };
    }
    const values = history.map((p) => p.confidence);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const current = values[values.length - 1];
    const breaches = history.filter((p) => p.isBreach).length;
    return { current, avg, min, max, breaches };
  }, [history]);

  // D3 Area Chart Render Loop
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || history.length < 2) return;

    const containerWidth = containerRef.current.clientWidth || 600;
    const height = 240;
    const margin = { top: 20, right: 30, bottom: 35, left: 50 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // SVG Definitions: Gradients & Glow Filter
    const defs = svg.append('defs');

    // Area Gradient: Cyan / Emerald into transparent
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'confidence-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.5);

    areaGradient
      .append('stop')
      .attr('offset', '65%')
      .attr('stop-color', '#0ea5e9')
      .attr('stop-opacity', 0.15);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0284c7')
      .attr('stop-opacity', 0.0);

    // Floor Alert Gradient for Area under Floor
    const breachGradient = defs
      .append('linearGradient')
      .attr('id', 'breach-line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    breachGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.8);
    breachGradient.append('stop').attr('offset', '100%').attr('stop-color', '#e11d48').attr('stop-opacity', 0.3);

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const timeExtent = d3.extent(history, (d) => d.timestamp) as [Date, Date];
    const xScale = d3.scaleTime().domain(timeExtent).range([0, innerWidth]);

    const minConfidence = d3.min(history, (d) => d.confidence) ?? 0.80;
    const maxConfidence = d3.max(history, (d) => d.confidence) ?? 1.0;

    // Y domain: Ensure confidenceFloor is always visible, with safe padding
    const yDomainMin = Math.max(0.60, Math.min(minConfidence - 0.05, confidenceFloor - 0.06));
    const yDomainMax = Math.min(1.05, Math.max(maxConfidence + 0.03, 1.0));
    const yScale = d3.scaleLinear().domain([yDomainMin, yDomainMax]).range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid grid-y')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3');

    g.select('.grid-y .domain').remove();

    // Area Generator
    const areaGenerator = d3
      .area<ConfidenceDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y0(innerHeight)
      .y1((d) => yScale(d.confidence))
      .curve(d3.curveMonotoneX);

    // Render Area Path
    g.append('path')
      .datum(history)
      .attr('class', 'confidence-area')
      .attr('d', areaGenerator)
      .attr('fill', 'url(#confidence-area-gradient)');

    // Line Generator (Upper contour)
    const lineGenerator = d3
      .line<ConfidenceDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.confidence))
      .curve(d3.curveMonotoneX);

    // Render Line Path
    g.append('path')
      .datum(history)
      .attr('class', 'confidence-line')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');

    // Render Confidence Floor Threshold Line
    const floorY = yScale(confidenceFloor);
    if (floorY >= 0 && floorY <= innerHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', floorY)
        .attr('y2', floorY)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.85);

      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', floorY - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#f59e0b')
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', '600')
        .text(`Floor: ${(confidenceFloor * 100).toFixed(1)}%`);
    }

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.max(3, Math.floor(innerWidth / 90)))
      .tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date));

    const xAxisGroup = g
      .append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'ui-monospace, monospace');
    xAxisGroup.selectAll('line').attr('stroke', '#334155');
    xAxisGroup.select('.domain').attr('stroke', '#334155');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${((d as number) * 100).toFixed(0)}%`);

    const yAxisGroup = g.append('g').attr('class', 'axis axis-y').call(yAxis);

    yAxisGroup.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'ui-monospace, monospace');
    yAxisGroup.selectAll('line').attr('stroke', '#334155');
    yAxisGroup.select('.domain').attr('stroke', '#334155');

    // Active Latest Point Beacon
    const latestPoint = history[history.length - 1];
    if (latestPoint) {
      const latestX = xScale(latestPoint.timestamp);
      const latestY = yScale(latestPoint.confidence);

      // Outer pulse ring
      g.append('circle')
        .attr('cx', latestX)
        .attr('cy', latestY)
        .attr('r', 7)
        .attr('fill', 'none')
        .attr('stroke', latestPoint.isBreach ? '#f43f5e' : '#06b6d4')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7);

      // Solid inner core
      g.append('circle')
        .attr('cx', latestX)
        .attr('cy', latestY)
        .attr('r', 3.5)
        .attr('fill', latestPoint.isBreach ? '#f43f5e' : '#22d3ee')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1.5);
    }

    // Crosshair and Hover Interaction Overlay
    const focusG = g.append('g').attr('class', 'focus-overlay').style('display', 'none');

    const focusLine = focusG
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    const focusCircle = focusG
      .append('circle')
      .attr('r', 4.5)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#0284c7')
      .attr('stroke-width', 2);

    // Transparent mouse-capturing overlay
    const bisectDate = d3.bisector<ConfidenceDataPoint, Date>((d) => d.timestamp).left;

    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mouseenter', () => focusG.style('display', null))
      .on('mouseleave', () => {
        focusG.style('display', 'none');
        setHoveredPoint(null);
        setTooltipPos(null);
      })
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX);
        const i = bisectDate(history, x0, 1);
        const d0 = history[i - 1];
        const d1 = history[i];
        let d = d0;
        if (d1 && x0) {
          d = x0.getTime() - d0.timestamp.getTime() > d1.timestamp.getTime() - x0.getTime() ? d1 : d0;
        }
        if (!d) return;

        const posX = xScale(d.timestamp);
        const posY = yScale(d.confidence);

        focusLine.attr('x1', posX).attr('x2', posX);
        focusCircle.attr('cx', posX).attr('cy', posY);

        setHoveredPoint(d);
        setTooltipPos({
          x: posX + margin.left,
          y: posY + margin.top
        });
      });
  }, [history, confidenceFloor]);

  return (
    <div className="p-5 bg-slate-900/85 border border-slate-800 rounded-lg space-y-4 shadow-lg">
      
      {/* Top Header & Status Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
              D3.js Real-Time Metacognitive Confidence Area Chart
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300">
                Live SSE Stream
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Direct SVG render with continuous monotonic interpolation and dynamic confidence floor tracking.
            </p>
          </div>
        </div>

        {/* Live SSE Status & Controls */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono ${
              sseActive
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-400'
                : 'bg-slate-950 border-slate-700 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                sseActive && !isPaused ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{sseActive && !isPaused ? 'SSE PUSH ACTIVE (1.5s)' : 'STREAM PAUSED'}</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-300 transition-colors"
            title="Pause or resume chart streaming updates"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
        <div className="p-2.5 bg-slate-950 border border-slate-800/90 rounded">
          <span className="text-slate-500 block text-[10px] uppercase">LATEST CONFIDENCE</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm block mt-0.5">
            {(stats.current * 100).toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {stats.current >= confidenceFloor ? 'Above Target' : 'Below Floor!'}
          </span>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800/90 rounded">
          <span className="text-slate-500 block text-[10px] uppercase">ROLLING AVERAGE</span>
          <span className="text-slate-200 font-bold tabular-nums text-sm block mt-0.5">
            {(stats.avg * 100).toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Last {history.length} cycles</span>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800/90 rounded">
          <span className="text-slate-500 block text-[10px] uppercase">CONFIDENCE FLOOR</span>
          <span className="text-amber-400 font-bold tabular-nums text-sm block mt-0.5">
            {(confidenceFloor * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Critic Loopback Threshold</span>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800/90 rounded">
          <span className="text-slate-500 block text-[10px] uppercase">MIN / MAX BAND</span>
          <span className="text-slate-200 font-bold tabular-nums text-sm block mt-0.5">
            {(stats.min * 100).toFixed(1)}% - {(stats.max * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Variance Range</span>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800/90 rounded col-span-2 sm:col-span-1">
          <span className="text-slate-500 block text-[10px] uppercase">HEALTH STATUS</span>
          <span
            className={`font-bold tabular-nums text-sm block mt-0.5 ${
              stats.breaches === 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.breaches === 0 ? 'NOMINAL' : `${stats.breaches} RECOVERY LOOPS`}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Reflection Convergence</span>
        </div>
      </div>

      {/* D3 Area Chart Container */}
      <div ref={containerRef} className="relative w-full bg-slate-950 border border-slate-800 rounded-lg p-2 overflow-hidden">
        
        {/* Floating Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute z-20 pointer-events-none p-2 bg-slate-900/95 border border-cyan-500/50 rounded shadow-xl text-xs font-mono text-slate-200 -translate-x-1/2 -translate-y-full mb-3"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 mb-1 flex justify-between gap-3">
              <span>Time: {hoveredPoint.timeLabel}</span>
              <span className={hoveredPoint.isBreach ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {hoveredPoint.isBreach ? 'BREACH' : 'STABLE'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Confidence:</span>
              <span className="text-cyan-400 font-bold">{(hoveredPoint.confidence * 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Floor Delta:</span>
              <span className={hoveredPoint.confidence >= confidenceFloor ? 'text-emerald-400' : 'text-rose-400'}>
                {hoveredPoint.confidence >= confidenceFloor ? '+' : ''}
                {((hoveredPoint.confidence - confidenceFloor) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[10px] text-slate-500 pt-1">
              <span>Actor Loss:</span>
              <span>{hoveredPoint.loss.toFixed(4)}</span>
            </div>
          </div>
        )}

        <svg ref={svgRef} className="w-full block" />
      </div>

      {/* Chart Legend & Telemetry Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400 pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded"></span>
            <span>Streamed Critic Confidence (SSE)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 inline-block border-t border-dashed border-amber-400"></span>
            <span>Confidence Floor ({ (confidenceFloor * 100).toFixed(0) }%)</span>
          </div>
        </div>

        <div className="text-slate-500">
          Showing rolling window of {history.length} samples · Hover over chart for inspect trace
        </div>
      </div>

    </div>
  );
};
