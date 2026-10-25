# AI Agent Skill Registry & Dependency Orchestrator

A centralized, developer-first registry and orchestration studio to define, curate, test, visualize, and export production-ready modular AI agent skills and tool calling schemas.

---

## 🚀 Overview

Modern autonomous AI agents (built with OpenAI Assistants, Anthropic Claude Tool Use, Google Gemini Function Calling, LangChain, or the Model Context Protocol [MCP]) require strictly typed, schema-validated, and dependency-aware tool definitions. 

**AI Agent Skill Registry** provides:
- **Centralized Skill Management**: Full CRUD, parameter schemas, input/output contracts, error retry policies, and execution timeouts.
- **Agent Studio & Interactive D3 Graph**: Force-directed visualization of skill dependency graphs, topological execution pipelines, shared tool definitions, and **strict circular dependency prevention** with visual red hazard warnings.
- **Quick Test & Execution Simulator**: One-click simulated tool calls with automatically synthesized mock arguments and formatted JSON response inspection directly within the modal.
- **Universal Multi-Platform Export**: One-click generation of ready-to-use function calling specifications for **OpenAI**, **Anthropic**, **Google Gemini**, **Model Context Protocol (MCP)**, and **LangChain**.
- **Immutable Version History**: Full snapshot tracking and one-click rollback across parameter modifications.
- **Multi-Tenant Workspace**: Offline persistence (`localStorage`) separated by user profiles with zero server latency.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | **React 19** (`react`, `react-dom`) | Single Page Application (SPA) architecture |
| **Language & Typings** | **TypeScript 5.8+** | Strict mode, standard enums, comprehensive type definitions |
| **Bundler & Dev Server** | **Vite 6+** (`@vitejs/plugin-react`) | Port 3000, hot reload, fast production minification |
| **Styling & Design System** | **Tailwind CSS v4** (`@tailwindcss/vite`) | High-contrast light/dark theme, zero-pill metadata discipline |
| **Graph Visualizer** | **D3.js v7** (`d3`, `@types/d3`) | Force-directed simulation, interactive zoom/pan, directed arrows |
| **Icons & Micro-animations** | **Lucide React** (`lucide-react`) & **Motion** | Lightweight SVG iconography and animated transitions |
| **Serialization & Parsing** | **YAML v2** (`yaml`) | Bi-directional JSON and YAML specification parsing |
| **Test Runner** | **Node.js Test Runner** (`node:test`, `node:assert`) | Zero-dependency native unit test suite (21 passing tests) |
| **Persistence** | **LocalStorage Service** | Browser-backed persistent storage per user profile |

> **Note on Architecture (React vs. Next.js / Backend)**:  
> This project is architected as a high-performance **React SPA powered by Vite**. It runs completely client-side with offline persistence, eliminating database bottlenecks. For environments requiring a Node/Express backend or API proxy routes, the codebase includes `@types/express` and `tsx` support.

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **Package Manager**: `npm` (bundled with Node.js), `bun`, or `pnpm`

### Installation

1. **Clone the repository** (or open the project directory):
   ```bash
   git clone <repository-url>
   cd ai-agent-skill-registry
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

> **Zero-Configuration Setup**:  
> All necessary environment settings (`HOST=0.0.0.0`, `PORT=3000`, `VITE_APP_TITLE="AI Agent Skill Registry"`) are already fully configured in `.env` and `vite.config.ts`. You do not need to create or configure any variables manually.

---

## 📜 Startup Scripts

The following scripts are defined in `package.json`:

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server on `http://localhost:3000` with host `0.0.0.0` |
| `npm run build` | Compiles TypeScript and builds production assets into `/dist` |
| `npm run preview` | Serves the production build locally for verification |
| `npm test` | Runs the 21 native unit tests in `src/utils/*.test.ts` |
| `npm run lint` | Runs TypeScript compiler checks without emitting files (`tsc --noEmit`) |
| `npm run clean` | Cleans up the `dist` directory |

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

### Running Unit Tests
```bash
npm test
```
Runs tests covering:
- Cycle detection & Tarjan-style DFS loop validation
- Kahn's topological sort for sequential agent execution
- OpenAI, Anthropic, Gemini, MCP, and LangChain schema generation
- Parameter validation and mock input generation
- Version snapshot creation and rollback

---

## 📂 Project Structure

```text
├── index.html                   # HTML entry point with meta tags & typography links
├── package.json                 # Project dependencies, scripts, and engine specs
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS & React plugins
├── .env.example                 # Example environment variables
├── metadata.json                # AI Studio application metadata
└── src/
    ├── main.tsx                 # Application mounting and error boundary
    ├── App.tsx                  # Primary layout, routing tabs, and global state
    ├── index.css                # Global Tailwind CSS imports and utility styles
    ├── components/              # Modular UI Components
    │   ├── Navbar.tsx           # Sticky header with search, theme switch, user switcher
    │   ├── Sidebar.tsx          # Navigation tabs & starter skill restoration trigger
    │   ├── SkillCard.tsx        # Grid card with clean typography and action triggers
    │   ├── SkillTable.tsx       # Dense tabular view with multi-select and sorting
    │   ├── SkillDetailModal.tsx # Full inspector with 'Quick Test', JSON viewer, & schemas
    │   ├── SkillEditorModal.tsx # Dual visual/code schema editor with real-time linting
    │   ├── AgentDependencyGraph.tsx # D3.js force-directed dependency graph & loop detector
    │   ├── AgentExportModal.tsx # Multi-skill agent bundle generator (OpenAI/Anthropic/MCP)
    │   ├── CategoriesView.tsx   # Breakdown of skills by domain category
    │   ├── DocumentationView.tsx# Agent calling specifications & code snippets
    │   ├── ImportExportView.tsx # Bulk JSON/YAML import, export, and migration
    │   ├── SettingsView.tsx     # User profile creation, active account switcher, data wipe
    │   ├── VersionHistoryTimeline.tsx # Visual snapshot diffs and rollback engine
    │   ├── Toast.tsx            # Global notification system
    │   └── ErrorBoundary.tsx    # Crash protection and fallback UI
    ├── data/
    │   ├── starterSkills.ts     # 12 production-grade starter skills with schemas
    │   └── marketplaceSkills.ts # Curated ecosystem skills (LangChain, HuggingFace, etc.)
    ├── services/
    │   └── storageService.ts    # LocalStorage persistence, profile partitioning, and migrations
    ├── types/
    │   └── skill.ts             # Domain interfaces (Skill, Parameter, User, VersionSnapshot)
    └── utils/
        ├── graphAnalysis.ts     # Graph algorithms (Cycle detection, Kahn's topological sort)
        ├── graphAnalysis.test.ts# Unit tests for graph logic
        ├── validation.ts        # Schema validation, mock generator, tool simulation
        ├── validation.test.ts   # Unit tests for validation & simulation
        ├── versionHistory.ts    # Snapshot generation & field-level diff detection
        ├── versionHistory.test.ts # Unit tests for version history
        └── uiHelpers.ts         # Visual badges, styling maps, and formatting helpers
```

---

## 🔑 Key Features & Usage

### 1. Agent Studio & Dependency Orchestrator
- **Interactive Force Simulation**: Visualizes skill prerequisites as directional arrows, highlighting dependent tools and root dependencies.
- **Circular Dependency Guard**: Analyzes graph modifications in real time. If a user attempts to create a recursive loop (e.g. `Skill A → Skill B → Skill A`), the system:
  - Renders the prerequisite button with a prominent **red `LOOP HAZARD` indicator**.
  - **Blocks the save action** to protect downstream agent runtime stability.
  - Displays the exact circular dependency chain in a red alert banner.
- **Topological Execution Order**: Calculates the mathematical sequential execution DAG order for multi-skill agent workflows.

### 2. Quick Test & Direct JSON Response Viewer
- Click **Quick Test** in any skill view or inside the `SkillDetailModal`.
- The engine automatically resolves parameter types, enums, and defaults into a realistic mock argument payload.
- Simulates the execution latency (70–200ms) and displays the resulting **JSON payload directly within the modal**.
- Inspect **Response JSON**, **Mock Inputs**, or the **Full Payload** with one-click clipboard copying.

### 3. Multi-Platform Schema Generation
Export tool call schemas in standard formats:
- **OpenAI**: Function calling definitions (`type: "function"` with JSON Schema properties).
- **Anthropic Claude**: `input_schema` compatible with Claude 3.5 Sonnet / Opus.
- **Google Gemini**: `functionDeclarations` ready for `@google/genai` or Vertex AI.
- **Model Context Protocol (MCP)**: Tool schema conforming to the Anthropic MCP specification.
- **LangChain**: Structured tool format with `args_schema`.

---

## 🧪 Testing & Verification

Run the complete test suite:
```bash
npm test
```

Run TypeScript compilation check:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

---

## 📄 License

MIT License. Designed and built for autonomous agent developers and tool authors.
