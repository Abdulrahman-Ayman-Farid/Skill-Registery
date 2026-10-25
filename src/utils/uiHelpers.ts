import { SkillCategory, ExecutionType, SkillStatus } from '../types/skill.ts';

export function getCategoryBadgeClass(category: SkillCategory): string {
  switch (category) {
    case 'Search':
      return 'bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30';
    case 'Data':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30';
    case 'Files':
      return 'bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30';
    case 'Communication':
      return 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-pink-500/10 dark:text-pink-300 dark:border-pink-500/30';
    case 'Developer Tools':
      return 'bg-[#C15F3C]/10 text-[#C15F3C] border-[#C15F3C]/25 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-400/30';
    case 'Vision':
      return 'bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30';
    case 'RAG':
      return 'bg-indigo-50 text-indigo-900 border-indigo-200/80 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30';
    case 'Productivity':
      return 'bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

export function getExecutionTypeBadgeClass(type: ExecutionType): string {
  switch (type) {
    case 'API call':
      return 'bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40';
    case 'Python function':
      return 'bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40';
    case 'Tool integration':
      return 'bg-[#C15F3C]/10 text-[#C15F3C] border-[#C15F3C]/25 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/40';
    case 'Prompt template':
      return 'bg-pink-50 text-pink-800 border-pink-200/80 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800/40';
    case 'External service':
      return 'bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40';
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
  }
}

export function getStatusBadgeClass(status: SkillStatus): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30';
    case 'draft':
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30';
    case 'deprecated':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30';
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }
}
