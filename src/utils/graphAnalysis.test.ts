import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectCycles,
  findSharedDefinitions,
  computeTopologicalSort,
  analyzeSkillGraph,
  buildD3GraphData,
  checkWouldCreateCycle,
} from './graphAnalysis.ts';
import type { Skill } from '../types/skill.ts';

const createMockSkill = (
  id: string,
  name: string,
  dependencies: string[] = [],
  apiKeyName?: string,
  inputParams: { name: string; type: any }[] = [{ name: 'query', type: 'string' }]
): Skill => ({
  id,
  userId: 'usr_test',
  name,
  description: `Description for ${name}`,
  category: 'Developer Tools',
  version: '1.0.0',
  author: 'Test Author',
  executionType: 'API call',
  tags: ['test'],
  dependencies,
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  inputSchema: inputParams.map((p) => ({
    name: p.name,
    type: p.type,
    required: true,
    description: `Param ${p.name}`,
  })),
  outputSchema: { type: 'object', description: 'Output' },
  config: {
    timeoutMs: 5000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    apiKeyName,
  },
});

test('detectCycles correctly passes a clean DAG without cycles', () => {
  // A -> B -> C
  const sA = createMockSkill('sA', 'Skill A', []);
  const sB = createMockSkill('sB', 'Skill B', ['sA']);
  const sC = createMockSkill('sC', 'Skill C', ['sB']);

  const result = detectCycles([sA, sB, sC]);
  assert.equal(result.hasCycle, false);
  assert.equal(result.cycles.length, 0);
  assert.equal(result.cyclicNodeIds.size, 0);
});

test('detectCycles catches a 2-node mutual circular dependency', () => {
  // A -> B and B -> A
  const sA = createMockSkill('sA', 'Skill A', ['sB']);
  const sB = createMockSkill('sB', 'Skill B', ['sA']);

  const result = detectCycles([sA, sB]);
  assert.equal(result.hasCycle, true);
  assert.ok(result.cycles.length >= 1);
  assert.ok(result.cyclicNodeIds.has('sA'));
  assert.ok(result.cyclicNodeIds.has('sB'));
  assert.ok(result.cyclicEdgeKeys.has('sA->sB') || result.cyclicEdgeKeys.has('sB->sA'));
});

test('detectCycles catches a 3-node cycle (A -> B -> C -> A)', () => {
  const sA = createMockSkill('sA', 'Skill A', ['sC']);
  const sB = createMockSkill('sB', 'Skill B', ['sA']);
  const sC = createMockSkill('sC', 'Skill C', ['sB']);

  const result = detectCycles([sA, sB, sC]);
  assert.equal(result.hasCycle, true);
  assert.ok(result.cyclicNodeIds.has('sA'));
  assert.ok(result.cyclicNodeIds.has('sB'));
  assert.ok(result.cyclicNodeIds.has('sC'));
});

test('findSharedDefinitions identifies shared credentials and parameter signatures', () => {
  const s1 = createMockSkill('s1', 'Google Sheets Tool', [], 'GOOGLE_WORKSPACE_OAUTH', [
    { name: 'query', type: 'string' },
  ]);
  const s2 = createMockSkill('s2', 'Google Calendar Tool', [], 'GOOGLE_WORKSPACE_OAUTH', [
    { name: 'query', type: 'string' },
  ]);
  const s3 = createMockSkill('s3', 'Isolated Tool', [], 'CUSTOM_KEY', [
    { name: 'payload', type: 'object' },
  ]);

  const shared = findSharedDefinitions([s1, s2, s3]);
  const credShared = shared.find((s) => s.type === 'credential');
  assert.ok(credShared);
  assert.ok(credShared.sharedBySkillIds.includes('s1'));
  assert.ok(credShared.sharedBySkillIds.includes('s2'));
});

test('computeTopologicalSort provides valid sequential execution order for DAG', () => {
  // sA (no deps) -> sB (depends on sA) -> sC (depends on sB)
  const sA = createMockSkill('sA', 'Skill A', []);
  const sB = createMockSkill('sB', 'Skill B', ['sA']);
  const sC = createMockSkill('sC', 'Skill C', ['sB']);

  const order = computeTopologicalSort([sC, sA, sB]);
  assert.ok(order);
  assert.equal(order.length, 3);
  assert.ok(order.indexOf('sA') < order.indexOf('sB'));
  assert.ok(order.indexOf('sB') < order.indexOf('sC'));
});

test('buildD3GraphData constructs valid nodes and links for force simulation', () => {
  const sA = createMockSkill('sA', 'Skill A', [], 'API_KEY_1');
  const sB = createMockSkill('sB', 'Skill B', ['sA'], 'API_KEY_1');

  const { nodes, links, analysis } = buildD3GraphData([sA, sB], {
    includeSharedDefinitions: true,
  });

  assert.equal(nodes.length, 2);
  assert.ok(links.length >= 1);
  assert.equal(analysis.hasCycle, false);
});

test('checkWouldCreateCycle detects when adding a link creates a circular loop', () => {
  // sA -> sB. If sA adds sB as dependency, sA -> sB -> sA (cycle!)
  const sA = createMockSkill('sA', 'Skill A', []);
  const sB = createMockSkill('sB', 'Skill B', ['sA']);

  const safeCheck = checkWouldCreateCycle([sA, sB], 'sA', 'non_existent');
  assert.equal(safeCheck.createsCycle, false);

  const cycleCheck = checkWouldCreateCycle([sA, sB], 'sA', 'sB');
  assert.equal(cycleCheck.createsCycle, true);
  assert.ok(cycleCheck.cycleChain?.includes('Skill A') && cycleCheck.cycleChain?.includes('Skill B'));
});
