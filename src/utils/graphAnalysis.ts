import type { Skill } from '../types/skill.ts';

export interface GraphNode {
  id: string;
  name: string;
  category: string;
  version: string;
  status: string;
  executionType: string;
  paramCount: number;
  apiKeyName?: string;
  isExample?: boolean;
  isInCycle?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export type LinkType = 'dependency' | 'cycle' | 'shared_definition';

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: LinkType;
  label?: string;
  isCycle?: boolean;
  sharedItem?: string;
}

export interface CyclePath {
  nodeIds: string[];
  nodeNames: string[];
  description: string;
}

export interface SharedDefinition {
  type: 'credential' | 'parameter' | 'source';
  label: string;
  sharedBySkillIds: string[];
  sharedBySkillNames: string[];
}

export interface GraphAnalysisResult {
  hasCycle: boolean;
  cycles: CyclePath[];
  cyclicNodeIds: Set<string>;
  cyclicEdgeKeys: Set<string>; // "source->target"
  sharedDefinitions: SharedDefinition[];
  topologicalOrder: string[] | null; // safe sequential execution order if DAG
}

/**
 * Detects circular dependencies in a set of skills using Depth-First Search with recursion stack tracking.
 */
export function detectCycles(skills: Skill[]): {
  hasCycle: boolean;
  cycles: CyclePath[];
  cyclicNodeIds: Set<string>;
  cyclicEdgeKeys: Set<string>;
} {
  const skillMap = new Map<string, Skill>();
  skills.forEach((s) => skillMap.set(s.id, s));

  const adj = new Map<string, string[]>();
  skills.forEach((s) => {
    // Collect valid dependencies that are currently in the selected skills list
    const deps = (s.dependencies || []).filter((depId) => skillMap.has(depId));
    adj.set(s.id, deps);
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const pathStack: string[] = [];
  const cycles: CyclePath[] = [];
  const cyclicNodeIds = new Set<string>();
  const cyclicEdgeKeys = new Set<string>();

  function dfs(curr: string) {
    visited.add(curr);
    recStack.add(curr);
    pathStack.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        // Cycle found! Extract the cycle path from neighbor to current
        const cycleStartIndex = pathStack.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cycleNodes = pathStack.slice(cycleStartIndex);
          cycleNodes.push(neighbor); // Close the loop in presentation

          const nodeNames = cycleNodes.map(
            (id) => skillMap.get(id)?.name || id
          );

          cycles.push({
            nodeIds: cycleNodes,
            nodeNames,
            description: nodeNames.join(' ➔ '),
          });

          // Mark cyclic nodes and edges
          for (let i = 0; i < cycleNodes.length - 1; i++) {
            cyclicNodeIds.add(cycleNodes[i]);
            cyclicEdgeKeys.add(`${cycleNodes[i]}->${cycleNodes[i + 1]}`);
          }
        }
      }
    }

    pathStack.pop();
    recStack.delete(curr);
  }

  for (const s of skills) {
    if (!visited.has(s.id)) {
      dfs(s.id);
    }
  }

  return {
    hasCycle: cycles.length > 0,
    cycles,
    cyclicNodeIds,
    cyclicEdgeKeys,
  };
}

/**
 * Finds shared tool definitions: identical API keys/credentials, identical input parameters, or shared sources.
 */
export function findSharedDefinitions(skills: Skill[]): SharedDefinition[] {
  const shared: SharedDefinition[] = [];

  // 1. Shared Credentials / API Keys
  const credMap = new Map<string, Skill[]>();
  skills.forEach((s) => {
    const cred = s.config?.apiKeyName || (s.requiredCredentials && s.requiredCredentials[0]);
    if (cred) {
      const list = credMap.get(cred) || [];
      list.push(s);
      credMap.set(cred, list);
    }
  });

  credMap.forEach((matchedSkills, cred) => {
    if (matchedSkills.length > 1) {
      shared.push({
        type: 'credential',
        label: `Shared Credential: ${cred}`,
        sharedBySkillIds: matchedSkills.map((s) => s.id),
        sharedBySkillNames: matchedSkills.map((s) => s.name),
      });
    }
  });

  // 2. Shared Common Parameter Signatures (e.g. "query: string", "url: string", "code: string")
  const paramMap = new Map<string, Skill[]>();
  skills.forEach((s) => {
    (s.inputSchema || []).forEach((param) => {
      const key = `${param.name}:${param.type}`;
      const list = paramMap.get(key) || [];
      if (!list.some((existing) => existing.id === s.id)) {
        list.push(s);
      }
      paramMap.set(key, list);
    });
  });

  paramMap.forEach((matchedSkills, paramSig) => {
    // Only report meaningful parameter signatures shared by 3 or more skills or specific keys
    if (matchedSkills.length >= 2 && ['query:string', 'url:string', 'file_path:string', 'sql:string'].includes(paramSig)) {
      shared.push({
        type: 'parameter',
        label: `Shared Parameter Signature: ${paramSig}`,
        sharedBySkillIds: matchedSkills.map((s) => s.id),
        sharedBySkillNames: matchedSkills.map((s) => s.name),
      });
    }
  });

  return shared;
}

/**
 * Computes topological sort for safe pipeline execution order (Kahn's algorithm).
 */
export function computeTopologicalSort(skills: Skill[]): string[] | null {
  const skillMap = new Map<string, Skill>();
  skills.forEach((s) => skillMap.set(s.id, s));

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  skills.forEach((s) => {
    inDegree.set(s.id, 0);
    adj.set(s.id, []);
  });

  skills.forEach((s) => {
    const deps = (s.dependencies || []).filter((depId) => skillMap.has(depId));
    // depId -> s.id (depId must run before s.id)
    deps.forEach((depId) => {
      adj.get(depId)?.push(s.id);
      inDegree.set(s.id, (inDegree.get(s.id) || 0) + 1);
    });
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const order: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const neighbor of neighbors) {
      const updated = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, updated);
      if (updated === 0) {
        queue.push(neighbor);
      }
    }
  }

  return order.length === skills.length ? order : null;
}

/**
 * Comprehensive analysis of skill graph.
 */
export function analyzeSkillGraph(skills: Skill[]): GraphAnalysisResult {
  const cycleInfo = detectCycles(skills);
  const sharedDefinitions = findSharedDefinitions(skills);
  const topologicalOrder = cycleInfo.hasCycle ? null : computeTopologicalSort(skills);

  return {
    hasCycle: cycleInfo.hasCycle,
    cycles: cycleInfo.cycles,
    cyclicNodeIds: cycleInfo.cyclicNodeIds,
    cyclicEdgeKeys: cycleInfo.cyclicEdgeKeys,
    sharedDefinitions,
    topologicalOrder,
  };
}

/**
 * Builds nodes and links suitable for D3 Force simulation.
 */
export function buildD3GraphData(
  skills: Skill[],
  options: {
    includeSharedDefinitions?: boolean;
    onlyCycles?: boolean;
  } = {}
): {
  nodes: GraphNode[];
  links: GraphLink[];
  analysis: GraphAnalysisResult;
} {
  const analysis = analyzeSkillGraph(skills);
  const skillMap = new Map<string, Skill>();
  skills.forEach((s) => skillMap.set(s.id, s));

  // If onlyCycles is active, filter nodes to cyclic ones
  const filteredSkills = options.onlyCycles
    ? skills.filter((s) => analysis.cyclicNodeIds.has(s.id))
    : skills;

  const nodes: GraphNode[] = filteredSkills.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    version: s.version,
    status: s.status,
    executionType: s.executionType,
    paramCount: s.inputSchema?.length || 0,
    apiKeyName: s.config?.apiKeyName,
    isExample: s.isExample,
    isInCycle: analysis.cyclicNodeIds.has(s.id),
  }));

  const links: GraphLink[] = [];
  const addedEdgeKeys = new Set<string>();

  // 1. Dependency Links
  filteredSkills.forEach((s) => {
    const deps = s.dependencies || [];
    deps.forEach((depId) => {
      if (skillMap.has(depId)) {
        // depId -> s.id: depId is dependency of s.id
        const isCycle = analysis.cyclicEdgeKeys.has(`${s.id}->${depId}`) ||
          analysis.cyclicEdgeKeys.has(`${depId}->${s.id}`);

        const key = `${depId}->${s.id}`;
        if (!addedEdgeKeys.has(key)) {
          addedEdgeKeys.add(key);
          links.push({
            id: key,
            source: depId,
            target: s.id,
            type: isCycle ? 'cycle' : 'dependency',
            isCycle,
            label: isCycle ? 'Circular Dependency' : 'Depends on',
          });
        }
      }
    });
  });

  // 2. Shared Definition Links (if requested)
  if (options.includeSharedDefinitions && !options.onlyCycles) {
    analysis.sharedDefinitions.forEach((def, defIdx) => {
      const ids = def.sharedBySkillIds.filter((id) => skillMap.has(id));
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = `shared-${defIdx}-${ids[i]}-${ids[j]}`;
          if (!addedEdgeKeys.has(key)) {
            addedEdgeKeys.add(key);
            links.push({
              id: key,
              source: ids[i],
              target: ids[j],
              type: 'shared_definition',
              label: def.label,
              sharedItem: def.label,
            });
          }
        }
      }
    });
  }

  return { nodes, links, analysis };
}

/**
 * Evaluates whether adding a dependency link from `skillId` to `targetDependencyId`
 * would introduce a circular dependency cycle.
 * Returns { createsCycle: boolean, cycleChain?: string, cycleNodes?: string[] }.
 */
export function checkWouldCreateCycle(
  skills: Skill[],
  skillId: string,
  targetDependencyId: string
): {
  createsCycle: boolean;
  cycleChain?: string;
  cycleNodes?: string[];
} {
  const simulatedSkills = skills.map((s) => {
    if (s.id === skillId) {
      const currentDeps = s.dependencies || [];
      if (!currentDeps.includes(targetDependencyId)) {
        return {
          ...s,
          dependencies: [...currentDeps, targetDependencyId],
        };
      }
    }
    return s;
  });

  const cycleInfo = detectCycles(simulatedSkills);
  if (cycleInfo.hasCycle) {
    const matchingCycle =
      cycleInfo.cycles.find(
        (c) => c.nodeIds.includes(skillId) && c.nodeIds.includes(targetDependencyId)
      ) || cycleInfo.cycles[0];

    return {
      createsCycle: true,
      cycleChain: matchingCycle?.description,
      cycleNodes: matchingCycle?.nodeIds,
    };
  }

  return { createsCycle: false };
}
