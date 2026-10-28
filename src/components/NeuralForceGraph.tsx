import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NeuralLayer } from '../types/index.ts';
import { Maximize2, RefreshCw, Sliders, Eye } from 'lucide-react';

interface NeuralForceGraphProps {
  layers: NeuralLayer[];
  isSimulating?: boolean;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  layerId: string;
  layerIndex: number;
  layerType: string;
  activation: string;
  color: string;
  radius: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  isCriticLoop?: boolean;
}

export const NeuralForceGraph: React.FC<NeuralForceGraphProps> = ({ layers, isSimulating }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeCountScale, setNodeCountScale] = useState<'condensed' | 'detailed'>('condensed');
  const [chargeStrength, setChargeStrength] = useState<number>(-120);

  // Generate nodes & links based on layer topologies
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 700;
    const height = 360;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('width', '100%')
       .attr('height', height);

    // Zoom container
    const g = svg.append('g').attr('class', 'zoom-layer');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Construct graph nodes
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const layerXStep = width / (layers.length + 1);

    layers.forEach((layer, layerIdx) => {
      // Determine number of representative nodes to render
      let count = 4;
      if (layer.type === 'MetacognitiveCritic') count = 2;
      else if (layer.type === 'Output') count = Math.min(6, Math.max(2, Math.floor(layer.nodes / 2)));
      else if (nodeCountScale === 'detailed') count = Math.min(8, Math.max(3, Math.floor(layer.nodes / 32)));
      else count = Math.min(5, Math.max(3, Math.floor(layer.nodes / 64)));

      const layerColor =
        layer.type === 'Input' ? '#38bdf8' :
        layer.type === 'MetacognitiveCritic' ? '#34d399' :
        layer.type === 'Attention' ? '#a78bfa' :
        layer.type === 'Output' ? '#f43f5e' :
        '#818cf8';

      const radius = layer.type === 'MetacognitiveCritic' ? 10 : 7;

      for (let i = 0; i < count; i++) {
        const nodeId = `${layer.id}-node-${i}`;
        nodes.push({
          id: nodeId,
          name: `${layer.name} #${i + 1}`,
          layerId: layer.id,
          layerIndex: layerIdx,
          layerType: layer.type,
          activation: layer.activation,
          color: layerColor,
          radius,
          // Initial horizontal pinning along layer columns
          x: (layerIdx + 1) * layerXStep + (Math.random() - 0.5) * 20,
          y: (height / (count + 1)) * (i + 1) + (Math.random() - 0.5) * 20
        });
      }
    });

    // Construct forward synaptic links between adjacent layers
    for (let l = 0; l < layers.length - 1; l++) {
      const currentLayerNodes = nodes.filter(n => n.layerIndex === l);
      const nextLayerNodes = nodes.filter(n => n.layerIndex === l + 1);

      currentLayerNodes.forEach(src => {
        nextLayerNodes.forEach(tgt => {
          links.push({
            source: src.id,
            target: tgt.id,
            isCriticLoop: false
          });
        });
      });
    }

    // Add critic loopback feedback link if MetacognitiveCritic layer exists
    const criticNodes = nodes.filter(n => n.layerType === 'MetacognitiveCritic');
    if (criticNodes.length > 0) {
      const criticLayerIdx = criticNodes[0].layerIndex;
      const priorNodes = nodes.filter(n => n.layerIndex === Math.max(0, criticLayerIdx - 1));
      criticNodes.forEach(c => {
        priorNodes.forEach(p => {
          links.push({
            source: c.id,
            target: p.id,
            isCriticLoop: true
          });
        });
      });
    }

    // Define Arrow Marker for Critic Feedback
    svg.append('defs').append('marker')
      .attr('id', 'critic-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#10b981');

    // Force Simulation Setup
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(45))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('collision', d3.forceCollide().radius(14))
      .force('x', d3.forceX<GraphNode>(d => (d.layerIndex + 1) * layerXStep).strength(0.85))
      .force('y', d3.forceY(height / 2).strength(0.15));

    // Render Synaptic Links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => (d.isCriticLoop ? '#10b981' : '#334155'))
      .attr('stroke-opacity', d => (d.isCriticLoop ? 0.85 : 0.45))
      .attr('stroke-width', d => (d.isCriticLoop ? 2 : 1))
      .attr('stroke-dasharray', d => (d.isCriticLoop ? '4 3' : 'none'))
      .attr('marker-end', d => (d.isCriticLoop ? 'url(#critic-arrow)' : 'none'));

    // Render Neurons / Nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'cursor-pointer')
      .on('click', (_event, d) => {
        setSelectedNode(d);
      });

    // Outer glow for critic
    node.filter(d => d.layerType === 'MetacognitiveCritic')
      .append('circle')
      .attr('r', 16)
      .attr('fill', '#10b981')
      .attr('fill-opacity', 0.15)
      .attr('class', isSimulating ? 'animate-pulse' : '');

    // Main Node Circle
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2);

    // Node Title tooltip
    node.append('title')
      .text(d => `${d.name}\nType: ${d.layerType}\nActivation: ${d.activation}`);

    // Drag behavior
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);

    // Simulation Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [layers, nodeCountScale, chargeStrength, isSimulating]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  };

  return (
    <div className="border border-slate-800 bg-slate-950/90 rounded overflow-hidden">
      {/* Top Bar for Graph Controls */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            D3 Force-Directed Layer Topology
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Drag neurons or scroll to zoom</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Node Density Control */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setNodeCountScale('condensed')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                nodeCountScale === 'condensed'
                  ? 'bg-slate-800 text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dense
            </button>
            <button
              onClick={() => setNodeCountScale('detailed')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                nodeCountScale === 'detailed'
                  ? 'bg-slate-800 text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expanded
            </button>
          </div>

          {/* Reset Zoom */}
          <button
            onClick={handleResetZoom}
            className="p-1 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded transition-colors"
            title="Reset Graph Zoom & Position"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="relative w-full h-[360px] bg-slate-950 select-none overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-2 left-3 p-2 bg-slate-900/80 backdrop-blur border border-slate-800 rounded text-[10px] font-mono flex flex-wrap gap-3 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-slate-400">Input</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-slate-400">Dense / Feature</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-slate-400">Attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-300 font-semibold">Critic Loopback</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-400">Output</span>
          </div>
        </div>

        {/* Selected Node Details Card */}
        {selectedNode && (
          <div className="absolute top-3 right-3 p-3 bg-slate-900/90 border border-slate-700 rounded text-xs font-mono space-y-1 w-48 shadow-xl backdrop-blur">
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>NEURON NODE</span>
              <button onClick={() => setSelectedNode(null)} className="hover:text-white">✕</button>
            </div>
            <div className="text-slate-100 font-bold">{selectedNode.name}</div>
            <div className="text-slate-300 text-[11px]">Layer: {selectedNode.layerType}</div>
            <div className="text-slate-400 text-[11px]">Activation: {selectedNode.activation}</div>
            <div className="text-emerald-400 text-[11px]">Index: L{selectedNode.layerIndex + 1}</div>
          </div>
        )}
      </div>
    </div>
  );
};
