import { useState } from 'react';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Skill } from '../types/skill.ts';
import { storageService } from '../services/storageService.ts';
import { parseSkillDefinition } from '../utils/validation.ts';
import { useToast } from './Toast.tsx';

interface ImportExportViewProps {
  skills: Skill[];
  userId: string;
  onRefreshSkills: () => void;
}

export function ImportExportView({ skills, userId, onRefreshSkills }: ImportExportViewProps) {
  const { showToast } = useToast();
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'json' | 'yaml'>('json');
  const [importValidationErrors, setImportValidationErrors] = useState<string[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);

  const fullRegistryJson = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      totalSkills: skills.length,
      skills,
    },
    null,
    2
  );

  const handleDownloadRegistry = () => {
    const blob = new Blob([fullRegistryJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-registry-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Registry Backup', `Exported ${skills.length} skills to ${a.download}`);
  };

  const handleCopyFullRegistry = () => {
    navigator.clipboard.writeText(fullRegistryJson);
    setCopiedFull(true);
    showToast('Registry Copied', 'Full registry JSON copied to clipboard.');
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        setImportFormat('yaml');
      } else {
        setImportFormat('json');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = async () => {
    setImportValidationErrors([]);
    setImportSuccessMessage(null);

    if (!importText.trim()) {
      setImportValidationErrors(['Import payload is empty.']);
      return;
    }

    const parseResult = parseSkillDefinition(importText, importFormat);
    if (parseResult.error) {
      setImportValidationErrors([`Syntax Error: ${parseResult.error}`]);
      return;
    }

    const payload = parseResult.skill;
    let itemsToImport: any[] = [];

    if (Array.isArray(payload)) {
      itemsToImport = payload;
    } else if (payload && Array.isArray((payload as any).skills)) {
      itemsToImport = (payload as any).skills;
    } else if (payload && typeof payload === 'object') {
      itemsToImport = [payload];
    }

    if (itemsToImport.length === 0) {
      setImportValidationErrors(['No skill objects found in payload.']);
      return;
    }

    const { importedCount, errors } = await storageService.importSkills(itemsToImport, userId);
    await onRefreshSkills();

    if (errors.length > 0) {
      setImportValidationErrors(errors);
    }

    if (importedCount > 0) {
      setImportSuccessMessage(`Successfully imported ${importedCount} skill(s) into your registry!`);
      showToast('Import Completed', `${importedCount} skill(s) imported into your registry.`);
      setImportText('');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl text-xs">
      <div>
        <h2 className="text-xl font-bold text-[#1F1E1B] dark:text-white tracking-tight">Import & Export Registry</h2>
        <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1">
          Backup your custom skills, share configurations across teams, or load external definitions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Panel */}
        <div className="rounded-2xl border border-[#E5DFD5] dark:border-white/10 bg-[#FFFFFF] dark:bg-white/5 p-6 flex flex-col justify-between space-y-4 shadow-2xl shadow-black/5 dark:shadow-black/30">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-[#C15F3C] dark:text-amber-400" />
              <h3 className="font-bold text-[#1F1E1B] dark:text-slate-100 text-sm">Export Full Skill Registry</h3>
            </div>
            <p className="text-[#645F57] dark:text-slate-400 leading-relaxed">
              Export all {skills.length} skills in your private registry as a structured JSON bundle, including parameter schemas, execution configurations, and agent tags.
            </p>

            <div className="mt-4 bg-[#F8F5EF] dark:bg-[#1f1f1f] border border-[#E5DFD5] dark:border-[#2a2a2a] rounded-xl p-4 overflow-auto font-mono text-[11px] text-[#645F57] dark:text-slate-400">
              <div className="flex items-center justify-between text-[#1F1E1B] dark:text-slate-300 font-semibold mb-1">
                <span>Registry Snapshot:</span>
                <span className="text-[#C15F3C] dark:text-amber-400">{skills.length} skills</span>
              </div>
              <p className="text-[#918B80] dark:text-slate-500">Includes 12 starter skills & all custom entries</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#EFEAE2] dark:border-[#2a2a2a]">
            <button
              onClick={handleCopyFullRegistry}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F3EFEA] hover:bg-[#EAE4DC] dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a] text-[#1F1E1B] dark:text-slate-200 text-xs font-semibold border border-[#E5DFD5] dark:border-[#3a3a3a] transition-all"
            >
              {copiedFull ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadRegistry}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-[#C15F3C] dark:to-[#A84E2E] active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(193,95,60,0.4)] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup</span>
            </button>
          </div>
        </div>

        {/* Import Panel */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-[#1F1E1B] dark:text-slate-100 text-sm">Import Skill(s)</h3>
            </div>

            <div className="flex rounded-lg bg-[#F3EFEA] dark:bg-[#0a0a0a] p-0.5 border border-[#E5DFD5] dark:border-[#3a3a3a] text-[11px]">
              <button
                onClick={() => setImportFormat('json')}
                className={`px-2.5 py-0.5 rounded font-mono transition-colors ${
                  importFormat === 'json' ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white' : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => setImportFormat('yaml')}
                className={`px-2.5 py-0.5 rounded font-mono transition-colors ${
                  importFormat === 'yaml' ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white' : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                }`}
              >
                YAML
              </button>
            </div>
          </div>

          <p className="text-[#645F57] dark:text-slate-400 leading-relaxed">
            Upload or paste an individual skill or an array of skills in JSON or YAML. Schemas are strictly validated before importing.
          </p>

          <div>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileUpload}
              className="block w-full text-xs text-[#645F57] dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-[#E5DFD5] dark:file:border-0 file:text-xs file:font-semibold file:bg-[#F3EFEA] file:text-[#C15F3C] dark:file:bg-[#1f1f1f] dark:file:text-amber-300 hover:file:bg-[#EAE4DC] dark:hover:file:bg-[#2a2a2a] cursor-pointer"
            />
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            placeholder={`Paste ${importFormat.toUpperCase()} skill definition here...`}
            className="w-full bg-[#FFFFFF] dark:bg-[#1a1a1a] border border-[#E5DFD5] dark:border-[#2a2a2a] rounded-xl p-4 font-mono text-xs text-[#1F1E1B] dark:text-slate-100 focus:ring-2 focus:ring-[#C15F3C] dark:focus:ring-amber-400 outline-none"
          />

          {importSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          {importValidationErrors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-500/30 dark:text-rose-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Import Validation Failed:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {importValidationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleProcessImport}
            disabled={!importText.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-[#C15F3C] dark:to-[#A84E2E] active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(193,95,60,0.3)] transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Validate & Import Skills</span>
          </button>
        </div>
      </div>
    </div>
  );
}
