import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Check,
  Copy,
  Layers,
  Wand2,
} from 'lucide-react';
import { useToast } from './Toast.tsx';

export function DocumentationView() {
  const { showToast } = useToast();
  const [activeSnippet, setActiveSnippet] = useState<'openai' | 'anthropic' | 'gemini' | 'mcp'>('openai');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(label);
    showToast(`Copied ${label}`, 'Code snippet copied to clipboard.');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const snippets = {
    openai: `# Python: Connecting Registry Skills to OpenAI / GPT-4o
from openai import OpenAI
import json

client = OpenAI()

# 1. Paste the exported tool schema from your skill registry
tools = [
  {
    "type": "function",
    "function": {
      "name": "web_search",
      "description": "Searches the live web to find recent articles, documentation, or facts.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "The search query" }
        },
        "required": ["query"]
      }
    }
  }
]

# 2. Invoke the agent model
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are an autonomous research agent."},
        {"role": "user", "content": "What were the major AI breakthroughs this week?"}
    ],
    tools=tools,
    tool_choice="auto"
)

# 3. Check if agent decided to call the skill
tool_call = response.choices[0].message.tool_calls[0]
print(f"Agent called: {tool_call.function.name} with args: {tool_call.function.arguments}")`,

    anthropic: `# Python: Connecting Registry Skills to Anthropic Claude 3.5 Sonnet
import anthropic

client = anthropic.Anthropic()

# 1. Paste the Anthropic tool schema from your skill registry
tools = [
  {
    "name": "query_sql_database",
    "description": "Safely executes read-only SQL queries against database with schema introspection.",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "SQL SELECT statement" }
      },
      "required": ["query"]
    }
  }
]

# 2. Invoke Claude
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "How many users signed up in the last 7 days?"}]
)

for block in response.content:
    if block.type == "tool_use":
        print(f"Claude invoking: {block.name} with input: {block.input}")`,

    gemini: `// TypeScript: Connecting Registry Skills to Google Gemini 2.5 Flash
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

// 1. Tool Declaration from Registry
const functionDeclarations = [
  {
    name: 'read_pdf',
    description: 'Parses text, tables, and structured sections from local or remote PDF documents.',
    parameters: {
      type: 'OBJECT',
      properties: {
        file_path_or_url: { type: 'STRING', description: 'URL or path to PDF' }
      },
      required: ['file_path_or_url']
    }
  }
];

// 2. Generate Content with function declarations
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Summarize the financial conclusions on page 1 of https://arxiv.org/pdf/2301.00001.pdf',
  config: {
    tools: [{ functionDeclarations }]
  }
});

const call = response.functionCalls?.[0];
if (call) {
  console.log('Gemini invoked skill:', call.name, call.args);
}`,

    mcp: `// Model Context Protocol (MCP) Server Tool Registration
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "custom-agent-skill-registry",
  version: "1.0.0"
});

// Provide skills to MCP Clients (Claude Desktop, Cursor, Zed)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "http_api_caller",
        description: "Sends custom HTTP requests with configurable headers and body.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"] }
          },
          required: ["url", "method"]
        }
      }
    ]
  };
});`,
  };

  return (
    <div className="space-y-8 max-w-4xl text-xs">
      <div>
        <h2 className="text-xl font-bold text-[#1F1E1B] dark:text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#C15F3C] dark:text-cyan-400" />
          <span>Agent Skill Registry Documentation</span>
        </h2>
        <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1">
          A guide on crafting reusable agent capabilities, schema validation, and connecting skills to autonomous LLM frameworks.
        </p>
      </div>

      {/* Guide Card 1 */}
      <div className="rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] p-6 space-y-3 claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <h3 className="font-bold text-[#1F1E1B] dark:text-slate-100 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#C15F3C] dark:text-cyan-400" />
          <span>1. What is an AI Agent Skill?</span>
        </h3>
        <p className="text-[#645F57] dark:text-slate-300 leading-relaxed">
          An <strong className="text-[#1F1E1B] dark:text-white">AI Agent Skill</strong> is a deterministic, modular capability an autonomous model can call to interact with external environments. Unlike static prompt templates, a skill combines:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[#645F57] dark:text-slate-400">
          <li><strong className="text-[#1F1E1B] dark:text-slate-200">Semantic Intent:</strong> When the agent should choose this tool over other tools.</li>
          <li><strong className="text-[#1F1E1B] dark:text-slate-200">Strict Schema:</strong> Explicit argument names, types, descriptions, and required constraints.</li>
          <li><strong className="text-[#1F1E1B] dark:text-slate-200">Execution Guarantees:</strong> Configurable timeouts, retry policies with backoff, and environment credentials.</li>
        </ul>
      </div>

      {/* Guide Card 2 */}
      <div className="rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] p-6 space-y-3 claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <h3 className="font-bold text-[#1F1E1B] dark:text-slate-100 text-sm flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>2. Adding a New Skill: Step-by-Step</span>
        </h3>
        <ol className="list-decimal pl-5 space-y-2 text-[#645F57] dark:text-slate-300">
          <li>
            <strong className="text-[#1F1E1B] dark:text-white">Name & Category:</strong> Choose a clear name (e.g. "Query SQL Database") and select from the 8 official domains (Search, Data, Files, Communication, Developer Tools, Vision, RAG, Productivity).
          </li>
          <li>
            <strong className="text-[#1F1E1B] dark:text-white">Author & Versioning:</strong> Follow semantic versioning (<code className="text-[#C15F3C] dark:text-cyan-300 font-mono">1.0.0</code>) so downstream agent teams can track contract upgrades.
          </li>
          <li>
            <strong className="text-[#1F1E1B] dark:text-white">Input Schema Parameters:</strong> Add each argument name as a valid identifier (<code className="text-[#C15F3C] dark:text-cyan-300 font-mono">^[a-zA-Z_][a-zA-Z0-9_]*$</code>). Always include a descriptive explanation so the LLM knows what to pass.
          </li>
          <li>
            <strong className="text-[#1F1E1B] dark:text-white">Execution Bounds:</strong> Define a realistic timeout (e.g. 8000ms) and retry policy to protect against hanging remote APIs.
          </li>
          <li>
            <strong className="text-[#1F1E1B] dark:text-white">Live Testing:</strong> Use the built-in <span className="text-[#C15F3C] dark:text-cyan-300 font-semibold">Call Simulator</span> tab to verify parameters and mock responses before deploying.
          </li>
        </ol>
      </div>

      {/* Guide Card 3: Code Integration Snippets */}
      <div className="rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] p-6 space-y-4 claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-[#1F1E1B] dark:text-slate-100 text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#C15F3C] dark:text-cyan-400" />
            <span>3. Connecting Registry Skills to LLM Agents</span>
          </h3>

          <div className="flex rounded-xl bg-[#F8F5EF] dark:bg-[#070A13] p-0.5 border border-[#E5DFD5] dark:border-slate-800 text-xs font-semibold">
            {(['openai', 'anthropic', 'gemini', 'mcp'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setActiveSnippet(key)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[10px] transition-all ${
                  activeSnippet === key
                    ? 'bg-[#C15F3C] text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 dark:text-white shadow-sm'
                    : 'text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[#645F57] dark:text-slate-400 leading-relaxed">
          Copy schemas directly from the <span className="text-[#C15F3C] dark:text-cyan-300 font-medium">My Registry</span> card or use the <span className="text-[#C15F3C] dark:text-cyan-300 font-medium">Export Agent Config</span> tool to generate full multi-tool packages.
        </p>

        <div className="relative rounded-2xl border border-[#E5DFD5] dark:border-slate-800 bg-[#F8F5EF] dark:bg-[#070A13] p-4 font-mono text-xs text-[#1F1E1B] dark:text-indigo-200 overflow-x-auto">
          <button
            onClick={() => handleCopy(snippets[activeSnippet], activeSnippet.toUpperCase())}
            className="absolute top-3 right-3 p-1.5 rounded-lg border border-[#E5DFD5] dark:border-slate-700 bg-[#FFFFFF] dark:bg-slate-800 hover:bg-[#EFEAE2] dark:hover:bg-slate-700 text-[#3D3B39] dark:text-slate-300 hover:text-[#1F1E1B] dark:hover:text-white transition-colors shadow-sm"
            title="Copy snippet"
          >
            {copiedKey === activeSnippet.toUpperCase() ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <pre>{snippets[activeSnippet]}</pre>
        </div>
      </div>
    </div>
  );
}
