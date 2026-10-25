import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectSkillChanges,
  createVersionSnapshot,
  revertSkillToSnapshot,
} from './versionHistory.ts';
import type { Skill, SkillVersionSnapshot } from '../types/skill.ts';

const baseSkill: Skill = {
  id: 'skill-test-1',
  userId: 'usr_test',
  name: 'Database Query Tool',
  description: 'Queries Postgres database for customer data.',
  category: 'Data',
  version: '1.0.0',
  author: 'Data Team',
  executionType: 'API call',
  tags: ['sql', 'data'],
  status: 'active',
  inputSchema: [
    {
      name: 'query',
      type: 'string',
      required: true,
      description: 'SQL query',
    },
  ],
  outputSchema: {
    type: 'object',
    description: 'Query result rows',
  },
  config: {
    timeoutMs: 5000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

test('detectSkillChanges detects modified fields and parameters', () => {
  const updatedSkill: Skill = {
    ...baseSkill,
    name: 'Advanced Database Query Tool',
    version: '1.1.0',
    executionType: 'Python function',
    inputSchema: [
      { name: 'query', type: 'string', required: true, description: 'SQL query' },
      { name: 'timeout_override', type: 'number', required: false, description: 'Custom timeout' },
    ],
    config: {
      timeoutMs: 15000,
      retryPolicy: { maxRetries: 2, backoffMs: 1000 },
    },
  };

  const changes = detectSkillChanges(baseSkill, updatedSkill);
  assert.ok(changes.some((c) => c.includes('Renamed from')));
  assert.ok(changes.some((c) => c.includes('Version updated from 1.0.0 to 1.1.0')));
  assert.ok(changes.some((c) => c.includes('Execution type changed to Python function')));
  assert.ok(changes.some((c) => c.includes('Added parameter(s): "timeout_override"')));
  assert.ok(changes.some((c) => c.includes('Execution timeout updated to 15000ms')));
});

test('createVersionSnapshot captures full skill snapshot', () => {
  const snapshot = createVersionSnapshot(baseSkill, 'Initial release', 'Alice');
  assert.equal(snapshot.version, '1.0.0');
  assert.equal(snapshot.author, 'Alice');
  assert.equal(snapshot.changeSummary, 'Initial release');
  assert.equal(snapshot.skillState.name, 'Database Query Tool');
  assert.equal(snapshot.skillState.inputSchema.length, 1);
});

test('revertSkillToSnapshot restores properties and logs history entry', () => {
  const snapshotV1 = createVersionSnapshot(baseSkill, 'Version 1.0.0', 'Alice');

  const modifiedSkill: Skill = {
    ...baseSkill,
    name: 'Broken Query Tool',
    version: '2.0.0',
    description: 'Bad description',
    versionHistory: [snapshotV1],
  };

  const reverted = revertSkillToSnapshot(modifiedSkill, snapshotV1, 'Bob');

  // Verify properties were restored
  assert.equal(reverted.name, 'Database Query Tool');
  assert.equal(reverted.version, '1.0.0');
  assert.equal(reverted.description, 'Queries Postgres database for customer data.');

  // Verify history contains revert record
  assert.ok(reverted.versionHistory && reverted.versionHistory.length >= 2);
  assert.ok(reverted.versionHistory?.[0].changeSummary.includes('Reverted to version 1.0.0'));
});
