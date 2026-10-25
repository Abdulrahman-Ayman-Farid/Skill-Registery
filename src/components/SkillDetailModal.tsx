import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Edit2,
  Trash2,
  CopyPlus,
  Archive,
  Download,
  Terminal,
  Play,
  CheckCircle2,
  Code2,
  Sparkles,
  ExternalLink,
  Layers,
  History,
  FileCode,
  RotateCcw,
} from 'lucide-react';
import { Skill } from '../types/skill.ts';
import {
  getCategoryBadgeClass,
  getExecutionTypeBadgeClass,
  getStatusBadgeClass,
} from '../utils/uiHelpers.ts';
import {
  generateToolSchema,
  generateAgentInstruction,
  serializeSkill,
  generateMockInputs,
  simulateToolExecution,
  SimulatedToolExecutionResult,
} from '../utils/validation.ts';
import { useToast } from './Toast.tsx';
import { VersionHistoryTimeline } from './VersionHistoryTimeline.tsx';

interface SkillDetailModalProps {
  skill: Skill | null;
  onClose: () => void;
  onEdit: (skill: Skill) => void;
  onDuplicate: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onRevertVersion?: (skillId: string, versionId: string) => void;
}

type DetailTab = 'overview' | 'schemas' | 'agent' | 'playground' | 'history' | 'raw';

export function SkillDetailModal(props: SkillDetailModalProps) {
  if (!props.skill) return null;
  return <SkillDetailModalInner {...props} skill={props.skill} />;
}

function SkillDetailModalInner({
  skill,
  onClose,
  onEdit,
  onDuplicate,
  onToggleArchive,
  onDelete,
  onRevertVersion,
}: Omit<SkillDetailModalProps, 'skill'> & { skill: Skill }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<DetailTab>('agent');
  const [agentFormat, setAgentFormat] = useState<'openai' | 'anthropic' | 'gemini' | 'mcp' | 'langchain'>('openai');
  const [rawFormat, setRawFormat] = useState<'json' | 'yaml'>('json');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Playground state
  const [playgroundInputs, setPlaygroundInputs] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    skill.inputSchema?.forEach((p) => {
      initial[p.name] = p.exampleValue !== undefined ? p.exampleValue : p.defaultValue !== undefined ? p.defaultValue : '';
    });
    return initial;
  });
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Quick Test State
  const [isQuickTesting, setIsQuickTesting] = useState(false);
  const [quickTestResult, setQuickTestResult] = useState<SimulatedToolExecutionResult | null>(null);
  const [showQuickTestPanel, setShowQuickTestPanel] = useState(false);
  const [quickTestView, setQuickTestView] = useState<'response' | 'inputs' | 'full'>('response');
  const [copiedQuickTest, setCopiedQuickTest] = useState(false);

  const handleQuickTest = () => {
    setIsQuickTesting(true);
    setShowQuickTestPanel(true);
    setQuickTestResult(null);

    // Resolve realistic mock inputs from skill input schema
    const mockInputs = generateMockInputs(skill);
    setPlaygroundInputs(mockInputs);

    // Simulate async tool execution
    setTimeout(() => {
      const result = simulateToolExecution(skill, mockInputs);
      setQuickTestResult(result);
      setSimResult({
        status: 'success',
        executionDurationMs: result.durationMs,
        skillId: skill.id,
        argumentsReceived: result.mockInputs,
        output: result.response,
      });
      setIsQuickTesting(false);
      showToast(
        'Quick Test Succeeded',
        `Simulated tool call for "${skill.name}" returned in ${result.durationMs}ms.`
      );
    }, 320);
  };

  const handleCopyQuickTestJson = (content: any, label = 'Response JSON') => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopiedQuickTest(true);
    showToast(`Copied ${label}`, `${label} copied to clipboard.`);
    setTimeout(() => setCopiedQuickTest(false), 2000);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    showToast(`Copied ${label}`, `${label} copied to clipboard.`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadSkill = () => {
    const content = serializeSkill(skill, rawFormat);
    const blob = new Blob([content], { type: rawFormat === 'json' ? 'application/json' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-skill.${rawFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Skill', `Saved as ${a.download}`);
  };

  const runSimulation = () => {
    setIsRunningSim(true);
    setSimResult(null);
    setTimeout(() => {
      setIsRunningSim(false);
      setSimResult({
        status: 'success',
        executionDurationMs: Math.floor(Math.random() * 250) + 80,
        skillId: skill.id,
        argumentsReceived: playgroundInputs,
        output: skill.outputSchema?.exampleResponse || {
          message: `Simulated execution of ${skill.name} completed successfully.`,
          timestamp: new Date().toISOString(),
        },
      });
    }, 600);
  };

  const currentToolSchema = generateToolSchema(skill, agentFormat);
  const agentPromptInstruction = generateAgentInstruction(skill);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#FFFFFF] dark:bg-[#0D1424] border border-[#E5DFD5] dark:border-indigo-500/30 rounded-3xl shadow-2xl dark:shadow-[0_0_35px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-[#1F1E1B] dark:text-slate-100 transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DFD5] dark:border-slate-800/80 bg-[#FAF8F5]/90 dark:bg-slate-900/60 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#645F57] dark:text-slate-400 mb-1 flex-wrap">
              <span className="font-semibold uppercase tracking-wider text-[#1F1E1B] dark:text-cyan-300">
                {skill.category}
              </span>
              <span className="text-[#918B80] dark:text-slate-600">•</span>
              <span className="font-mono text-[11px] text-[#645F57] dark:text-slate-400">
                {skill.executionType}
              </span>
              <span className="text-[#918B80] dark:text-slate-600">•</span>
              <span className="flex items-center gap-1 text-[11px]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    skill.status === 'active'
                      ? 'bg-emerald-500 dark:bg-emerald-400 dark:shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : skill.status === 'draft'
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : 'bg-stone-400 dark:bg-slate-500'
                  }`}
                />
                <span className="capitalize text-[#1F1E1B] dark:text-slate-300 font-medium">{skill.status}</span>
              </span>
              <span className="text-[#918B80] dark:text-slate-600">•</span>
              <span className="font-mono text-[#645F57] dark:text-slate-400">v{skill.version}</span>
            </div>
            <h2 className="text-xl font-bold text-[#1F1E1B] dark:text-white tracking-tight flex items-center gap-2">
              <span>{skill.name}</span>
              {skill.docUrl && (
                <a
                  href={skill.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#918B80] hover:text-[#C15F3C] dark:text-slate-500 dark:hover:text-cyan-400 transition-colors"
                  title="Official Documentation"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </h2>
            <p className="text-xs text-[#645F57] dark:text-slate-400 mt-0.5">
              By <span className="text-[#1F1E1B] dark:text-slate-300 font-medium">{skill.author}</span>
              {skill.source && <span className="text-[#918B80] dark:text-slate-500"> • {skill.source}</span>}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {/* Quick Test Primary Action Button */}
            <button
              onClick={handleQuickTest}
              disabled={isQuickTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              title="Execute simulated tool call using mock inputs and view JSON response"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isQuickTesting ? 'animate-spin' : ''}`} />
              <span>{isQuickTesting ? 'Testing...' : 'Quick Test'}</span>
            </button>

            <button
              onClick={() => onEdit(skill)}
              className="p-2 rounded-xl bg-[#F8F5EF] dark:bg-slate-800/80 hover:bg-[#EFEAE2] dark:hover:bg-slate-800 text-[#3D3B39] dark:text-slate-300 hover:text-[#1F1E1B] dark:hover:text-white transition-colors border border-[#E5DFD5] dark:border-slate-700/60 shadow-sm"
              title="Edit Skill"
              aria-label="Edit Skill"
            >
              <Edit2 className="w-4 h-4 text-[#C15F3C] dark:text-cyan-400" />
            </button>
            <button
              onClick={() => onDuplicate(skill.id)}
              className="p-2 rounded-xl bg-[#F8F5EF] dark:bg-slate-800/80 hover:bg-[#EFEAE2] dark:hover:bg-slate-800 text-[#3D3B39] dark:text-slate-300 hover:text-[#1F1E1B] dark:hover:text-white transition-colors border border-[#E5DFD5] dark:border-slate-700/60 shadow-sm"
              title="Duplicate Skill"
              aria-label="Duplicate Skill"
            >
              <CopyPlus className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            </button>
            <button
              onClick={() => onToggleArchive(skill.id)}
              className="p-2 rounded-xl bg-[#F8F5EF] dark:bg-slate-800/80 hover:bg-[#EFEAE2] dark:hover:bg-slate-800 text-[#3D3B39] dark:text-slate-300 hover:text-[#1F1E1B] dark:hover:text-white transition-colors border border-[#E5DFD5] dark:border-slate-700/60 shadow-sm"
              title={skill.status === 'deprecated' ? 'Unarchive' : 'Archive'}
              aria-label="Toggle archive"
            >
              <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
            <button
              onClick={() => {
                onDelete(skill.id);
                onClose();
              }}
              className="p-2 rounded-xl bg-[#F8F5EF] dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors border border-[#E5DFD5] dark:border-slate-700/60 shadow-sm"
              title="Delete Skill"
              aria-label="Delete Skill"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#F8F5EF] dark:bg-slate-800/80 hover:bg-[#EFEAE2] dark:hover:bg-slate-800 text-[#918B80] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200 transition-colors ml-2 border border-[#E5DFD5] dark:border-transparent"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#E5DFD5] dark:border-slate-800/80 bg-[#FAF8F5] dark:bg-slate-950 flex gap-6 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('agent')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'agent'
                ? 'border-[#C15F3C] text-[#C15F3C] dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Tool Schemas</span>
          </button>

          <button
            onClick={() => setActiveTab('schemas')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'schemas'
                ? 'border-[#C15F3C] text-[#C15F3C] dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'playground'
                ? 'border-[#C15F3C] text-[#C15F3C] dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#C15F3C] text-[#C15F3C] dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Config</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-[#C15F3C] text-[#C15F3C] dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Version History</span>
            {(skill.versionHistory?.length || 0) > 0 && (
              <span className="text-[11px] font-mono text-[#918B80] dark:text-slate-400">
                ({skill.versionHistory?.length})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'raw'
                ? 'border-[#C15F3C] text-[#C15F3C] dark:border-cyan-400 dark:text-cyan-300'
                : 'border-transparent text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw Spec</span>
          </button>
        </div>

        {/* Quick Test Simulated Tool Execution Panel: Displays JSON response directly within the modal */}
        {showQuickTestPanel && (
          <div className="border-b border-[#E5DFD5] dark:border-slate-800 bg-[#FAF8F5] dark:bg-[#070A13] p-4 sm:p-5 transition-all">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                {isQuickTesting ? (
                  <Play className="w-4 h-4 text-[#C15F3C] dark:text-cyan-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span className="font-bold text-xs text-[#1F1E1B] dark:text-white">
                  {isQuickTesting ? 'Simulating Tool Call...' : 'Quick Test: Simulated Tool Call'}
                </span>

                {quickTestResult && (
                  <>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      {quickTestResult.statusCode} OK
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-[#645F57] dark:text-slate-400">
                      {quickTestResult.durationMs}ms
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {quickTestResult && (
                  <>
                    {/* View Switcher */}
                    <div className="flex rounded-lg bg-[#FFFFFF] dark:bg-slate-900 p-0.5 border border-[#E5DFD5] dark:border-slate-800 text-[11px]">
                      <button
                        onClick={() => setQuickTestView('response')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          quickTestView === 'response'
                            ? 'bg-[#C15F3C] text-white dark:bg-cyan-600 dark:text-white shadow-xs'
                            : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                        }`}
                      >
                        Response JSON
                      </button>
                      <button
                        onClick={() => setQuickTestView('inputs')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          quickTestView === 'inputs'
                            ? 'bg-[#C15F3C] text-white dark:bg-cyan-600 dark:text-white shadow-xs'
                            : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                        }`}
                      >
                        Mock Inputs ({Object.keys(quickTestResult.mockInputs).length})
                      </button>
                      <button
                        onClick={() => setQuickTestView('full')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          quickTestView === 'full'
                            ? 'bg-[#C15F3C] text-white dark:bg-cyan-600 dark:text-white shadow-xs'
                            : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                        }`}
                      >
                        Full Payload
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const payload =
                          quickTestView === 'response'
                            ? quickTestResult.response
                            : quickTestView === 'inputs'
                            ? quickTestResult.mockInputs
                            : quickTestResult;
                        handleCopyQuickTestJson(
                          payload,
                          quickTestView === 'response'
                            ? 'Response JSON'
                            : quickTestView === 'inputs'
                            ? 'Mock Inputs'
                            : 'Full Execution Payload'
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5DFD5] dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-900 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 text-[#3D3B39] dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer shadow-xs"
                      title="Copy JSON payload"
                    >
                      {copiedQuickTest ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleQuickTest}
                      disabled={isQuickTesting}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5DFD5] dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-900 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 text-[#3D3B39] dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer shadow-xs"
                      title="Re-run Quick Test"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Re-run</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowQuickTestPanel(false)}
                  className="p-1 text-[#918B80] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Dismiss Quick Test panel"
                  aria-label="Dismiss Quick Test panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isQuickTesting ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <Play className="w-6 h-6 text-[#C15F3C] dark:text-cyan-400 animate-spin" />
                <p className="text-xs font-semibold text-[#1F1E1B] dark:text-slate-200">
                  Executing simulated tool call with mock inputs...
                </p>
                <p className="text-[11px] text-[#645F57] dark:text-slate-400 font-mono">
                  Synthesizing input arguments & schema validation
                </p>
              </div>
            ) : quickTestResult ? (
              <div className="space-y-2">
                <pre className="p-3.5 rounded-xl bg-[#FFFFFF] dark:bg-slate-950 border border-[#E5DFD5] dark:border-slate-800 font-mono text-xs text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                  {JSON.stringify(
                    quickTestView === 'response'
                      ? quickTestResult.response
                      : quickTestView === 'inputs'
                      ? quickTestResult.mockInputs
                      : quickTestResult,
                    null,
                    2
                  )}
                </pre>

                <div className="flex items-center justify-between text-[10px] text-[#645F57] dark:text-slate-400 pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span>
                      Execution: <strong className="text-[#1F1E1B] dark:text-slate-300">{quickTestResult.executionType}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Protocol: <strong className="text-[#1F1E1B] dark:text-slate-300">{quickTestResult.meta.protocol}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Engine: <strong className="text-[#1F1E1B] dark:text-slate-300">{quickTestResult.meta.mockEngine}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[#918B80] dark:text-slate-500">
                    {quickTestResult.timestamp}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB: AGENT TOOL SCHEMAS */}
          {activeTab === 'agent' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#645F57] dark:text-slate-300 uppercase tracking-wider">Format:</span>
                    <div className="flex rounded-lg bg-[#F8F5EF] dark:bg-slate-900 p-0.5 border border-[#E5DFD5] dark:border-slate-800 text-xs">
                      {(['openai', 'anthropic', 'gemini', 'mcp', 'langchain'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setAgentFormat(fmt)}
                          className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                            agentFormat === fmt
                              ? 'bg-[#C15F3C] text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 dark:text-white shadow-sm'
                              : 'text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          {fmt === 'openai'
                            ? 'OpenAI'
                            : fmt === 'anthropic'
                            ? 'Anthropic'
                            : fmt === 'gemini'
                            ? 'Gemini'
                            : fmt === 'mcp'
                            ? 'MCP'
                            : 'LangChain'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleCopyText(JSON.stringify(currentToolSchema, null, 2), `${agentFormat.toUpperCase()} Schema`)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
                  >
                    {copiedSection === `${agentFormat.toUpperCase()} Schema` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Agent Tool Schema</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-2xl border border-[#E5DFD5] dark:border-slate-800 bg-[#F8F5EF] dark:bg-slate-900/90 p-4 font-mono text-xs overflow-x-auto text-[#1F1E1B] dark:text-cyan-200">
                  <pre>{JSON.stringify(currentToolSchema, null, 2)}</pre>
                </div>
              </div>

              {/* Natural-Language Prompt Instruction */}
              <div className="border-t border-[#EFEAE2] dark:border-slate-800/80 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1F1E1B] dark:text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C15F3C] dark:text-cyan-400" />
                      <span>Agent System Prompt Instruction</span>
                    </h3>
                    <p className="text-xs text-[#645F57] dark:text-slate-400 mt-0.5">
                      Grounds the LLM on exactly when and how to invoke this skill.
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyText(agentPromptInstruction, 'System Instruction')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-slate-800 hover:bg-[#EFEAE2] dark:hover:bg-slate-700 text-[#3D3B39] dark:text-slate-200 text-xs font-semibold border border-[#E5DFD5] dark:border-slate-700/60 transition-all shadow-sm"
                  >
                    {copiedSection === 'System Instruction' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Instruction</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-[#E5DFD5] dark:border-slate-800 bg-[#F8F5EF] dark:bg-slate-900/60 p-4 text-xs font-mono text-[#3D3B39] dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {agentPromptInstruction}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SCHEMAS */}
          {activeTab === 'schemas' && (
            <div className="space-y-6">
              {/* Input Parameters */}
              <div>
                <h3 className="text-sm font-bold text-[#1F1E1B] dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
                  Input Schema ({skill.inputSchema?.length || 0} Parameters)
                </h3>

                {(!skill.inputSchema || skill.inputSchema.length === 0) ? (
                  <p className="text-xs text-[#918B80] dark:text-slate-500 italic">No input parameters required.</p>
                ) : (
                  <div className="space-y-3">
                    {skill.inputSchema.map((param) => (
                      <div
                        key={param.name}
                        className="rounded-xl border border-[#E5DFD5] dark:border-slate-800/80 bg-[#F8F5EF] dark:bg-slate-900/60 p-3.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#C15F3C] dark:text-cyan-300 text-sm">{param.name}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FFFFFF] dark:bg-slate-800 text-[#3D3B39] dark:text-slate-300 border border-[#E5DFD5] dark:border-slate-700/60">
                              {param.type}
                            </span>
                            {param.required ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                                Required
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FFFFFF] dark:bg-slate-800/80 text-[#645F57] dark:text-slate-400 border border-[#E5DFD5] dark:border-transparent">
                                Optional
                              </span>
                            )}
                          </div>

                          {param.defaultValue !== undefined && (
                            <span className="text-[11px] font-mono text-[#645F57] dark:text-slate-400">
                              Default: <span className="text-[#1F1E1B] dark:text-slate-200 font-semibold">{String(param.defaultValue)}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[#645F57] dark:text-slate-300 text-xs">{param.description}</p>

                        {param.exampleValue !== undefined && (
                          <div className="mt-2 text-[11px] font-mono bg-[#FFFFFF] dark:bg-slate-950/80 p-2 rounded-lg border border-[#E5DFD5] dark:border-slate-800 text-[#645F57] dark:text-slate-400">
                            <span className="text-[#918B80] dark:text-slate-500">Example: </span>
                            <span className="text-[#C15F3C] dark:text-cyan-300">
                              {typeof param.exampleValue === 'object'
                                ? JSON.stringify(param.exampleValue)
                                : String(param.exampleValue)}
                            </span>
                          </div>
                        )}

                        {param.enumOptions && param.enumOptions.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-[#918B80] dark:text-slate-500">Allowed values:</span>
                            {param.enumOptions.map((opt) => (
                              <span
                                key={opt}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FFFFFF] dark:bg-slate-800 text-[#3D3B39] dark:text-slate-300 border border-[#E5DFD5] dark:border-transparent"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Output Schema */}
              <div className="border-t border-[#EFEAE2] dark:border-slate-800/80 pt-6">
                <h3 className="text-sm font-bold text-[#1F1E1B] dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
                  Output Schema ({skill.outputSchema?.type || 'object'})
                </h3>
                <div className="rounded-xl border border-[#E5DFD5] dark:border-slate-800/80 bg-[#F8F5EF] dark:bg-slate-900/60 p-4 space-y-3 text-xs">
                  <p className="text-[#645F57] dark:text-slate-300">{skill.outputSchema?.description || 'Structured object'}</p>

                  {skill.outputSchema?.exampleResponse && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#918B80] dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Sample Output Payload:
                      </p>
                      <pre className="p-3 rounded-lg bg-[#FFFFFF] dark:bg-slate-950 border border-[#E5DFD5] dark:border-slate-800 text-[#C15F3C] dark:text-cyan-300 font-mono text-[11px] overflow-x-auto">
                        {typeof skill.outputSchema.exampleResponse === 'string'
                          ? skill.outputSchema.exampleResponse
                          : JSON.stringify(skill.outputSchema.exampleResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PLAYGROUND / SIMULATOR */}
          {activeTab === 'playground' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#1F1E1B] dark:text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#C15F3C] dark:text-cyan-400" />
                  <span>Agent Execution Simulator</span>
                </h3>
                <p className="text-xs text-[#645F57] dark:text-slate-400 mt-0.5">
                  Simulate an agent calling <span className="text-[#C15F3C] dark:text-cyan-300 font-mono">{skill.name}</span> with test arguments.
                </p>
              </div>

              {/* Arguments Form */}
              <div className="space-y-3">
                {skill.inputSchema?.map((p) => (
                  <div key={p.name} className="space-y-1">
                    <label className="text-xs font-medium text-[#3D3B39] dark:text-slate-300 flex items-center gap-1.5">
                      <span className="font-mono text-[#C15F3C] dark:text-cyan-300">{p.name}</span>
                      <span className="text-[10px] text-[#918B80] dark:text-slate-500 font-mono">({p.type})</span>
                      {p.required && <span className="text-rose-500 text-xs">*</span>}
                    </label>
                    {p.enumOptions ? (
                      <select
                        value={playgroundInputs[p.name] ?? ''}
                        onChange={(e) =>
                          setPlaygroundInputs((prev) => ({ ...prev, [p.name]: e.target.value }))
                        }
                        className="w-full bg-[#FFFFFF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#1F1E1B] dark:text-slate-200 focus:border-[#C15F3C] dark:focus:border-cyan-400 outline-none"
                      >
                        {p.enumOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={p.type === 'number' ? 'number' : 'text'}
                        value={playgroundInputs[p.name] ?? ''}
                        onChange={(e) =>
                          setPlaygroundInputs((prev) => ({
                            ...prev,
                            [p.name]: p.type === 'number' ? Number(e.target.value) : e.target.value,
                          }))
                        }
                        placeholder={p.description}
                        className="w-full bg-[#FFFFFF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-[#1F1E1B] dark:text-slate-200 focus:border-[#C15F3C] dark:focus:border-cyan-400 outline-none font-mono"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={runSimulation}
                  disabled={isRunningSim || isQuickTesting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningSim ? 'animate-spin' : ''}`} />
                  <span>{isRunningSim ? 'Executing Skill...' : 'Execute Tool Call'}</span>
                </button>

                <button
                  onClick={handleQuickTest}
                  disabled={isRunningSim || isQuickTesting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8F5EF] dark:bg-slate-800 hover:bg-[#EFEAE2] dark:hover:bg-slate-700 text-[#1F1E1B] dark:text-slate-200 border border-[#E5DFD5] dark:border-slate-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  title="Populate mock arguments and simulate response immediately"
                >
                  <Play className={`w-3 h-3 text-[#C15F3C] dark:text-cyan-400 ${isQuickTesting ? 'animate-spin' : ''}`} />
                  <span>{isQuickTesting ? 'Running Quick Test...' : 'Quick Test (Mock Inputs)'}</span>
                </button>
              </div>

              {/* Simulation Result */}
              {simResult && (
                <div className="rounded-2xl border border-emerald-500/30 bg-[#F8F5EF] dark:bg-[#070A13] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Execution Successful</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#645F57] dark:text-slate-400">
                      Duration: {simResult.executionDurationMs}ms
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-[#645F57] dark:text-slate-400 uppercase tracking-wider mb-1">
                      Agent Tool Response Payload:
                    </p>
                    <pre className="p-3 rounded-xl bg-[#FFFFFF] dark:bg-slate-950 border border-[#E5DFD5] dark:border-slate-800 font-mono text-xs text-emerald-600 dark:text-emerald-300 overflow-x-auto">
                      {JSON.stringify(simResult.output, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: OVERVIEW & CONFIG */}
          {activeTab === 'overview' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-sm mb-2">Description & Agent Objective</h3>
                <p className="text-[#3D3B39] dark:text-slate-300 leading-relaxed bg-[#F8F5EF] dark:bg-slate-900/60 p-3.5 rounded-xl border border-[#E5DFD5] dark:border-slate-800/80">
                  {skill.description}
                </p>
              </div>

              {skill.explanation && (
                <div>
                  <h3 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-sm mb-2">Agent Calling Strategy</h3>
                  <p className="text-[#3D3B39] dark:text-slate-300 leading-relaxed bg-[#F8F5EF] dark:bg-slate-900/60 p-3.5 rounded-xl border border-[#E5DFD5] dark:border-slate-800/80">
                    {skill.explanation}
                  </p>
                </div>
              )}

              {/* Config & Environment */}
              <div>
                <h3 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-sm mb-2">Execution Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-slate-900/60 border border-[#E5DFD5] dark:border-slate-800/80">
                    <p className="text-[#645F57] dark:text-slate-400 text-[11px]">Execution Timeout</p>
                    <p className="font-mono text-sm font-semibold text-[#1F1E1B] dark:text-slate-100 mt-1">
                      {skill.config?.timeoutMs || 10000} ms ({((skill.config?.timeoutMs || 10000) / 1000).toFixed(1)}s)
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-slate-900/60 border border-[#E5DFD5] dark:border-slate-800/80">
                    <p className="text-[#645F57] dark:text-slate-400 text-[11px]">Retry Policy</p>
                    <p className="font-mono text-sm font-semibold text-[#1F1E1B] dark:text-slate-100 mt-1">
                      Max {skill.config?.retryPolicy?.maxRetries ?? 2} retries (Backoff: {skill.config?.retryPolicy?.backoffMs ?? 1000}ms)
                    </p>
                  </div>

                  {skill.config?.endpointUrl && (
                    <div className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-slate-900/60 border border-[#E5DFD5] dark:border-slate-800/80 sm:col-span-2">
                      <p className="text-[#645F57] dark:text-slate-400 text-[11px]">Target Endpoint URL</p>
                      <p className="font-mono text-xs text-[#C15F3C] dark:text-cyan-300 mt-1 break-all">
                        {skill.config.endpointUrl}
                      </p>
                    </div>
                  )}

                  {skill.config?.apiKeyName && (
                    <div className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-slate-900/60 border border-[#E5DFD5] dark:border-slate-800/80 sm:col-span-2 flex items-center justify-between">
                      <div>
                        <p className="text-[#645F57] dark:text-slate-400 text-[11px]">Required Environment Secret / Key</p>
                        <p className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-300 mt-1">
                          {skill.config.apiKeyName}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                        Injected Server-Side
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {skill.tags && skill.tags.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-sm mb-2">Registry Tags</h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {skill.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#FFFFFF] dark:bg-slate-800 text-[#3D3B39] dark:text-slate-300 border border-[#E5DFD5] dark:border-slate-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: VERSION HISTORY */}
          {activeTab === 'history' && (
            <VersionHistoryTimeline
              history={skill.versionHistory || []}
              currentSkill={skill}
              onRevertToSnapshot={(snapshot) => {
                if (onRevertVersion) {
                  onRevertVersion(skill.id, snapshot.versionId);
                }
              }}
            />
          )}

          {/* TAB: RAW JSON / YAML */}
          {activeTab === 'raw' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex rounded-lg bg-[#F8F5EF] dark:bg-slate-900 p-0.5 border border-[#E5DFD5] dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setRawFormat('json')}
                    className={`px-3 py-1 rounded-md font-mono ${
                      rawFormat === 'json'
                        ? 'bg-[#C15F3C] text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 dark:text-white'
                        : 'text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setRawFormat('yaml')}
                    className={`px-3 py-1 rounded-md font-mono ${
                      rawFormat === 'yaml'
                        ? 'bg-[#C15F3C] text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 dark:text-white'
                        : 'text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    YAML
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(serializeSkill(skill, rawFormat), 'Skill Definition')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-slate-800 hover:bg-[#EFEAE2] dark:hover:bg-slate-700 text-[#3D3B39] dark:text-slate-200 text-xs font-semibold border border-[#E5DFD5] dark:border-slate-700 transition-all shadow-sm"
                  >
                    {copiedSection === 'Skill Definition' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadSkill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .{rawFormat}</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 text-[#1F1E1B] dark:text-cyan-200 font-mono text-xs overflow-x-auto leading-relaxed">
                {serializeSkill(skill, rawFormat)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
