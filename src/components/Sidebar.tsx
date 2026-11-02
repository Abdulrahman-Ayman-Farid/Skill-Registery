import {
  Boxes,
  Compass,
  FolderTree,
  Cpu,
  ArrowDownUp,
  BookOpen,
  Settings,
  Database,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

export type NavigationTab =
  | 'registry'
  | 'marketplace'
  | 'categories'
  | 'agent-studio'
  | 'import-export'
  | 'docs'
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  registryCount: number;
  marketplaceCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onResetSeed: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  registryCount,
  marketplaceCount,
  isOpenMobile,
  onCloseMobile,
  onResetSeed,
}: SidebarProps) {
  const navItems = [
    {
      id: 'registry' as NavigationTab,
      label: 'My Registry',
      icon: Boxes,
      badge: registryCount,
    },
    {
      id: 'marketplace' as NavigationTab,
      label: 'Skill Library',
      icon: Compass,
      badge: marketplaceCount,
    },
    {
      id: 'categories' as NavigationTab,
      label: 'Categories',
      icon: FolderTree,
    },
    {
      id: 'agent-studio' as NavigationTab,
      label: 'Agent Studio',
      icon: Cpu,
      isNew: true,
    },
    {
      id: 'import-export' as NavigationTab,
      label: 'Import / Export',
      icon: ArrowDownUp,
    },
    {
      id: 'docs' as NavigationTab,
      label: 'Documentation',
      icon: BookOpen,
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleItemClick = (id: NavigationTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-[#E5DFD5] dark:border-[#3a3a3a] bg-[#F3EFEA] dark:bg-[#111111]/95 backdrop-blur-xl flex flex-col justify-between transition-all duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Main Nav Items */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-[#918B80] dark:text-slate-500 uppercase tracking-wider mb-2">
              Skill Management
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group outline-none focus-visible:ring-2 focus-visible:ring-[#C15F3C] dark:focus-visible:ring-amber-500 ${
                    isActive
                      ? 'bg-[#C15F3C]/10 dark:bg-amber-600/20 text-[#C15F3C] dark:text-amber-300 border border-[#C15F3C]/25 dark:border-amber-400/40 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200 hover:bg-[#EAE4DC] dark:hover:bg-[#1f1f1f]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-[#C15F3C] dark:text-amber-400'
                          : 'text-[#918B80] dark:text-slate-500 group-hover:text-[#1F1E1B] dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono transition-colors ${
                        isActive
                          ? 'text-[#C15F3C] dark:text-amber-300 font-bold'
                          : 'text-[#918B80] dark:text-slate-500 group-hover:text-[#1F1E1B] dark:group-hover:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.isNew && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C15F3C] dark:text-amber-400 font-bold">
                      bundle
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Info Box */}
          <div className="rounded-2xl p-3.5 bg-[#FFFFFF] dark:bg-[#1a1a1a] border border-[#E5DFD5] dark:border-[#3a3a3a] text-xs shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.08)]">
            <div className="flex items-center gap-2 text-[#1F1E1B] dark:text-slate-200 font-semibold mb-1">
              <Database className="w-3.5 h-3.5 text-[#C15F3C] dark:text-amber-400" />
              <span>Offline Persistence</span>
            </div>
            <p className="text-[11px] text-[#645F57] dark:text-slate-400 leading-relaxed">
              All skill definitions, schemas, and configurations persist automatically per account.
            </p>
            <button
              onClick={onResetSeed}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#C15F3C] hover:text-[#A84E2E] dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore 12 Starter Skills</span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-[#E5DFD5] dark:border-[#3a3a3a] bg-[#FAF8F5]/80 dark:bg-[#0a0a0a]/60 text-[11px] text-[#645F57] dark:text-slate-400 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1F1E1B] dark:text-slate-300">Agent Tool Registry</p>
            <p className="text-[10px] text-[#918B80] dark:text-slate-500 font-mono">OpenAI • Anthropic • Gemini • MCP</p>
          </div>
          <a
            href="https://modelcontextprotocol.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-[#918B80] hover:text-[#C15F3C] dark:text-slate-500 dark:hover:text-amber-400 transition-colors"
            title="MCP Specification"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>
    </>
  );
}
