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
    colorClass: 'bg-blue-100/70 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  },
  Data: {
    icon: Database,
    description: 'SQL queries, tabular CSV/Excel analysis, data transformations, and metrics calculation.',
    colorClass: 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  Files: {
    icon: FileText,
    description: 'PDF parsing, document OCR, filesystem operations, and structured file extractions.',
    colorClass: 'bg-amber-100/70 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  Communication: {
    icon: MessageSquare,
    description: 'Email drafting, Slack/Discord messaging, SMS notifications, and user alerts.',
    colorClass: 'bg-rose-100/70 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  'Developer Tools': {
    icon: Wrench,
    description: 'Code execution sandboxes, GitHub integration, shell utilities, and HTTP API callers.',
    colorClass: 'bg-[#C15F3C]/15 text-[#C15F3C] dark:bg-amber-500/15 dark:text-amber-300',
  },
  Vision: {
    icon: Eye,
    description: 'Multimodal image inspection, visual question answering, OCR, and diagram comprehension.',
    colorClass: 'bg-purple-100/70 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  },
  RAG: {
    icon: Brain,
    description: 'Vector embeddings lookup, semantic similarity search, chunk retrieval, and graph RAG.',
    colorClass: 'bg-indigo-100/70 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  },
  Productivity: {
    icon: CheckCircle2,
    description: 'Calendar event scheduling, task tracking, CRM synchronization, and meeting summaries.',
    colorClass: 'bg-teal-100/70 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
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
              className="text-left rounded-2xl border border-[#E5DFD5] dark:border-[#3a3a3a] bg-[#FFFFFF] dark:bg-[#1a1a1a] p-5 vault-card-shadow transition-all hover:scale-[1.02] outline-none focus-visible:ring-2 focus-visible:ring-[#C15F3C] dark:focus-visible:ring-amber-500 flex flex-col justify-between group hover:border-[#C15F3C]/40 dark:hover:border-amber-400/50"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${meta.colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs text-[#918B80] dark:text-slate-400 font-medium">
                    {categorySkills.length} skills
                  </span>
                </div>

                <h3 className="font-bold text-[#1F1E1B] group-hover:text-[#C15F3C] dark:text-slate-100 dark:group-hover:text-amber-300 text-sm transition-colors">
                  {category}
                </h3>
                <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {meta.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#EFEAE2] dark:border-[#2a2a2a] flex items-center justify-between text-xs text-[#645F57] dark:text-slate-400 w-full">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {activeCount} active
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C15F3C] dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
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
