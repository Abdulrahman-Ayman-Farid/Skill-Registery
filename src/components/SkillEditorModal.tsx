import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Code2,
  FormInput,
  Sparkles,
  Info,
  Layers,
  Wand2,
  History,
  RotateCcw,
} from 'lucide-react';
import {
  Skill,
  SkillCategory,
  ExecutionType,
  SkillStatus,
  ParameterDefinition,
  ParameterType,
  SkillVersionSnapshot,
} from '../types/skill.ts';
import { VersionHistoryTimeline } from './VersionHistoryTimeline.tsx';
import {
  validateSkill,
  parseSkillDefinition,
  serializeSkill,
  VALID_CATEGORIES,
  VALID_EXECUTION_TYPES,
  VALID_STATUSES,
} from '../utils/validation.ts';
import { detectCycles } from '../utils/graphAnalysis.ts';
import { storageService } from '../services/storageService.ts';
import { useToast } from './Toast.tsx';

interface SkillEditorModalProps {
  initialSkill?: Skill | null;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: Skill) => void;
}

export function SkillEditorModal({
  initialSkill,
  currentUserId,
  isOpen,
  onClose,
  onSave,
}: SkillEditorModalProps) {
  const { showToast } = useToast();
  const isEditing = Boolean(initialSkill);

  // Edit Mode: 'visual' or 'code' or 'history'
  const [editorMode, setEditorMode] = useState<'visual' | 'code' | 'history'>('visual');
  const [codeFormat, setCodeFormat] = useState<'json' | 'yaml'>('json');
  const [versionHistory, setVersionHistory] = useState<SkillVersionSnapshot[]>(
    initialSkill?.versionHistory || []
  );
  const [revertBanner, setRevertBanner] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(initialSkill?.name || '');
  const [description, setDescription] = useState(initialSkill?.description || '');
  const [category, setCategory] = useState<SkillCategory>(initialSkill?.category || 'Developer Tools');
  const [version, setVersion] = useState(initialSkill?.version || '1.0.0');
  const [author, setAuthor] = useState(initialSkill?.author || 'Custom Author');
  const [executionType, setExecutionType] = useState<ExecutionType>(initialSkill?.executionType || 'API call');
  const [status, setStatus] = useState<SkillStatus>(initialSkill?.status || 'active');
  const [inputSchema, setInputSchema] = useState<ParameterDefinition[]>(
    initialSkill?.inputSchema || [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'Input query for skill execution.',
        exampleValue: '',
      },
    ]
  );
  const [outputType, setOutputType] = useState<'object' | 'string' | 'array'>('object');
  const [outputDescription, setOutputDescription] = useState(
    initialSkill?.outputSchema?.description || 'Structured execution output'
  );
  const [timeoutMs, setTimeoutMs] = useState(initialSkill?.config?.timeoutMs || 10000);
  const [maxRetries, setMaxRetries] = useState(initialSkill?.config?.retryPolicy?.maxRetries ?? 2);
  const [backoffMs, setBackoffMs] = useState(initialSkill?.config?.retryPolicy?.backoffMs ?? 1000);
  const [apiKeyName, setApiKeyName] = useState(initialSkill?.config?.apiKeyName || '');
  const [endpointUrl, setEndpointUrl] = useState(initialSkill?.config?.endpointUrl || '');
  const [tagsInput, setTagsInput] = useState(initialSkill?.tags?.join(', ') || 'agent, custom');
  const [explanation, setExplanation] = useState(initialSkill?.explanation || '');
  const [docUrl, setDocUrl] = useState(initialSkill?.docUrl || '');

  // Reset/sync state when initialSkill or modal openness changes
  useEffect(() => {
    if (isOpen) {
      setName(initialSkill?.name || '');
      setDescription(initialSkill?.description || '');
      setCategory(initialSkill?.category || 'Developer Tools');
      setVersion(initialSkill?.version || '1.0.0');
      setAuthor(initialSkill?.author || 'Custom Author');
      setExecutionType(initialSkill?.executionType || 'API call');
      setStatus(initialSkill?.status || 'active');
      setInputSchema(
        initialSkill?.inputSchema || [
          {
            name: 'query',
            type: 'string',
            required: true,
            description: 'Input query for skill execution.',
            exampleValue: '',
          },
        ]
      );
      setOutputType((initialSkill?.outputSchema?.type as any) || 'object');
      setOutputDescription(initialSkill?.outputSchema?.description || 'Structured execution output');
      setTimeoutMs(initialSkill?.config?.timeoutMs || 10000);
      setMaxRetries(initialSkill?.config?.retryPolicy?.maxRetries ?? 2);
      setBackoffMs(initialSkill?.config?.retryPolicy?.backoffMs ?? 1000);
      setApiKeyName(initialSkill?.config?.apiKeyName || '');
      setEndpointUrl(initialSkill?.config?.endpointUrl || '');
      setTagsInput(initialSkill?.tags?.join(', ') || 'agent, custom');
      setExplanation(initialSkill?.explanation || '');
      setDocUrl(initialSkill?.docUrl || '');
      setVersionHistory(initialSkill?.versionHistory || []);
      setRevertBanner(null);
      setFormErrors({});
      setCodeErrors([]);
      setEditorMode('visual');
    }
  }, [initialSkill, isOpen]);

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

  // Raw Code Editor State
  const [rawCode, setRawCode] = useState('');
  const [codeErrors, setCodeErrors] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sync state to raw code when toggling to code mode
  const syncToCode = () => {
    const currentObj: Partial<Skill> = {
      id: initialSkill?.id || `skill_${Date.now()}`,
      userId: initialSkill?.userId || 'current',
      name,
      description,
      category,
      version,
      author,
      executionType,
      status,
      inputSchema,
      outputSchema: {
        type: outputType,
        description: outputDescription,
      },
      config: {
        timeoutMs,
        retryPolicy: { maxRetries, backoffMs },
        apiKeyName: apiKeyName || undefined,
        endpointUrl: endpointUrl || undefined,
      },
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      explanation: explanation || undefined,
      docUrl: docUrl || undefined,
      createdAt: initialSkill?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRawCode(serializeSkill(currentObj as Skill, codeFormat));
    setCodeErrors([]);
  };

  // Sync state from raw code when switching back or saving
  const syncFromCode = (): boolean => {
    const result = parseSkillDefinition(rawCode, codeFormat);
    if (result.error) {
      setCodeErrors([`Syntax Error: ${result.error}`]);
      return false;
    }

    const val = validateSkill(result.skill || {});
    if (!val.isValid) {
      setCodeErrors(val.errors.map((e) => `${e.field}: ${e.message}`));
      return false;
    }

    const s = result.skill!;
    if (s.name) setName(s.name);
    if (s.description) setDescription(s.description);
    if (s.category) setCategory(s.category as SkillCategory);
    if (s.version) setVersion(s.version);
    if (s.author) setAuthor(s.author);
    if (s.executionType) setExecutionType(s.executionType as ExecutionType);
    if (s.status) setStatus(s.status as SkillStatus);
    if (s.inputSchema) setInputSchema(s.inputSchema);
    if (s.outputSchema) {
      setOutputType(s.outputSchema.type as any || 'object');
      setOutputDescription(s.outputSchema.description || '');
    }
    if (s.config) {
      if (s.config.timeoutMs) setTimeoutMs(s.config.timeoutMs);
      if (s.config.retryPolicy) {
        setMaxRetries(s.config.retryPolicy.maxRetries ?? 2);
        setBackoffMs(s.config.retryPolicy.backoffMs ?? 1000);
      }
      if (s.config.apiKeyName) setApiKeyName(s.config.apiKeyName);
      if (s.config.endpointUrl) setEndpointUrl(s.config.endpointUrl);
    }
    if (s.tags) setTagsInput(s.tags.join(', '));
    if (s.explanation) setExplanation(s.explanation);
    if (s.docUrl) setDocUrl(s.docUrl);

    setCodeErrors([]);
    return true;
  };

  const handleModeChange = (newMode: 'visual' | 'code' | 'history') => {
    if (newMode === 'code') {
      syncToCode();
      setEditorMode('code');
    } else if (newMode === 'visual') {
      if (editorMode === 'code') {
        if (syncFromCode()) {
          setEditorMode('visual');
        }
      } else {
        setEditorMode('visual');
      }
    } else {
      if (editorMode === 'code') {
        syncFromCode();
      }
      setEditorMode('history');
    }
  };

  const handleRevertToSnapshot = (snapshot: SkillVersionSnapshot) => {
    const s = snapshot.skillState;
    setName(s.name);
    setDescription(s.description);
    setCategory(s.category);
    setVersion(s.version);
    setExecutionType(s.executionType);
    setStatus(s.status);
    setInputSchema(JSON.parse(JSON.stringify(s.inputSchema || [])));
    if (s.outputSchema) {
      setOutputType(s.outputSchema.type as any || 'object');
      setOutputDescription(s.outputSchema.description || '');
    }
    if (s.config) {
      setTimeoutMs(s.config.timeoutMs || 10000);
      setMaxRetries(s.config.retryPolicy?.maxRetries ?? 2);
      setBackoffMs(s.config.retryPolicy?.backoffMs ?? 1000);
      setApiKeyName(s.config.apiKeyName || '');
      setEndpointUrl(s.config.endpointUrl || '');
    }
    if (s.tags) setTagsInput(s.tags.join(', '));
    if (s.explanation) setExplanation(s.explanation || '');

    setRevertBanner(
      `Restored editor state to version ${snapshot.version} from snapshot (${new Date(
        snapshot.timestamp
      ).toLocaleDateString()}). You can review changes and click Save to commit.`
    );
    setEditorMode('visual');
  };

  // Add parameter handler
  const handleAddParameter = () => {
    setInputSchema((prev) => [
      ...prev,
      {
        name: `param_${prev.length + 1}`,
        type: 'string',
        required: false,
        description: '',
        exampleValue: '',
      },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    setInputSchema((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateParameter = (index: number, updates: Partial<ParameterDefinition>) => {
    setInputSchema((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let candidateSkill: Skill;

    if (editorMode === 'code') {
      const parsed = parseSkillDefinition(rawCode, codeFormat);
      if (parsed.error) {
        setCodeErrors([`Syntax Error: ${parsed.error}`]);
        return;
      }
      candidateSkill = {
        ...initialSkill,
        ...(parsed.skill as Skill),
        id: initialSkill?.id || parsed.skill?.id || `skill_${Date.now()}`,
        userId: initialSkill?.userId || currentUserId,
        createdAt: initialSkill?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      candidateSkill = {
        id: initialSkill?.id || `skill_${Date.now()}`,
        userId: initialSkill?.userId || currentUserId,
        name: name.trim(),
        description: description.trim(),
        category,
        version: version.trim(),
        author: author.trim(),
        executionType,
        status,
        inputSchema,
        outputSchema: {
          type: outputType,
          description: outputDescription,
        },
        config: {
          timeoutMs: Number(timeoutMs),
          retryPolicy: { maxRetries: Number(maxRetries), backoffMs: Number(backoffMs) },
          apiKeyName: apiKeyName.trim() || undefined,
          endpointUrl: endpointUrl.trim() || undefined,
        },
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        explanation: explanation.trim() || undefined,
        docUrl: docUrl.trim() || undefined,
        versionHistory: initialSkill?.versionHistory || versionHistory,
        createdAt: initialSkill?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const validation = validateSkill(candidateSkill);
    if (!validation.isValid) {
      const errorsMap: Record<string, string> = {};
      validation.errors.forEach((err) => {
        errorsMap[err.field] = err.message;
      });
      setFormErrors(errorsMap);
      showToast('Validation Error', 'Please correct the highlighted schema issues before saving.', 'error');
      return;
    }

    onSave(candidateSkill);
    showToast(
      isEditing ? 'Skill Updated' : 'Skill Created',
      `"${candidateSkill.name}" saved to personal registry.`
    );
    onClose();
  };

  if (!isOpen) return null;

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
          <div>
            <h2 className="text-lg font-bold text-[#1F1E1B] dark:text-white tracking-tight flex items-center gap-2">
              <span>{isEditing ? `Edit "${initialSkill?.name}"` : 'Register New AI Agent Skill'}</span>
            </h2>
            <p className="text-xs text-[#645F57] dark:text-slate-400 mt-0.5">
              Define input parameters, execution boundaries, and tool calling schemas.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-[#F3EFEA] dark:bg-[#070A13] p-0.5 border border-[#E5DFD5] dark:border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleModeChange('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  editorMode === 'visual'
                    ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white shadow-sm'
                    : 'text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FormInput className="w-3.5 h-3.5" />
                <span>Visual Form</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  editorMode === 'code'
                    ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white shadow-sm'
                    : 'text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSON / YAML</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  editorMode === 'history'
                    ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white shadow-sm'
                    : 'text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Version History</span>
                {versionHistory.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#EAE4DC] text-[#C15F3C] dark:bg-slate-800 dark:text-cyan-300">
                    {versionHistory.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#F3EFEA] hover:bg-[#EAE4DC] text-[#645F57] hover:text-[#1F1E1B] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors ml-2"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {revertBanner && (
            <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300 flex items-center justify-between text-xs mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{revertBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setRevertBanner(null)}
                className="p-1 hover:text-black dark:hover:text-white"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {editorMode === 'history' ? (
            <VersionHistoryTimeline
              history={versionHistory}
              currentSkill={{
                name,
                description,
                category,
                version,
                executionType,
                status,
                inputSchema,
                outputSchema: {
                  type: outputType,
                  description: outputDescription,
                },
                config: {
                  timeoutMs: Number(timeoutMs),
                  retryPolicy: { maxRetries: Number(maxRetries), backoffMs: Number(backoffMs) },
                  apiKeyName: apiKeyName.trim() || undefined,
                  endpointUrl: endpointUrl.trim() || undefined,
                },
                tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
                explanation: explanation.trim() || undefined,
              }}
              onRevertToSnapshot={handleRevertToSnapshot}
            />
          ) : editorMode === 'visual' ? (
            <>
              {/* Basic Metadata */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#1F1E1B] dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
                  <span>General Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">
                      Skill Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brave Web Search"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 focus:border-[#C15F3C] dark:focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[#1F1E1B] dark:text-slate-100 outline-none"
                    />
                    {formErrors.name && <p className="text-[11px] text-rose-500">{formErrors.name}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SkillCategory)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 focus:border-[#C15F3C] dark:focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[#1F1E1B] dark:text-slate-100 outline-none"
                    >
                      {VALID_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Describe what this skill does and the exact scenarios when an agent should invoke it..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 focus:border-[#C15F3C] dark:focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[#1F1E1B] dark:text-slate-100 outline-none"
                    />
                    {formErrors.description && (
                      <p className="text-[11px] text-rose-500">{formErrors.description}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">
                      Execution Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={executionType}
                      onChange={(e) => setExecutionType(e.target.value as ExecutionType)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 focus:border-[#C15F3C] dark:focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[#1F1E1B] dark:text-slate-100 outline-none"
                    >
                      {VALID_EXECUTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">
                      Version <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1.0.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 focus:border-[#C15F3C] dark:focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[#1F1E1B] dark:text-slate-100 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">
                      Author / Organization <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Internal Team"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 focus:border-[#C15F3C] dark:focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[#1F1E1B] dark:text-slate-100 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Lifecycle Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as SkillStatus)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 focus:border-[#C15F3C] dark:focus:border-cyan-400 rounded-xl px-3.5 py-2 text-[#1F1E1B] dark:text-slate-100 outline-none"
                    >
                      {VALID_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Input Schema Parameters */}
              <div className="border-t border-[#EFEAE2] dark:border-slate-800/80 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#1F1E1B] dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
                      <span>Input Schema (Tool Arguments)</span>
                    </h3>
                    <p className="text-[11px] text-[#645F57] dark:text-slate-400 mt-0.5">
                      Parameters the agent will generate when invoking this skill.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3EFEA] hover:bg-[#EAE4DC] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1F1E1B] dark:text-slate-200 text-xs font-semibold border border-[#E5DFD5] dark:border-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {inputSchema.map((param, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-2xl border border-[#E5DFD5] dark:border-slate-800 bg-[#F8F5EF] dark:bg-slate-900/60 space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            required
                            placeholder="param_name"
                            value={param.name}
                            onChange={(e) => handleUpdateParameter(index, { name: e.target.value })}
                            className="bg-[#FFFFFF] dark:bg-slate-950 border border-[#E5DFD5] dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[#1F1E1B] dark:text-slate-200 font-mono text-xs focus:border-[#C15F3C] dark:focus:border-cyan-400 outline-none"
                          />
                          <select
                            value={param.type}
                            onChange={(e) =>
                              handleUpdateParameter(index, { type: e.target.value as ParameterType })
                            }
                            className="bg-[#FFFFFF] dark:bg-slate-950 border border-[#E5DFD5] dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[#1F1E1B] dark:text-slate-300 font-mono text-xs focus:border-[#C15F3C] dark:focus:border-cyan-400 outline-none"
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="array">array</option>
                            <option value="object">object</option>
                          </select>
                          <label className="flex items-center gap-1.5 cursor-pointer ml-2">
                            <input
                              type="checkbox"
                              checked={param.required}
                              onChange={(e) => handleUpdateParameter(index, { required: e.target.checked })}
                              className="rounded border-[#D5CFC5] dark:border-slate-700 bg-white dark:bg-slate-950 text-[#C15F3C] dark:text-cyan-400 focus:ring-[#C15F3C]"
                            />
                            <span className="text-[#3D3B39] dark:text-slate-300 font-medium text-[11px]">Required</span>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(index)}
                          className="p-1 text-[#918B80] hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition-colors"
                          title="Remove parameter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Parameter description for agent reasoning..."
                          value={param.description}
                          onChange={(e) => handleUpdateParameter(index, { description: e.target.value })}
                          className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#E5DFD5] dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[#1F1E1B] dark:text-slate-200 text-xs focus:border-[#C15F3C] dark:focus:border-cyan-400 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Example value (e.g. quantum physics)"
                          value={param.exampleValue !== undefined ? String(param.exampleValue) : ''}
                          onChange={(e) => handleUpdateParameter(index, { exampleValue: e.target.value })}
                          className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#E5DFD5] dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[#1F1E1B] dark:text-slate-200 text-xs font-mono focus:border-[#C15F3C] dark:focus:border-cyan-400 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution & Security Config */}
              <div className="border-t border-[#EFEAE2] dark:border-slate-800/80 pt-6 space-y-4">
                <h3 className="text-xs font-bold text-[#1F1E1B] dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
                  <span>Execution & Security Settings</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Backoff (ms)</label>
                    <input
                      type="number"
                      value={backoffMs}
                      onChange={(e) => setBackoffMs(Number(e.target.value))}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-[#1F1E1B] dark:text-slate-100 font-mono outline-none focus:border-[#C15F3C] dark:focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Endpoint URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://api.example.com/v1/skill"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-[#1F1E1B] dark:text-slate-100 font-mono outline-none focus:border-[#C15F3C] dark:focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Secret / API Key Env Name</label>
                    <input
                      type="text"
                      placeholder="e.g. BRAVE_API_KEY"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-[#1F1E1B] dark:text-slate-100 font-mono outline-none focus:border-[#C15F3C] dark:focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="font-semibold text-[#1F1E1B] dark:text-slate-300">Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="search, web, research, fast"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-xl px-3 py-2 text-[#1F1E1B] dark:text-slate-100 font-mono outline-none focus:border-[#C15F3C] dark:focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* CODE MODE: JSON / YAML Live Editor */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#645F57] dark:text-slate-400">Syntax:</span>
                  <div className="flex rounded-lg bg-[#F3EFEA] dark:bg-[#070A13] p-0.5 border border-[#E5DFD5] dark:border-slate-800 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setCodeFormat('json');
                        syncToCode();
                      }}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        codeFormat === 'json' ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white' : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCodeFormat('yaml');
                        syncToCode();
                      }}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        codeFormat === 'yaml' ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white' : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                      }`}
                    >
                      YAML
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-[#645F57] dark:text-slate-400">
                  Paste complete schema or definition below
                </span>
              </div>

              {codeErrors.length > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Schema Validation Issues:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {codeErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <textarea
                value={rawCode}
                onChange={(e) => setRawCode(e.target.value)}
                rows={18}
                className="w-full bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 rounded-2xl p-4 font-mono text-xs text-[#1F1E1B] dark:text-cyan-200 focus:border-[#C15F3C] dark:focus:border-cyan-400 outline-none leading-relaxed"
                placeholder={codeFormat === 'json' ? '{\n  "name": "My Skill", ...\n}' : 'name: My Skill\n...'}
              />
            </div>
          )}

          {/* Footer Save & Cancel Buttons */}
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
              className="px-5 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
            >
              {isEditing ? 'Save Changes' : 'Create Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
