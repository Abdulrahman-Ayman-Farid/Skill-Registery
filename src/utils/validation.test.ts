import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSkill,
  generateToolSchema,
  generateAgentInstruction,
  generateAgentBundle,
  parseSkillDefinition,
  serializeSkill,
  generateMockInputs,
  simulateToolExecution,
} from './validation.ts';
import type { Skill } from '../types/skill.ts';

const sampleSkill: Skill = {
  id: 'skill-web-search',
  userId: 'user-default',
  name: 'Web Search',
  description: 'Searches the live web using Brave or Google Search API to find recent articles, documentation, or facts.',
  category: 'Search',
  version: '1.2.0',
  author: 'LangChain Community',
  executionType: 'API call',
  tags: ['search', 'web', 'research'],
  status: 'active',
  inputSchema: [
    {
      name: 'query',
      type: 'string',
      required: true,
      description: 'The search query or keywords.',
      exampleValue: 'latest quantum computing breakthroughs 2026',
    },
    {
      name: 'max_results',
      type: 'number',
      required: false,
      description: 'Maximum number of search results to return.',
      defaultValue: 5,
    },
  ],
  outputSchema: {
    type: 'object',
    description: 'List of search result snippets with titles, URLs, and snippets.',
  },
  config: {
    apiKeyName: 'SEARCH_API_KEY',
    endpointUrl: 'https://api.search.example.com/v1',
    timeoutMs: 8000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000 },
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

test('validateSkill accepts a well-formed skill', () => {
  const result = validateSkill(sampleSkill);
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test('validateSkill catches missing required fields and invalid identifiers', () => {
  const invalidSkill: Partial<Skill> = {
    name: 'A',
    description: '',
    category: 'InvalidCat' as any,
    version: '',
    author: '',
    executionType: 'Unknown' as any,
    inputSchema: [
      { name: '123_invalid_start', type: 'string', required: true, description: '' },
      { name: '123_invalid_start', type: 'string', required: false, description: '' }, // duplicate
    ],
    config: {
      timeoutMs: -500,
      retryPolicy: { maxRetries: 20, backoffMs: 0 },
    },
  };

  const result = validateSkill(invalidSkill);
  assert.equal(result.isValid, false);
  const errorFields = result.errors.map((e) => e.field);
  assert.ok(errorFields.includes('name'));
  assert.ok(errorFields.includes('description'));
  assert.ok(errorFields.includes('category'));
  assert.ok(errorFields.includes('version'));
  assert.ok(errorFields.includes('executionType'));
  assert.ok(errorFields.includes('config.timeoutMs'));
  assert.ok(errorFields.includes('config.retryPolicy.maxRetries'));
});

test('generateToolSchema outputs correct OpenAI function call structure', () => {
  const schema = generateToolSchema(sampleSkill, 'openai');
  assert.equal(schema.type, 'function');
  assert.equal(schema.function.name, 'web_search');
  assert.equal(schema.function.parameters.type, 'object');
  assert.ok(schema.function.parameters.properties.query);
  assert.deepEqual(schema.function.parameters.required, ['query']);
});

test('generateToolSchema outputs correct Anthropic tool structure', () => {
  const schema = generateToolSchema(sampleSkill, 'anthropic');
  assert.equal(schema.name, 'web_search');
  assert.ok(schema.input_schema);
  assert.equal(schema.input_schema.type, 'object');
  assert.deepEqual(schema.input_schema.required, ['query']);
});

test('generateToolSchema outputs correct Gemini function declaration structure', () => {
  const schema = generateToolSchema(sampleSkill, 'gemini');
  assert.equal(schema.name, 'web_search');
  assert.equal(schema.parameters.type, 'OBJECT');
  assert.equal(schema.parameters.properties.query.type, 'STRING');
  assert.deepEqual(schema.parameters.required, ['query']);
});

test('generateToolSchema outputs correct MCP tool structure', () => {
  const schema = generateToolSchema(sampleSkill, 'mcp');
  assert.equal(schema.name, 'web_search');
  assert.equal(schema.inputSchema.type, 'object');
  assert.ok(schema.inputSchema.properties.query);
});

test('generateAgentInstruction produces structured Markdown prompt', () => {
  const prompt = generateAgentInstruction(sampleSkill);
  assert.ok(prompt.includes('## Skill: Web Search (v1.2.0)'));
  assert.ok(prompt.includes('Required Arguments:'));
  assert.ok(prompt.includes('`query`'));
});

test('generateAgentBundle bundles tools and manifests correctly', () => {
  const bundle = generateAgentBundle([sampleSkill], 'openai');
  assert.equal(bundle.totalSkills, 1);
  assert.equal(bundle.tools.length, 1);
  assert.equal(bundle.manifest[0].name, 'Web Search');
});

test('parseSkillDefinition and serializeSkill handle JSON and YAML correctly', () => {
  const jsonStr = serializeSkill(sampleSkill, 'json');
  const parsedJson = parseSkillDefinition(jsonStr, 'json');
  assert.ok(parsedJson.skill);
  assert.equal(parsedJson.skill?.name, 'Web Search');

  const yamlStr = serializeSkill(sampleSkill, 'yaml');
  assert.ok(yamlStr.includes('name: Web Search'));
  const parsedYaml = parseSkillDefinition(yamlStr, 'yaml');
  assert.ok(parsedYaml.skill);
  assert.equal(parsedYaml.skill?.name, 'Web Search');
});

test('generateMockInputs resolves parameter example values and sensible defaults', () => {
  const inputs = generateMockInputs(sampleSkill);
  assert.equal(inputs.query, 'latest quantum computing breakthroughs 2026');
  assert.equal(inputs.max_results, 5);
});

test('simulateToolExecution returns successful simulated response payload and metadata', () => {
  const result = simulateToolExecution(sampleSkill);
  assert.equal(result.status, 'success');
  assert.equal(result.statusCode, 200);
  assert.equal(result.skillId, 'skill-web-search');
  assert.equal(result.mockInputs.query, 'latest quantum computing breakthroughs 2026');
  assert.ok(result.durationMs > 0);
  assert.ok(result.response);
  assert.ok(result.timestamp);
});

