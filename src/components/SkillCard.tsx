import React, { useState } from 'react';
import {
  MoreVertical,
  Check,
  Edit2,
  CopyPlus,
  Archive,
  Trash2,
  Code2,
} from 'lucide-react';
import { Skill } from '../types/skill.ts';
import { generateToolSchema } from '../utils/validation.ts';
import { useToast } from './Toast.tsx';

interface SkillCardProps {
  skill: Skill;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onViewDetails: (skill: Skill) => void;
  onEdit: (skill: Skill) => void;
  onDuplicate: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SkillCard({
  skill,
  isSelected = false,
  onToggleSelect,
  onViewDetails,
  onEdit,
  onDuplicate,
  onToggleArchive,
  onDelete,
}: SkillCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopySchema = (e: React.MouseEvent) => {
    e.stopPropagation();
    const schema = generateToolSchema(skill, 'openai');
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setHasCopied(true);
    showToast('Copied Tool Schema', `OpenAI tool schema for "${skill.name}" copied to clipboard.`);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const paramCount = skill.inputSchema?.length || 0;

  return (
    <div
      onClick={() => onViewDetails(skill)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails(skill);
        }
      }}
      className={`group relative rounded-2xl border p-5 transition-all duration-150 cursor-pointer flex flex-col justify-between h-full select-none ${
        isSelected
          ? 'border-[#C15F3C] ring-1 ring-[#C15F3C] bg-[#FAF8F5] dark:border-cyan-400 dark:ring-1 dark:ring-cyan-400 dark:bg-slate-900/90'
          : 'bg-white dark:bg-[#0D1424] border-[#E5DFD5] dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      <div className="flex flex-col">
        {/* Header row: Checkbox, Category, Action Menu */}
        <div className="flex items-center justify-between gap-2 mb-3 min-h-[1.75rem]">
          <div className="flex items-center gap-2 min-w-0">
            {onToggleSelect && (
              <label
                onClick={(e) => e.stopPropagation()}
                className="flex items-center cursor-pointer p-0.5 -ml-1 rounded hover:bg-[#F3EFEA] dark:hover:bg-slate-800 transition-colors"
                title="Select skill"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(skill.id);
                  }}
                  className="w-4 h-4 rounded border-[#D5CFC5] dark:border-slate-700 bg-white dark:bg-slate-950 text-[#C15F3C] dark:text-cyan-400 focus:ring-[#C15F3C] dark:focus:ring-cyan-400 cursor-pointer shrink-0"
                />
              </label>
            )}

            <span className="text-xs font-semibold uppercase tracking-wider text-[#645F57] dark:text-slate-400">
              {skill.category}
            </span>
          </div>

          {/* Action Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-[#918B80] hover:text-[#1F1E1B] hover:bg-[#F3EFEA] dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Skill actions menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-44 rounded-xl border border-[#E5DFD5] dark:border-slate-800 bg-[#FFFFFF] dark:bg-[#0D1424] shadow-xl p-1 z-40 text-xs">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(skill);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#3D3B39] hover:text-[#1F1E1B] hover:bg-[#F3EFEA] dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
                    <span>Edit Skill</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDuplicate(skill.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#3D3B39] hover:text-[#1F1E1B] hover:bg-[#F3EFEA] dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <CopyPlus className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onToggleArchive(skill.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#3D3B39] hover:text-[#1F1E1B] hover:bg-[#F3EFEA] dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{skill.status === 'deprecated' ? 'Unarchive' : 'Archive'}</span>
                  </button>

                  <div className="my-1 border-t border-[#E5DFD5] dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(skill.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm text-[#1F1E1B] group-hover:text-[#C15F3C] dark:text-slate-100 dark:group-hover:text-cyan-300 transition-colors mb-1.5 truncate">
          {skill.name}
        </h3>

        {/* Description: Clean 2-line clamp */}
        <p className="text-xs text-[#645F57] dark:text-slate-400 line-clamp-2 leading-relaxed h-9 mb-3">
          {skill.description}
        </p>
      </div>

      {/* Footer Meta & Quick Copy */}
      <div className="pt-3 border-t border-[#EFEAE2] dark:border-slate-800/80 flex items-center justify-between text-xs text-[#645F57] dark:text-slate-400 mt-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span>{paramCount} {paramCount === 1 ? 'parameter' : 'parameters'}</span>
          <span>•</span>
          <span>{skill.executionType}</span>
        </div>

        <button
          onClick={handleCopySchema}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5DFD5] dark:border-slate-800 bg-[#F8F5EF] dark:bg-slate-800/80 hover:bg-[#EAE4DC] dark:hover:bg-slate-700 text-[#3D3B39] dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
          title="Copy OpenAI Tool Schema"
        >
          {hasCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Code2 className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-400" />
              <span>Copy Schema</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
