import React from 'react';
import {
  Search,
  Database,
  FileText,
  MessageSquare,
  Wrench,
  Eye,
  Brain,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Skill, SkillCategory } from '../types/skill.ts';
import { VALID_CATEGORIES } from '../utils/validation.ts';

interface CategoriesViewProps {
  skills: Skill[];
  onSelectCategoryFilter: (category: SkillCategory) => void;
}

const CATEGORY_META: Record<
  SkillCategory,
  { icon: any; description: string; colorClass: string }
> = {
  Search: {
    icon: Search,
    description: 'Web search engines, web scraping, URL fetching, and real-time knowledge discovery.',
    colorClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:from-blue-600/30 dark:to-cyan-600/20 dark:text-cyan-300 dark:border-cyan-500/40 dark:shadow-[0_0_12px_rgba(6,182,212,0.25)]',
  },
  Data: {
    icon: Database,
    description: 'SQL queries, tabular CSV/Excel analysis, data transformations, and metrics calculation.',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:from-emerald-600/30 dark:to-teal-600/20 dark:text-emerald-300 dark:border-emerald-500/40 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  },
  Files: {
    icon: FileText,
    description: 'PDF parsing, document OCR, filesystem operations, and structured file extractions.',
    colorClass: 'bg-amber-50 text-amber-900 border-amber-200 dark:from-amber-600/30 dark:to-yellow-600/20 dark:text-amber-300 dark:border-amber-500/40',
  },
  Communication: {
    icon: MessageSquare,
    description: 'Email drafting, Slack/Discord messaging, SMS notifications, and user alerts.',
    colorClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:from-rose-600/30 dark:to-pink-600/20 dark:text-rose-300 dark:border-rose-500/40',
  },
  'Developer Tools': {
    icon: Wrench,
    description: 'Code execution sandboxes, GitHub integration, shell utilities, and HTTP API callers.',
    colorClass: 'bg-[#C15F3C]/10 text-[#C15F3C] border-[#C15F3C]/25 dark:from-cyan-600/30 dark:to-indigo-600/20 dark:text-cyan-300 dark:border-cyan-400/40 dark:shadow-[0_0_12px_rgba(6,182,212,0.25)]',
  },
  Vision: {
    icon: Eye,
    description: 'Multimodal image inspection, visual question answering, OCR, and diagram comprehension.',
    colorClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:from-purple-600/30 dark:to-indigo-600/20 dark:text-purple-300 dark:border-purple-500/40',
  },
  RAG: {
    icon: Brain,
    description: 'Vector embeddings lookup, semantic similarity search, chunk retrieval, and graph RAG.',
    colorClass: 'bg-indigo-50 text-indigo-900 border-indigo-200 dark:from-indigo-600/30 dark:to-violet-600/20 dark:text-indigo-300 dark:border-indigo-500/40 dark:shadow-[0_0_12px_rgba(99,102,241,0.25)]',
  },
  Productivity: {
    icon: CheckCircle2,
    description: 'Calendar event scheduling, task tracking, CRM synchronization, and meeting summaries.',
    colorClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:from-teal-600/30 dark:to-emerald-600/20 dark:text-teal-300 dark:border-teal-500/40',
  },
};

export function CategoriesView({ skills, onSelectCategoryFilter }: CategoriesViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1F1E1B] dark:text-white tracking-tight">
          Skill Categories Overview
        </h2>
        <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1">
          Explore skills organized across 8 modular agent functional domains.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {VALID_CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          const categorySkills = skills.filter((s) => s.category === category);
          const activeCount = categorySkills.filter((s) => s.status === 'active').length;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategoryFilter(category)}
              className="text-left rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] hover:bg-[#FAF8F5] dark:hover:bg-[#111B30] p-5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C15F3C] dark:focus-visible:ring-cyan-500 flex flex-col justify-between group hover:border-[#C15F3C]/40 dark:hover:border-cyan-400/50 claude-card-shadow dark:hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center border transition-all ${meta.colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#918B80] dark:text-slate-400 font-medium">
                    {categorySkills.length} skills
                  </span>
                </div>

                <h3 className="font-bold text-[#1F1E1B] group-hover:text-[#C15F3C] dark:text-slate-100 dark:group-hover:text-cyan-300 text-sm transition-colors">
                  {category}
                </h3>
                <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {meta.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#EFEAE2] dark:border-indigo-500/20 flex items-center justify-between text-xs text-[#645F57] dark:text-slate-400 w-full">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {activeCount} active
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C15F3C] dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Browse skills</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
