import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Star,
  ExternalLink,
  ShieldCheck,
  Clock,
  Layers,
  Wand2,
  Key,
} from 'lucide-react';
import { Skill, SkillConfig } from '../types/skill.ts';
import {
  getCategoryBadgeClass,
  getExecutionTypeBadgeClass,
} from '../utils/uiHelpers.ts';

interface MarketplaceInstallModalProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall: (skill: Skill, customConfig: Partial<SkillConfig>) => void;
}

export function MarketplaceInstallModal({
  skill,
  isOpen,
  onClose,
  onInstall,
}: MarketplaceInstallModalProps) {
  // Editable configuration fields before installing
  const [endpointUrl, setEndpointUrl] = useState(skill?.config?.endpointUrl || '');
  const [apiKeyName, setApiKeyName] = useState(skill?.config?.apiKeyName || '');
  const [timeoutMs, setTimeoutMs] = useState(skill?.config?.timeoutMs || 10000);
  const [maxRetries, setMaxRetries] = useState(skill?.config?.retryPolicy?.maxRetries ?? 2);

  useEffect(() => {
    if (skill) {
      setEndpointUrl(skill.config?.endpointUrl || '');
      setApiKeyName(skill.config?.apiKeyName || '');
      setTimeoutMs(skill.config?.timeoutMs || 10000);
      setMaxRetries(skill.config?.retryPolicy?.maxRetries ?? 2);
    }
  }, [skill]);

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

  if (!isOpen || !skill) return null;

  const handleInstallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInstall(skill, {
      endpointUrl: endpointUrl.trim() || undefined,
      apiKeyName: apiKeyName.trim() || undefined,
      timeoutMs: Number(timeoutMs),
      retryPolicy: {
        maxRetries: Number(maxRetries),
        backoffMs: skill.config?.retryPolicy?.backoffMs || 1000,
      },
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#0D1424] border border-[#E5DFD5] dark:border-indigo-500/30 rounded-3xl shadow-2xl dark:shadow-[0_0_35px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-[#1F1E1B] dark:text-slate-100 transition-colors"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DFD5] dark:border-slate-800/80 bg-[#FAF8F5]/90 dark:bg-slate-900/60 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#645F57] dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[#1F1E1B] dark:text-cyan-300">
                {skill.category}
              </span>
              <span className="text-[#918B80] dark:text-slate-600">•</span>
              <span className="font-mono text-[11px] text-[#645F57] dark:text-slate-400">
                {skill.executionType}
              </span>
              {skill.stars && (
                <>
                  <span className="text-[#918B80] dark:text-slate-600">•</span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-amber-500 dark:text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{skill.stars.toLocaleString()}</span>
                  </span>
                </>
              )}
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
              Source: <span className="text-[#C15F3C] dark:text-cyan-400 font-semibold">{skill.source}</span> • Author: {skill.author}
              {skill.license && <span className="text-[#918B80] dark:text-slate-500"> • License: {skill.license}</span>}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#F3EFEA] hover:bg-[#EAE4DC] text-[#645F57] hover:text-[#1F1E1B] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Configuration Form */}
        <form onSubmit={handleInstallSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Overview */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-slate-900/60 border border-[#E5DFD5] dark:border-slate-800/80 space-y-2">
            <p className="text-[#3D3B39] dark:text-slate-300 leading-relaxed">{skill.description}</p>
            {skill.explanation && (
              <p className="text-[#C15F3C] dark:text-cyan-300/90 text-[11px] leading-relaxed pt-2 border-t border-[#E5DFD5] dark:border-slate-800/60">
                <span className="font-semibold text-[#1F1E1B] dark:text-slate-200">Agent Calling Guidance: </span>
                {skill.explanation}
              </p>
            )}
          </div>

          {/* Credentials Requirement Warning */}
          {skill.requiredCredentials && skill.requiredCredentials.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-amber-300 flex items-start gap-2.5">
              <Key className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold">Required Environment Credentials: </span>
                <span className="font-mono text-[11px]">
                  {skill.requiredCredentials.join(', ')}
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400/80 mt-0.5">
                  Ensure these keys exist in your agent runtime server environment.
                </p>
              </div>
            </div>
          )}

          {/* Parameters Preview */}
          <div>
            <h4 className="font-bold text-[#1F1E1B] dark:text-slate-300 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
              <span>Input Parameters ({skill.inputSchema?.length || 0})</span>
            </h4>
            <div className="space-y-1.5">
              {skill.inputSchema?.map((p) => (
                <div
                  key={p.name}
                  className="p-2.5 rounded-xl bg-[#F8F5EF] dark:bg-slate-900/40 border border-[#E5DFD5] dark:border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#C15F3C] dark:text-cyan-300 font-semibold">{p.name}</span>
                    <span className="font-mono text-[10px] text-[#645F57] dark:text-slate-400">({p.type})</span>
                    {p.required && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300">
                        required
                      </span>
                    )}
                  </div>
                  <span className="text-[#645F57] dark:text-slate-400 text-[11px] truncate max-w-xs">{p.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Configuration Before Install */}
          <div className="border-t border-[#EFEAE2] dark:border-slate-800/80 pt-5 space-y-4">
            <h4 className="font-bold text-[#1F1E1B] dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
              <span>Customize Configuration for Your Registry</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Endpoint URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-[#1F1E1B] dark:text-slate-100 font-mono outline-none focus:border-[#C15F3C] dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Secret / API Key Env Variable</label>
                <input
                  type="text"
                  placeholder="MY_API_KEY"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-[#1F1E1B] dark:text-slate-100 font-mono outline-none focus:border-[#C15F3C] dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Timeout (ms)</label>
                <input
                  type="number"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(Number(e.target.value))}
                  className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-[#1F1E1B] dark:text-slate-100 font-mono outline-none focus:border-[#C15F3C] dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Max Retries</label>
                <input
                  type="number"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-[#1F1E1B] dark:text-slate-100 font-mono outline-none focus:border-[#C15F3C] dark:focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#EFEAE2] dark:border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#645F57] hover:text-[#1F1E1B] hover:bg-[#F3EFEA] dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install to My Registry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
