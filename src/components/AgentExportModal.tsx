import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Cpu,
  CheckSquare,
  Square,
  FileJson,
} from 'lucide-react';
import { Skill } from '../types/skill.ts';
import { generateAgentBundle } from '../utils/validation.ts';
import { useToast } from './Toast.tsx';

interface AgentExportModalProps {
  skills: Skill[];
  initialSelectedIds?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function AgentExportModal({
  skills,
  initialSelectedIds = [],
  isOpen,
  onClose,
}: AgentExportModalProps) {
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedIds.length > 0 ? initialSelectedIds : skills.map((s) => s.id)
  );
  const [targetFramework, setTargetFramework] = useState<'openai' | 'anthropic' | 'gemini' | 'mcp'>('openai');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialSelectedIds.length > 0) {
      setSelectedIds(initialSelectedIds);
    } else {
      setSelectedIds(skills.map((s) => s.id));
    }
  }, [initialSelectedIds, skills]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSelectSkill = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === skills.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(skills.map((s) => s.id));
    }
  };

  const selectedSkills = skills.filter((s) => selectedIds.includes(s.id));
  const bundle = generateAgentBundle(selectedSkills, targetFramework);
  const bundleJsonString = JSON.stringify(bundle, null, 2);

  const handleCopyBundle = () => {
    navigator.clipboard.writeText(bundleJsonString);
    setCopied(true);
    showToast('Agent Config Copied', `Configuration for ${selectedSkills.length} skills copied to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBundle = () => {
    const blob = new Blob([bundleJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-tools-${targetFramework}-${selectedSkills.length}-skills.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Config', `Saved as ${a.download}`);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#FFFFFF] dark:bg-[#0D1424] border border-[#E5DFD5] dark:border-indigo-500/30 rounded-3xl shadow-2xl dark:shadow-[0_0_35px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-[#1F1E1B] dark:text-slate-100 transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DFD5] dark:border-slate-800/80 bg-[#FAF8F5]/90 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C15F3C]/10 text-[#C15F3C] dark:bg-indigo-600/20 dark:text-cyan-400 flex items-center justify-center border border-[#C15F3C]/25 dark:border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F1E1B] dark:text-white tracking-tight">
                Export Agent Tool Configuration
              </h2>
              <p className="text-xs text-[#645F57] dark:text-slate-400">
                Package selected registry skills into standard LLM tool calling definitions and system instructions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F8F5EF] dark:bg-slate-800/80 hover:bg-[#EFEAE2] dark:hover:bg-slate-800 text-[#918B80] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200 transition-colors border border-[#E5DFD5] dark:border-transparent"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Target Framework Selector */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-[#1F1E1B] dark:text-slate-200 text-xs">Target Agent Framework</h3>
              <p className="text-[11px] text-[#645F57] dark:text-slate-400">
                Select your LLM provider or standard agent orchestration engine.
              </p>
            </div>

            <div className="flex rounded-xl bg-[#FFFFFF] dark:bg-[#0D1424] p-1 border border-[#E5DFD5] dark:border-indigo-500/20 shadow-xs">
              {(
                [
                  { id: 'openai', label: 'OpenAI Tools' },
                  { id: 'anthropic', label: 'Anthropic Claude' },
                  { id: 'gemini', label: 'Google Gemini' },
                  { id: 'mcp', label: 'MCP Server' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTargetFramework(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    targetFramework === f.id
                      ? 'bg-[#C15F3C] text-white dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 dark:text-white shadow-xs'
                      : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Selection Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold uppercase tracking-wider text-[11px] text-[#645F57] dark:text-slate-400">
                Select Skills to Include ({selectedSkills.length} of {skills.length})
              </h3>
              <button
                onClick={toggleSelectAll}
                className="text-xs font-medium text-[#C15F3C] hover:text-[#A84E2E] dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                {selectedIds.length === skills.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
              {skills.map((skill) => {
                const isChecked = selectedIds.includes(skill.id);
                return (
                  <div
                    key={skill.id}
                    onClick={() => toggleSelectSkill(skill.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-[#C15F3C] bg-[#FAF8F5] dark:border-cyan-400/60 dark:bg-indigo-950/30'
                        : 'border-[#E5DFD5] dark:border-slate-800 bg-[#FFFFFF] dark:bg-[#070A13] hover:border-[#D5CFC5] dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded border-[#D5CFC5] dark:border-slate-700 bg-white dark:bg-slate-950 text-[#C15F3C] dark:text-cyan-400 focus:ring-[#C15F3C] dark:focus:ring-cyan-400 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs text-[#1F1E1B] dark:text-slate-200 truncate">
                        {skill.name}
                      </p>
                      <p className="text-[10px] text-[#645F57] dark:text-slate-500 capitalize">
                        {skill.category}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generated Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-[#645F57] dark:text-slate-400 flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
                <span>Generated Agent Configuration Payload ({selectedSkills.length} tools)</span>
              </span>
              <span className="font-mono text-[10px] text-[#918B80] dark:text-slate-500">
                {(bundleJsonString.length / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="relative rounded-2xl border border-[#E5DFD5] dark:border-slate-800 bg-[#F8F5EF] dark:bg-[#070A13] p-4 max-h-60 overflow-y-auto font-mono text-xs text-[#1F1E1B] dark:text-indigo-200">
              <pre>{bundleJsonString}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5DFD5] dark:border-slate-800/80 bg-[#FAF8F5]/90 dark:bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-[#645F57] dark:text-slate-400">
            Ready to be imported into LangChain, AutoGen, CrewAI, or direct LLM APIs.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBundle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5DFD5] dark:border-slate-700 bg-[#FFFFFF] dark:bg-slate-800 hover:bg-[#F3EFEA] dark:hover:bg-slate-700 text-[#3D3B39] dark:text-slate-200 text-xs font-semibold transition-all shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied Agent JSON</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Agent JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadBundle}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 dark:hover:brightness-110 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download agent-tools.json</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
