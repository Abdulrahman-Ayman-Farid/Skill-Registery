import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  AlertTriangle,
  CheckCircle2,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  Eye,
  Layers,
  ArrowRight,
  Info,
  Maximize2,
  Key,
  ShieldAlert,
} from 'lucide-react';
import { Skill } from '../types/skill.ts';
import {
  buildD3GraphData,
  checkWouldCreateCycle,
  GraphNode,
  GraphLink,
  GraphAnalysisResult,
  CyclePath,
  SharedDefinition,
} from '../utils/graphAnalysis.ts';
import { useToast } from './Toast.tsx';

interface AgentDependencyGraphProps {
  skills: Skill[];
  selectedSkillIds: string[];
  onToggleSelectSkill: (skillId: string) => void;
  onUpdateSkillDependencies?: (skillId: string, newDependencies: string[]) => void;
  isDarkMode?: boolean;
}

const CATEGORY_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  Search: { fill: '#3b82f6', stroke: '#60a5fa', text: '#bfdbfe' },
  Data: { fill: '#10b981', stroke: '#34d399', text: '#a7f3d0' },
  Files: { fill: '#f59e0b', stroke: '#fbbf24', text: '#fde68a' },
  Communication: { fill: '#ec4899', stroke: '#f472b6', text: '#fbcfe8' },
  'Developer Tools': { fill: '#06b6d4', stroke: '#22d3ee', text: '#cffafe' },
  Vision: { fill: '#8b5cf6', stroke: '#a78bfa', text: '#ede9fe' },
  RAG: { fill: '#6366f1', stroke: '#818cf8', text: '#e0e7ff' },
  Productivity: { fill: '#14b8a6', stroke: '#2dd4bf', text: '#ccfbf1' },
};

export function AgentDependencyGraph({
  skills,
  selectedSkillIds,
  onToggleSelectSkill,
  onUpdateSkillDependencies,
  isDarkMode = true,
}: AgentDependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Filter modes
  const [filterMode, setFilterMode] = useState<'all' | 'dependencies' | 'cycles' | 'shared'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [simulatedCycle, setSimulatedCycle] = useState(false);
  const { showToast } = useToast();

  // Active circular dependency warning state for the Dependency Editor
  const [activeCycleError, setActiveCycleError] = useState<{
    targetId: string;
    targetName: string;
    cycleChain: string;
  } | null>(null);

  // Clear warning when switching selected skill
  useEffect(() => {
    setActiveCycleError(null);
  }, [selectedNodeId]);

  // Dynamic skill list incorporating simulated cycle if toggled
  const activeSkills = useMemo(() => {
    const list = skills.filter((s) =>
      selectedSkillIds.length > 0 ? selectedSkillIds.includes(s.id) : true
    );

    if (!simulatedCycle) return list;

    // Inject a simulated cycle: make web-search depend on send-email-draft (closing a loop)
    return list.map((s) => {
      if (s.id === 'starter-web-search' || s.name.toLowerCase().includes('search')) {
        const emailSkill = list.find(
          (other) => other.id === 'starter-send-email-draft' || other.name.toLowerCase().includes('email')
        );
        if (emailSkill) {
          const currentDeps = s.dependencies || [];
          if (!currentDeps.includes(emailSkill.id)) {
            return {
              ...s,
              dependencies: [...currentDeps, emailSkill.id],
            };
          }
        }
      }
      return s;
    });
  }, [skills, selectedSkillIds, simulatedCycle]);

  // Graph data and analysis
  const graphData = useMemo(() => {
    return buildD3GraphData(activeSkills, {
      includeSharedDefinitions: filterMode === 'all' || filterMode === 'shared',
      onlyCycles: filterMode === 'cycles',
    });
  }, [activeSkills, filterMode]);

  const { analysis } = graphData;

  // Selected node details
  const selectedSkill = useMemo(() => {
    return activeSkills.find((s) => s.id === selectedNodeId) || null;
  }, [activeSkills, selectedNodeId]);

  // D3 force simulation effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Setup defs for arrow markers and glow filters
    const defs = svg.append('defs');

    // Normal arrow marker
    defs
      .append('marker')
      .attr('id', 'arrow-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 26)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', isDarkMode ? '#818cf8' : '#C15F3C');

    // Cycle warning arrow marker (Red/Amber)
    defs
      .append('marker')
      .attr('id', 'arrow-cycle')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 26)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f43f5e');

    // Main graph container group for zoom/pan
    const g = svg.append('g').attr('class', 'graph-content');

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Background click to clear node inspection
    svg.on('click', (event) => {
      if (event.target === svgRef.current) {
        setSelectedNodeId(null);
      }
    });

    // Deep copy nodes and links for simulation
    const simNodes: GraphNode[] = graphData.nodes.map((d) => ({ ...d }));
    const simLinks: GraphLink[] = graphData.links.map((d) => ({ ...d }));

    // D3 Force Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => (d.type === 'cycle' ? 90 : d.type === 'shared_definition' ? 140 : 110))
      )
      .force('charge', d3.forceManyBody().strength(-320))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(42));

    // Render Links (Edges)
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (d.type === 'cycle') return '#f43f5e';
        if (d.type === 'shared_definition') return isDarkMode ? '#06b6d4' : '#0284c7';
        return isDarkMode ? '#4f46e5' : '#C15F3C';
      })
      .attr('stroke-width', (d) => (d.type === 'cycle' ? 2.5 : d.type === 'shared_definition' ? 1.5 : 1.8))
      .attr('stroke-opacity', (d) => (d.type === 'cycle' ? 0.95 : d.type === 'shared_definition' ? 0.45 : 0.7))
      .attr('stroke-dasharray', (d) =>
        d.type === 'cycle' ? '6,3' : d.type === 'shared_definition' ? '3,3' : 'none'
      )
      .attr('marker-end', (d) =>
        d.type === 'cycle' ? 'url(#arrow-cycle)' : d.type === 'dependency' ? 'url(#arrow-normal)' : 'none'
      );

    // Link labels for shared definitions or circular warning
    const linkLabels = g
      .append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(simLinks.filter((d) => d.type === 'cycle' || d.type === 'shared_definition'))
      .enter()
      .append('text')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', (d) => (d.type === 'cycle' ? '#f43f5e' : isDarkMode ? '#22d3ee' : '#0369a1'))
      .attr('text-anchor', 'middle')
      .text((d) => (d.type === 'cycle' ? '⚠️ Cycle Loop' : d.sharedItem ? 'Shared Def' : ''));

    // Render Nodes (Skills)
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node-group cursor-pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
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
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);
      })
      .on('mouseenter', (_, d) => {
        link
          .attr('stroke-opacity', (l) => {
            const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
            const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
            return sId === d.id || tId === d.id ? 1 : 0.15;
          })
          .attr('stroke-width', (l) => {
            const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
            const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
            return sId === d.id || tId === d.id ? 3 : 1;
          });
      })
      .on('mouseleave', () => {
        link
          .attr('stroke-opacity', (d) => (d.type === 'cycle' ? 0.95 : d.type === 'shared_definition' ? 0.45 : 0.7))
          .attr('stroke-width', (d) => (d.type === 'cycle' ? 2.5 : d.type === 'shared_definition' ? 1.5 : 1.8));
      });

    // Selected Halo Ring
    node
      .filter((d) => d.id === selectedNodeId)
      .append('circle')
      .attr('r', 27)
      .attr('fill', 'none')
      .attr('stroke', isDarkMode ? '#22d3ee' : '#C15F3C')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4,2')
      .attr('class', 'animate-pulse');

    // Outer Circle / Glow for Circular Dependencies
    node
      .filter((d) => Boolean(d.isInCycle))
      .append('circle')
      .attr('r', 28)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4,2')
      .attr('opacity', 0.9)
      .attr('class', 'animate-pulse');

    // Main Node Circle
    node
      .append('circle')
      .attr('r', 22)
      .attr('fill', (d) => {
        const cat = CATEGORY_COLORS[d.category] || { fill: '#64748b' };
        return cat.fill;
      })
      .attr('fill-opacity', isDarkMode ? 0.85 : 0.9)
      .attr('stroke', (d) => {
        if (d.isInCycle) return '#f43f5e';
        const cat = CATEGORY_COLORS[d.category] || { stroke: '#94a3b8' };
        return cat.stroke;
      })
      .attr('stroke-width', 2)
      .attr('class', 'transition-all duration-150 hover:scale-110');

    // Inner icon / first letter
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d) => d.name.charAt(0).toUpperCase());

    // Node Label (Below circle)
    node
      .append('text')
      .attr('dy', 34)
      .attr('text-anchor', 'middle')
      .attr('fill', isDarkMode ? '#e2e8f0' : '#1F1E1B')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text((d) => (d.name.length > 18 ? `${d.name.slice(0, 16)}...` : d.name));

    // Category Kicker (Below name)
    node
      .append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .attr('fill', isDarkMode ? '#94a3b8' : '#645F57')
      .attr('font-size', '8.5px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('pointer-events', 'none')
      .text((d) => d.category);

    // Simulation Tick Update
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x || 0)
        .attr('y1', (d) => (d.source as GraphNode).y || 0)
        .attr('x2', (d) => (d.target as GraphNode).x || 0)
        .attr('y2', (d) => (d.target as GraphNode).y || 0);

      linkLabels
        .attr('x', (d) => (((d.source as GraphNode).x || 0) + ((d.target as GraphNode).x || 0)) / 2)
        .attr('y', (d) => (((d.source as GraphNode).y || 0) + ((d.target as GraphNode).y || 0)) / 2 - 4);

      node.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    return () => {
      simulation.stop();
      zoomBehaviorRef.current = null;
    };
  }, [graphData, isDarkMode, selectedNodeId]);

  // Zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(350).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Handler to toggle dependency between selected skill and another skill
  const handleToggleDependency = (targetSkillId: string) => {
    if (!selectedSkill || !onUpdateSkillDependencies) return;
    const currentDeps = selectedSkill.dependencies || [];
    let updated: string[];

    if (currentDeps.includes(targetSkillId)) {
      // Removing a dependency is always safe (never introduces a cycle)
      updated = currentDeps.filter((id) => id !== targetSkillId);
      onUpdateSkillDependencies(selectedSkill.id, updated);
      setActiveCycleError(null);
      showToast('Prerequisite Removed', `Unlinked "${skills.find((s) => s.id === targetSkillId)?.name || 'skill'}".`);
    } else {
      // Adding a dependency: Check if this would create a circular dependency loop
      const cycleCheck = checkWouldCreateCycle(skills, selectedSkill.id, targetSkillId);
      const targetSkill = skills.find((s) => s.id === targetSkillId);

      if (cycleCheck.createsCycle) {
        // Block save and highlight in red!
        const chain =
          cycleCheck.cycleChain ||
          `${selectedSkill.name} ➔ ${targetSkill?.name || targetSkillId} ➔ ${selectedSkill.name}`;

        setActiveCycleError({
          targetId: targetSkillId,
          targetName: targetSkill?.name || targetSkillId,
          cycleChain: chain,
        });

        showToast(
          'Circular Dependency Blocked',
          `Cannot save: Adding "${targetSkill?.name || targetSkillId}" creates a recursive loop (${chain}). Saving is prohibited.`,
          'error'
        );
        return; // PREVENT SAVE!
      }

      // Safe to link
      setActiveCycleError(null);
      updated = [...currentDeps, targetSkillId];
      onUpdateSkillDependencies(selectedSkill.id, updated);
      showToast('Prerequisite Linked', `Linked "${targetSkill?.name || 'skill'}" as prerequisite.`);
    }
  };

  // Handler to break cycles
  const handleBreakCycle = (cycle: CyclePath) => {
    if (!onUpdateSkillDependencies || cycle.nodeIds.length < 2) return;
    // Break the last link of the cycle
    const targetNodeId = cycle.nodeIds[cycle.nodeIds.length - 2];
    const sourceNodeId = cycle.nodeIds[0];

    const sourceSkill = skills.find((s) => s.id === sourceNodeId);
    if (sourceSkill) {
      const updated = (sourceSkill.dependencies || []).filter((id) => id !== targetNodeId);
      onUpdateSkillDependencies(sourceSkill.id, updated);
    }
    setSimulatedCycle(false);
  };

  return (
    <div className="space-y-4">
      {/* Status & Diagnostic Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] text-xs claude-card-shadow dark:shadow-[0_0_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
              analysis.hasCycle
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {analysis.hasCycle ? (
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#1F1E1B] dark:text-white">
                {analysis.hasCycle
                  ? `${analysis.cycles.length} Circular Dependency Loop(s) Detected`
                  : 'Valid Directed Acyclic Graph (DAG)'}
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                  analysis.hasCycle
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                }`}
              >
                {analysis.hasCycle ? 'CYCLE HAZARD' : 'SAFE FOR AGENT EXECUTION'}
              </span>
            </div>
            <p className="text-[11px] text-[#645F57] dark:text-slate-400 mt-0.5">
              {analysis.hasCycle
                ? 'Autonomous agents may enter infinite loops or deadlock without recursion depth limits.'
                : 'All tool dependencies resolve deterministically. Ready for multi-step autonomous planning.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSimulatedCycle(!simulatedCycle)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              simulatedCycle
                ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                : 'bg-[#F8F5EF] dark:bg-[#070A13] text-[#645F57] dark:text-slate-300 border-[#E5DFD5] dark:border-indigo-500/30 hover:border-rose-400'
            }`}
            title="Inject a feedback loop to test circular dependency highlighting"
          >
            {simulatedCycle ? 'Remove Test Cycle' : 'Simulate Circular Dependency'}
          </button>

          {/* Filter Modes */}
          <div className="flex rounded-xl bg-[#F8F5EF] dark:bg-[#070A13] p-0.5 border border-[#E5DFD5] dark:border-indigo-500/30">
            {(
              [
                { id: 'all', label: 'All Links' },
                { id: 'dependencies', label: 'Dependencies Only' },
                { id: 'cycles', label: 'Cycles Only' },
                { id: 'shared', label: 'Shared Definitions' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterMode(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  filterMode === m.id
                    ? 'bg-[#C15F3C] text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 shadow-xs'
                    : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Circular Dependency Warning Callout */}
      {analysis.hasCycle && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-500/50 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-semibold text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Highlighted Circular Paths:</span>
            </span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
              Highlighted in pulsating red on canvas
            </span>
          </div>

          <div className="space-y-1.5">
            {analysis.cycles.map((cycle, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-white/60 dark:bg-black/40 border border-rose-500/20 text-xs flex-wrap gap-2"
              >
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-rose-700 dark:text-rose-300">
                  <span className="font-bold">Loop #{idx + 1}:</span>
                  <span>{cycle.description}</span>
                </div>

                {onUpdateSkillDependencies && (
                  <button
                    onClick={() => handleBreakCycle(cycle)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] shadow-xs transition-colors"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Break Cycle</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Canvas & Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Force-Directed Graph SVG Canvas (3 Cols) */}
        <div
          ref={containerRef}
          className="lg:col-span-3 relative h-[480px] rounded-3xl border border-[#E5DFD5] dark:border-indigo-500/30 bg-[#FAF8F5] dark:bg-[#070A13] overflow-hidden claude-card-shadow dark:shadow-[0_0_30px_rgba(0,0,0,0.8)]"
        >
          {/* Floating Canvas Badges & Legend */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg bg-[#FFFFFF]/90 dark:bg-[#0D1424]/90 backdrop-blur-md border border-[#E5DFD5] dark:border-indigo-500/30 text-[10px] font-mono text-[#645F57] dark:text-cyan-400 font-semibold shadow-xs">
              Interactive Force Layout • {graphData.nodes.length} Nodes • {graphData.links.length} Edges
            </span>
          </div>

          {/* Floating Canvas Zoom Controls */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 p-1 rounded-xl bg-[#FFFFFF]/90 dark:bg-[#0D1424]/90 backdrop-blur-md border border-[#E5DFD5] dark:border-indigo-500/30 shadow-xs">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-white hover:bg-[#F3EFEA] dark:hover:bg-slate-800 transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-white hover:bg-[#F3EFEA] dark:hover:bg-slate-800 transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-3.5 bg-[#E5DFD5] dark:bg-slate-700 mx-0.5" />
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-white hover:bg-[#F3EFEA] dark:hover:bg-slate-800 transition-colors"
              title="Reset View"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Legend */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#FFFFFF]/90 dark:bg-[#0D1424]/90 backdrop-blur-md border border-[#E5DFD5] dark:border-indigo-500/25 text-[10px] font-mono text-[#645F57] dark:text-slate-400 shadow-xs pointer-events-none">
            <div className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#C15F3C] dark:bg-indigo-400 inline-block" />
              <span>Dependency</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" />
              <span>Circular Cycle</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-0.5 border-b border-dashed border-cyan-500 inline-block" />
              <span>Shared Credential/Schema</span>
            </div>
          </div>

          {/* Graph SVG Element */}
          <svg ref={svgRef} className="w-full h-full select-none" />
        </div>

        {/* Node & Dependency Inspector Panel (1 Col) */}
        <div className="lg:col-span-1 rounded-3xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] p-4 flex flex-col justify-between text-xs claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] h-[480px] overflow-y-auto">
          {selectedSkill ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C15F3C] dark:text-cyan-300">
                    {selectedSkill.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#918B80] dark:text-slate-500">
                    v{selectedSkill.version}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#1F1E1B] dark:text-white mt-1">
                  {selectedSkill.name}
                </h4>
                <p className="text-[11px] text-[#645F57] dark:text-slate-400 mt-1 line-clamp-2">
                  {selectedSkill.description}
                </p>
              </div>

              {/* Warning Indicator: Highlights Circular Dependency Chains in Red */}
              {(activeCycleError || (selectedSkill && analysis.cyclicNodeIds.has(selectedSkill.id))) && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 text-rose-800 dark:text-rose-200 space-y-2 animate-fadeIn shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />
                      <span>Circular Dependency Hazard</span>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold tracking-wide">
                      PROHIBITED
                    </span>
                  </div>

                  <p className="text-[10px] text-rose-700 dark:text-rose-300 leading-snug">
                    {activeCycleError
                      ? `Adding "${activeCycleError.targetName}" as a prerequisite would create a recursive loop. Saving is blocked:`
                      : 'This skill is involved in an active circular dependency loop. Saving circular configurations is prohibited:'}
                  </p>

                  <div className="p-2 rounded-xl bg-white dark:bg-black/60 border border-rose-300 dark:border-rose-800/60 font-mono text-[10px] text-rose-700 dark:text-rose-300 font-semibold leading-relaxed break-words shadow-inner">
                    {activeCycleError?.cycleChain ||
                      analysis.cycles.find((c) => c.nodeIds.includes(selectedSkill.id))?.description ||
                      'Recursive loop detected'}
                  </div>

                  <div className="flex items-center justify-between pt-0.5 text-[9px] font-semibold text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Configuration save blocked</span>
                    </span>
                    {activeCycleError && (
                      <button
                        onClick={() => setActiveCycleError(null)}
                        className="text-[10px] text-rose-600 hover:text-rose-800 dark:text-rose-300 dark:hover:text-white underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Upstream Prerequisites (Dependency Editor) */}
              <div className="space-y-1.5 border-t border-[#EFEAE2] dark:border-indigo-500/20 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-[#1F1E1B] dark:text-slate-200">
                    Prerequisite Skills ({selectedSkill.dependencies?.length || 0})
                  </span>
                  <span className="text-[10px] font-mono text-[#645F57] dark:text-slate-400">
                    Dependency Editor
                  </span>
                </div>
                <p className="text-[10px] text-[#645F57] dark:text-slate-400">
                  Must run before this skill executes. Recursive loops are prohibited.
                </p>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pt-1 pr-0.5">
                  {skills
                    .filter((s) => s.id !== selectedSkill.id)
                    .map((other) => {
                      const isDep = selectedSkill.dependencies?.includes(other.id);
                      const cycleCheck = !isDep
                        ? checkWouldCreateCycle(skills, selectedSkill.id, other.id)
                        : { createsCycle: false };
                      const isCycleHazard = cycleCheck.createsCycle;
                      const isTargetActiveError = activeCycleError?.targetId === other.id;

                      return (
                        <div
                          key={other.id}
                          onClick={() => handleToggleDependency(other.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-[11px] cursor-pointer transition-all ${
                            isDep
                              ? 'border-[#C15F3C]/40 bg-[#C15F3C]/10 text-[#C15F3C] dark:border-cyan-400/40 dark:bg-cyan-500/10 dark:text-cyan-300 font-semibold'
                              : isCycleHazard || isTargetActiveError
                              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold shadow-xs ring-1 ring-rose-500/40'
                              : 'border-[#E5DFD5] dark:border-slate-800 text-[#645F57] dark:text-slate-400 hover:bg-[#F8F5EF] dark:hover:bg-slate-800/60'
                          }`}
                          title={
                            isCycleHazard
                              ? `Blocked: Creates recursive loop (${cycleCheck.cycleChain})`
                              : isDep
                              ? 'Click to unlink prerequisite'
                              : 'Click to link prerequisite'
                          }
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-1">
                            {isCycleHazard && (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />
                            )}
                            <span className="truncate">{other.name}</span>
                          </div>

                          <div className="shrink-0 flex items-center gap-1">
                            {isDep ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#C15F3C]/20 dark:bg-cyan-500/20">
                                Linked
                              </span>
                            ) : isCycleHazard ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-600 text-white dark:bg-rose-600 shadow-xs">
                                LOOP HAZARD
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#645F57] dark:text-slate-400">
                                + Add
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Shared Definitions & Credentials */}
              {selectedSkill.config?.apiKeyName && (
                <div className="p-2.5 rounded-xl bg-[#F8F5EF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800 text-[10px]">
                  <span className="font-semibold text-[#645F57] dark:text-slate-400 block mb-1">
                    Credential Scope:
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[#1F1E1B] dark:text-cyan-300">
                    <Key className="w-3 h-3 text-amber-500" />
                    <span>{selectedSkill.config.apiKeyName}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 text-[#918B80] dark:text-slate-500 space-y-2">
              <Share2 className="w-8 h-8 stroke-1 text-[#C15F3C]/60 dark:text-cyan-400/60" />
              <p className="font-semibold text-xs text-[#1F1E1B] dark:text-slate-300">
                Click any Node to Inspect
              </p>
              <p className="text-[11px] text-[#645F57] dark:text-slate-400 leading-relaxed">
                Click any skill node on the canvas to view incoming prerequisites, toggle dependency links, or inspect shared tool definitions.
              </p>
            </div>
          )}

          {/* Quick Clear Selection button */}
          {selectedSkill && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="mt-3 w-full py-1.5 rounded-xl border border-[#E5DFD5] dark:border-slate-700 hover:bg-[#F8F5EF] dark:hover:bg-slate-800 text-center text-[11px] font-medium text-[#645F57] dark:text-slate-400 transition-colors"
            >
              Clear Inspector
            </button>
          )}
        </div>
      </div>

      {/* Shared Definitions Summary Bar */}
      {analysis.sharedDefinitions.length > 0 && (
        <div className="p-4 rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] text-xs space-y-2 claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#C15F3C] dark:text-cyan-400" />
            <h4 className="font-bold text-xs text-[#1F1E1B] dark:text-white">
              Shared Tool Definitions & Parameter Signatures ({analysis.sharedDefinitions.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {analysis.sharedDefinitions.map((def, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-[#E5DFD5] dark:border-slate-800 bg-[#F8F5EF] dark:bg-[#070A13] text-[11px] space-y-1"
              >
                <div className="font-semibold text-[#1F1E1B] dark:text-cyan-300 font-mono text-[10px]">
                  {def.label}
                </div>
                <div className="text-[10px] text-[#645F57] dark:text-slate-400 line-clamp-1">
                  Shared across: {def.sharedBySkillNames.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sequential Execution Pipeline (Topological DAG Order) */}
      {!analysis.hasCycle && analysis.topologicalOrder && (
        <div className="p-4 rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] text-xs space-y-2 claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-xs text-[#1F1E1B] dark:text-white">
                Recommended Sequential Execution Pipeline
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Topological Resolution Order
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-2">
            {analysis.topologicalOrder.map((nodeId, idx) => {
              const s = skills.find((item) => item.id === nodeId);
              if (!s) return null;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5DFD5] dark:border-indigo-500/30 bg-[#F8F5EF] dark:bg-[#070A13] shrink-0">
                    <span className="w-4 h-4 rounded-full bg-[#C15F3C] dark:bg-cyan-500 text-white font-bold text-[9px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-xs text-[#1F1E1B] dark:text-slate-200">
                      {s.name}
                    </span>
                  </div>
                  {idx < analysis.topologicalOrder!.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
