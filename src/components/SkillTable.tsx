import React from 'react';
import {
  Code2,
  Edit2,
  Trash2,
  CopyPlus,
  Archive,
} from 'lucide-react';
import { Skill } from '../types/skill.ts';
import {
  getCategoryBadgeClass,
  getExecutionTypeBadgeClass,
  getStatusBadgeClass,
} from '../utils/uiHelpers.ts';
import { generateToolSchema } from '../utils/validation.ts';
import { useToast } from './Toast.tsx';

interface SkillTableProps {
  skills: Skill[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onViewDetails: (skill: Skill) => void;
  onEdit: (skill: Skill) => void;
  onDuplicate: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SkillTable({
  skills,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewDetails,
  onEdit,
  onDuplicate,
  onToggleArchive,
  onDelete,
}: SkillTableProps) {
  const { showToast } = useToast();
  const allSelected = skills.length > 0 && selectedIds.length === skills.length;

  const handleCopySchema = (e: React.MouseEvent, skill: Skill) => {
    e.stopPropagation();
    const schema = generateToolSchema(skill, 'openai');
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    showToast('Copied Schema', `OpenAI tool schema for ${skill.name} copied.`);
  };

  return (
    <div className="rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] backdrop-blur-md overflow-hidden claude-card-shadow dark:shadow-[0_0_25px_rgba(0,0,0,0.5)] transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5DFD5] dark:border-indigo-500/20 bg-[#F8F5EF] dark:bg-[#070A13]/90 text-[#645F57] dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 pl-4 pr-2 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-[#D5CFC5] dark:border-slate-700 bg-white dark:bg-slate-950 text-[#C15F3C] dark:text-cyan-400 focus:ring-[#C15F3C] dark:focus:ring-cyan-500 cursor-pointer"
                  title="Select all"
                />
              </th>
              <th className="py-3.5 px-3">Skill Name</th>
              <th className="py-3.5 px-3">Category</th>
              <th className="py-3.5 px-3">Execution</th>
              <th className="py-3.5 px-3">Version</th>
              <th className="py-3.5 px-3">Parameters</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3">Updated</th>
              <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFEAE2] dark:divide-slate-800/60">
            {skills.map((skill) => {
              const isSelected = selectedIds.includes(skill.id);
              return (
                <tr
                  key={skill.id}
                  onClick={() => onViewDetails(skill)}
                  className={`hover:bg-[#F8F5EF] dark:hover:bg-[#111B30]/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#FAF8F5] dark:bg-indigo-950/25' : ''
                  }`}
                >
                  <td className="py-3 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(skill.id)}
                      className="w-4 h-4 rounded border-[#D5CFC5] dark:border-slate-700 bg-white dark:bg-slate-950 text-[#C15F3C] dark:text-cyan-400 focus:ring-[#C15F3C] dark:focus:ring-cyan-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#1F1E1B] dark:text-slate-200 text-xs hover:text-[#C15F3C] dark:hover:text-cyan-300 transition-colors">
                      {skill.name}
                    </div>
                    <div className="text-[11px] text-[#645F57] dark:text-slate-400 line-clamp-1 max-w-xs">
                      {skill.description}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(
                        skill.category
                      )}`}
                    >
                      {skill.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${getExecutionTypeBadgeClass(
                        skill.executionType
                      )}`}
                    >
                      {skill.executionType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#645F57] dark:text-slate-400 text-[11px]">
                    v{skill.version}
                  </td>
                  <td className="py-3 px-3 text-[#645F57] dark:text-slate-400 text-[11px]">
                    {skill.inputSchema?.length || 0} params
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${getStatusBadgeClass(
                        skill.status
                      )}`}
                    >
                      {skill.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#918B80] dark:text-slate-400 text-[11px] font-mono">
                    {new Date(skill.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 pl-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleCopySchema(e, skill)}
                        className="p-1.5 rounded-lg text-[#918B80] hover:text-[#C15F3C] dark:text-slate-400 dark:hover:text-cyan-300 hover:bg-[#F3EFEA] dark:hover:bg-slate-800 transition-colors"
                        title="Copy Tool Schema"
                      >
                        <Code2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(skill)}
                        className="p-1.5 rounded-lg text-[#918B80] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200 hover:bg-[#F3EFEA] dark:hover:bg-slate-800 transition-colors"
                        title="Edit Skill"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDuplicate(skill.id)}
                        className="p-1.5 rounded-lg text-[#918B80] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200 hover:bg-[#F3EFEA] dark:hover:bg-slate-800 transition-colors"
                        title="Duplicate Skill"
                      >
                        <CopyPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleArchive(skill.id)}
                        className="p-1.5 rounded-lg text-[#918B80] hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-[#F3EFEA] dark:hover:bg-slate-800 transition-colors"
                        title={skill.status === 'deprecated' ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(skill.id)}
                        className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
