export type SkillCategory =
  | 'Search'
  | 'Data'
  | 'Files'
  | 'Communication'
  | 'Developer Tools'
  | 'Vision'
  | 'RAG'
  | 'Productivity';

export type ExecutionType =
  | 'API call'
  | 'Python function'
  | 'Tool integration'
  | 'Prompt template'
  | 'External service';

export type SkillStatus = 'draft' | 'active' | 'deprecated';

export type ParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  required: boolean;
  description: string;
  exampleValue?: string | number | boolean | object | any[];
  defaultValue?: string | number | boolean;
  enumOptions?: string[];
}

export interface OutputProperty {
  name: string;
  type: ParameterType;
  description: string;
  exampleValue?: any;
}

export interface OutputSchema {
  type: 'object' | 'string' | 'array' | 'number' | 'boolean';
  description: string;
  properties?: OutputProperty[];
  exampleResponse?: string | object;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

export interface SkillConfig {
  apiKeyName?: string;
  endpointUrl?: string;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  customHeaders?: Record<string, string>;
  environmentVariables?: string[];
  executionTarget?: string; // e.g. python module or handler name
}

export type MarketplaceSource =
  | 'GitHub'
  | 'Hugging Face'
  | 'LangChain'
  | 'LlamaIndex'
  | 'OpenAI'
  | 'Anthropic'
  | 'Google Cloud'
  | 'MCP';

export interface SkillVersionSnapshot {
  versionId: string;
  version: string;
  timestamp: string;
  author: string;
  changeSummary: string;
  skillState: {
    name: string;
    description: string;
    category: SkillCategory;
    version: string;
    executionType: ExecutionType;
    status: SkillStatus;
    inputSchema: ParameterDefinition[];
    outputSchema: OutputSchema;
    config: SkillConfig;
    tags: string[];
    dependencies?: string[];
    explanation?: string;
  };
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  author: string;
  source?: MarketplaceSource | string;
  inputSchema: ParameterDefinition[];
  outputSchema: OutputSchema;
  executionType: ExecutionType;
  config: SkillConfig;
  tags: string[];
  dependencies?: string[];
  status: SkillStatus;
  createdAt: string;
  updatedAt: string;
  isExample?: boolean;
  docUrl?: string;
  license?: string;
  stars?: number;
  requiredCredentials?: string[];
  explanation?: string;
  versionHistory?: SkillVersionSnapshot[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Developer' | 'Admin' | 'AI Engineer';
  avatarUrl?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
