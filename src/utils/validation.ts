import YAML from 'yaml';
import type {
  Skill,
  ParameterDefinition,
  ValidationResult,
  ValidationIssue,
  SkillCategory,
  ExecutionType,
  SkillStatus,
} from '../types/skill.ts';

export const VALID_CATEGORIES: SkillCategory[] = [
  'Search',
  'Data',
  'Files',
  'Communication',
  'Developer Tools',
  'Vision',
  'RAG',
  'Productivity',
];

export const VALID_EXECUTION_TYPES: ExecutionType[] = [
  'API call',
  'Python function',
  'Tool integration',
  'Prompt template',
  'External service',
];

export const VALID_STATUSES: SkillStatus[] = ['draft', 'active', 'deprecated'];

/**
 * Validates a skill schema and metadata according to production specifications.
 */
export function validateSkill(skill: Partial<Skill>): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Name validation
  if (!skill.name || skill.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Skill name is required.' });
  } else if (skill.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Skill name must be at least 3 characters.' });
  }

  // Description validation
  if (!skill.description || skill.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required so agents know when to invoke this skill.' });
  } else if (skill.description.trim().length < 10) {
    warnings.push({
      field: 'description',
      message: 'A detailed description (at least 15 words) improves agent calling accuracy.',
    });
  }

  // Category validation
  if (!skill.category) {
    errors.push({ field: 'category', message: 'Category is required.' });
  } else if (!VALID_CATEGORIES.includes(skill.category as SkillCategory)) {
    errors.push({
      field: 'category',
      message: `Invalid category "${skill.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  // Version validation (semver-like)
  if (!skill.version || skill.version.trim().length === 0) {
    errors.push({ field: 'version', message: 'Version is required (e.g. 1.0.0).' });
  } else if (!/^\d+(\.\d+)*(-[a-zA-Z0-9.]+)?$/.test(skill.version.trim())) {
    warnings.push({ field: 'version', message: 'Version should follow semantic versioning (e.g., 1.0.0).' });
  }

  // Execution type validation
  if (!skill.executionType) {
    errors.push({ field: 'executionType', message: 'Execution type is required.' });
  } else if (!VALID_EXECUTION_TYPES.includes(skill.executionType as ExecutionType)) {
    errors.push({ field: 'executionType', message: 'Invalid execution type.' });
  }

  // Status validation
  if (skill.status && !VALID_STATUSES.includes(skill.status)) {
    errors.push({ field: 'status', message: 'Status must be draft, active, or deprecated.' });
  }

  // Author validation
  if (!skill.author || skill.author.trim().length === 0) {
    errors.push({ field: 'author', message: 'Author or source is required.' });
  }

  // Input Schema validation
  if (!Array.isArray(skill.inputSchema)) {
    errors.push({ field: 'inputSchema', message: 'Input schema must be an array of parameter definitions.' });
  } else {
    const paramNames = new Set<string>();
    skill.inputSchema.forEach((param, index) => {
      const path = `inputSchema[${index}]`;
      if (!param.name || param.name.trim().length === 0) {
        errors.push({ field: `${path}.name`, message: 'Parameter name is required.' });
      } else {
        const cleanName = param.name.trim();
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanName)) {
          errors.push({
            field: `${path}.name`,
            message: `Parameter "${cleanName}" must be a valid identifier (alphanumeric and underscores, not starting with digit).`,
          });
        }
        if (paramNames.has(cleanName)) {
          errors.push({ field: `${path}.name`, message: `Duplicate parameter name "${cleanName}".` });
        }
        paramNames.add(cleanName);
      }

      if (!param.type) {
        errors.push({ field: `${path}.type`, message: 'Parameter type is required.' });
      }

      if (!param.description || param.description.trim().length === 0) {
        warnings.push({
          field: `${path}.description`,
          message: `Parameter "${param.name || index}" lacks a description for LLM grounding.`,
        });
      }
    });
  }

  // Output Schema validation
  if (!skill.outputSchema) {
    warnings.push({ field: 'outputSchema', message: 'Output schema is recommended for predictable parsing.' });
  }

  // Config validation
  if (skill.config) {
    if (skill.config.timeoutMs !== undefined && (skill.config.timeoutMs <= 0 || skill.config.timeoutMs > 300000)) {
      errors.push({ field: 'config.timeoutMs', message: 'Timeout must be between 1 and 300,000 milliseconds.' });
    }
    if (skill.config.retryPolicy) {
      if (skill.config.retryPolicy.maxRetries < 0 || skill.config.retryPolicy.maxRetries > 10) {
        errors.push({ field: 'config.retryPolicy.maxRetries', message: 'Max retries must be between 0 and 10.' });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Converts parameter definitions to standard JSON Schema properties.
 */
function buildJsonSchemaProperties(parameters: ParameterDefinition[]) {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const param of parameters) {
    const prop: Record<string, any> = {
      type: param.type,
      description: param.description,
    };

    if (param.exampleValue !== undefined && param.exampleValue !== '') {
      prop.example = param.exampleValue;
    }
    if (param.defaultValue !== undefined && param.defaultValue !== '') {
      prop.default = param.defaultValue;
    }
    if (param.enumOptions && param.enumOptions.length > 0) {
      prop.enum = param.enumOptions;
    }
    if (param.type === 'array') {
      prop.items = { type: 'string' };
    }

    properties[param.name] = prop;
    if (param.required) {
      required.push(param.name);
    }
  }

  return { properties, required };
}

/**
 * Generates an agent-ready tool/function declaration in standard formats.
 */
export function generateToolSchema(
  skill: Skill,
  format: 'openai' | 'anthropic' | 'gemini' | 'mcp' | 'langchain' = 'openai'
): Record<string, any> {
  const cleanName = skill.name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const { properties, required } = buildJsonSchemaProperties(skill.inputSchema || []);

  switch (format) {
    case 'openai':
      return {
        type: 'function',
        function: {
          name: cleanName,
          description: skill.description,
          parameters: {
            type: 'object',
            properties,
            required,
            additionalProperties: false,
          },
        },
      };

    case 'anthropic':
      return {
        name: cleanName,
        description: skill.description,
        input_schema: {
          type: 'object',
          properties,
          required,
        },
      };

    case 'gemini':
      return {
        name: cleanName,
        description: skill.description,
        parameters: {
          type: 'OBJECT',
          properties: Object.fromEntries(
            Object.entries(properties).map(([k, v]) => [
              k,
              {
                type: String(v.type).toUpperCase(),
                description: v.description,
                ...(v.enum ? { enum: v.enum } : {}),
              },
            ])
          ),
          required,
        },
      };

    case 'mcp':
      return {
        name: cleanName,
        description: skill.description,
        inputSchema: {
          type: 'object',
          properties,
          required,
        },
      };

    case 'langchain':
      return {
        name: cleanName,
        description: skill.description,
        args_schema: {
          title: `${skill.name.replace(/\s+/g, '')}Input`,
          type: 'object',
          properties,
          required,
        },
        return_direct: false,
      };

    default:
      return {};
  }
}

/**
 * Generates natural-language agent instructions on when and how to call the skill.
 */
export function generateAgentInstruction(skill: Skill): string {
  const requiredParams = (skill.inputSchema || []).filter((p) => p.required).map((p) => `\`${p.name}\``);
  const optionalParams = (skill.inputSchema || []).filter((p) => !p.required).map((p) => `\`${p.name}\``);

  let instruction = `## Skill: ${skill.name} (v${skill.version})\n`;
  instruction += `**Category**: ${skill.category} | **Execution**: ${skill.executionType}\n\n`;
  instruction += `### When to use:\n${skill.description}\n\n`;

  if (requiredParams.length > 0) {
    instruction += `### Required Arguments:\n- ${requiredParams.join(', ')}\n\n`;
  }
  if (optionalParams.length > 0) {
    instruction += `### Optional Arguments:\n- ${optionalParams.join(', ')}\n\n`;
  }

  if (skill.outputSchema) {
    instruction += `### Expected Output:\n${skill.outputSchema.description || 'Structured response'}\n`;
    if (skill.outputSchema.exampleResponse) {
      instruction += `\`\`\`json\n${
        typeof skill.outputSchema.exampleResponse === 'string'
          ? skill.outputSchema.exampleResponse
          : JSON.stringify(skill.outputSchema.exampleResponse, null, 2)
      }\n\`\`\`\n`;
    }
  }

  return instruction.trim();
}

/**
 * Exports multiple skills into a complete agent configuration package.
 */
export function generateAgentBundle(skills: Skill[], format: 'openai' | 'anthropic' | 'gemini' | 'mcp' = 'openai') {
  return {
    registryVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    format,
    totalSkills: skills.length,
    tools: skills.map((s) => generateToolSchema(s, format)),
    systemInstructions: skills.map((s) => generateAgentInstruction(s)).join('\n\n---\n\n'),
    manifest: skills.map((s) => ({
      id: s.id,
      name: s.name,
      version: s.version,
      category: s.category,
      executionType: s.executionType,
      config: {
        timeoutMs: s.config?.timeoutMs,
        retryPolicy: s.config?.retryPolicy,
        apiKeyRequired: Boolean(s.config?.apiKeyName),
      },
    })),
  };
}

/**
 * Parses JSON or YAML input into a skill object with error handling.
 */
export function parseSkillDefinition(content: string, format: 'json' | 'yaml' = 'json'): { skill?: Partial<Skill>; error?: string } {
  try {
    let parsed: any;
    if (format === 'yaml') {
      parsed = YAML.parse(content);
    } else {
      parsed = JSON.parse(content);
    }

    if (!parsed || typeof parsed !== 'object') {
      return { error: 'Payload must be a valid JSON/YAML object.' };
    }

    return { skill: parsed };
  } catch (err: any) {
    return { error: err.message || 'Syntax error while parsing content.' };
  }
}

/**
 * Serializes a skill into JSON or YAML.
 */
export function serializeSkill(skill: Skill, format: 'json' | 'yaml' = 'json'): string {
  if (format === 'yaml') {
    return YAML.stringify(skill);
  }
  return JSON.stringify(skill, null, 2);
}

/**
 * Generates realistic mock input arguments matching the skill parameter schema.
 */
export function generateMockInputs(skill: Skill): Record<string, any> {
  const inputs: Record<string, any> = {};
  if (!skill.inputSchema || !Array.isArray(skill.inputSchema)) {
    return inputs;
  }

  for (const param of skill.inputSchema) {
    if (param.exampleValue !== undefined && param.exampleValue !== '') {
      inputs[param.name] = param.exampleValue;
      continue;
    }
    if (param.defaultValue !== undefined && param.defaultValue !== '') {
      inputs[param.name] = param.defaultValue;
      continue;
    }
    if (param.enumOptions && param.enumOptions.length > 0) {
      inputs[param.name] = param.enumOptions[0];
      continue;
    }

    const lowerName = param.name.toLowerCase();
    const lowerDesc = (param.description || '').toLowerCase();

    switch (param.type) {
      case 'number':
        inputs[param.name] = lowerName.includes('count') || lowerName.includes('limit') ? 10 : 42;
        break;
      case 'boolean':
        inputs[param.name] = true;
        break;
      case 'array':
        inputs[param.name] = ['sample_item_1', 'sample_item_2'];
        break;
      case 'object':
        inputs[param.name] = { mode: 'standard', dryRun: false };
        break;
      case 'string':
      default:
        if (lowerName.includes('url') || lowerDesc.includes('url')) {
          inputs[param.name] = 'https://api.example.com/v1/resource';
        } else if (lowerName.includes('email') || lowerDesc.includes('email')) {
          inputs[param.name] = 'operator@agent-registry.internal';
        } else if (lowerName.includes('query') || lowerDesc.includes('search') || lowerDesc.includes('query')) {
          inputs[param.name] = 'autonomous agent tool execution';
        } else if (lowerName.includes('code') || lowerDesc.includes('script')) {
          inputs[param.name] = 'console.log("Simulated code execution");';
        } else if (lowerName.includes('sql')) {
          inputs[param.name] = 'SELECT * FROM records LIMIT 5;';
        } else if (lowerName.includes('id')) {
          inputs[param.name] = 'mock_id_101';
        } else {
          inputs[param.name] = `mock_${param.name}`;
        }
        break;
    }
  }

  return inputs;
}

export interface SimulatedToolExecutionResult {
  status: 'success' | 'error';
  statusCode: number;
  skillId: string;
  skillName: string;
  category: string;
  executionType: string;
  durationMs: number;
  timestamp: string;
  mockInputs: Record<string, any>;
  response: any;
  meta: {
    mockEngine: string;
    protocol: string;
    schemaValidated: boolean;
  };
}

/**
 * Simulates a realistic tool call execution using provided or generated mock inputs.
 */
export function simulateToolExecution(
  skill: Skill,
  inputs?: Record<string, any>
): SimulatedToolExecutionResult {
  const resolvedInputs = inputs || generateMockInputs(skill);
  const duration = Math.floor(Math.random() * 150) + 65;

  let responsePayload = skill.outputSchema?.exampleResponse;

  if (!responsePayload) {
    responsePayload = {
      message: `Simulated execution of "${skill.name}" completed successfully.`,
      skill: skill.name,
      category: skill.category,
      executionType: skill.executionType,
      appliedInputs: resolvedInputs,
      outputSummary: skill.outputSchema?.description || 'Execution completed without errors.',
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    status: 'success',
    statusCode: 200,
    skillId: skill.id,
    skillName: skill.name,
    category: skill.category,
    executionType: skill.executionType,
    durationMs: duration,
    timestamp: new Date().toISOString(),
    mockInputs: resolvedInputs,
    response: responsePayload,
    meta: {
      mockEngine: 'AgentRegistry-Simulator-v1',
      protocol: skill.executionType === 'API call' ? 'REST/HTTPS' : 'IPC/In-Process',
      schemaValidated: true,
    },
  };
}

