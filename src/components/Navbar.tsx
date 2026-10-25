import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Download,
  Search,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { User } from '../types/skill.ts';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (userId: string) => void;
  onCreateUserClick: () => void;
  onAddSkillClick: () => void;
  onExportAgentClick: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleMobileSidebar: () => void;
}

export function Navbar({
  searchQuery,
  onSearchChange,
  currentUser,
  users,
  onSwitchUser,
  onCreateUserClick,
  onAddSkillClick,
  onExportAgentClick,
  isDarkMode,
  onToggleTheme,
  onToggleMobileSidebar,
}: NavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('navbar-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E5DFD5] dark:border-indigo-500/20 bg-[#FAF8F5]/90 dark:bg-[#070A13]/90 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Left branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-[#645F57] hover:text-[#1F1E1B] hover:bg-[#F3EFEA] dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900 rounded-lg transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C15F3C] via-[#D97706] to-[#B45309] dark:from-blue-600 dark:via-indigo-500 dark:to-cyan-400 flex items-center justify-center shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white font-bold ring-1 ring-white/20 dark:ring-cyan-400/40 transition-all">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#1F1E1B] dark:text-white">
                SkillRegistry
              </span>
              <span className="text-[#918B80] dark:text-slate-600 font-light">/</span>
              <span className="text-[11px] font-mono font-medium text-[#C15F3C] dark:text-cyan-400">
                agent-ops
              </span>
            </div>
            <p className="text-[11px] text-[#645F57] dark:text-slate-400 hidden sm:block">
              Modular AI Agent Capabilities
            </p>
          </div>
        </div>
      </div>

      {/* Center Search Input with ⌘K */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-[#918B80] dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="navbar-search-input"
            type="text"
            placeholder="Search skills by name, tag, category, or parameter..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F3EFEA] dark:bg-[#0D1424] border border-[#E5DFD5] dark:border-indigo-500/30 hover:border-[#D5CFC5] dark:hover:border-indigo-500/50 focus:border-[#C15F3C] dark:focus:border-cyan-400 focus:ring-2 focus:ring-[#C15F3C]/20 dark:focus:ring-cyan-500/20 rounded-xl pl-10 pr-12 py-2 text-xs text-[#1F1E1B] dark:text-slate-200 placeholder-[#918B80] dark:placeholder-slate-500 transition-all outline-none"
          />
          {searchQuery ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#918B80] hover:text-[#1F1E1B] dark:text-slate-500 dark:hover:text-slate-300 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-[#E5DFD5] dark:border-indigo-500/30 bg-[#FFFFFF] dark:bg-[#070A13] text-[10px] font-mono text-[#918B80] dark:text-cyan-400 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Export Agent Config Quick Button */}
        <button
          onClick={onExportAgentClick}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DFD5] dark:border-indigo-500/30 bg-[#FFFFFF] dark:bg-[#0D1424]/80 hover:bg-[#F3EFEA] dark:hover:bg-[#111B30] text-[#3D3B39] dark:text-slate-300 hover:text-[#1F1E1B] dark:hover:text-white text-xs font-medium transition-all shadow-sm"
          title="Export skills as an Agent configuration bundle"
        >
          <Download className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
          <span>Export Agent Config</span>
        </button>

        {/* Add Skill Button */}
        <button
          onClick={onAddSkillClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 dark:hover:brightness-110 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Skill</span>
        </button>

        {/* Theme Toggle (Claude Light / Gemini Dark Neon) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl border border-[#E5DFD5] dark:border-indigo-500/30 bg-[#FFFFFF] dark:bg-[#0D1424] hover:bg-[#F3EFEA] dark:hover:bg-[#111B30] text-[#C15F3C] dark:text-cyan-300 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all"
          aria-label={isDarkMode ? 'Switch to Claude Light mode' : 'Switch to Gemini Dark mode'}
          title={isDarkMode ? 'Switch to Claude Light mode' : 'Switch to Gemini Dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#C15F3C]" />
          )}
        </button>

        {/* User Account / Profile Dropdown with Per-User Registry Isolation */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-[#E5DFD5] dark:border-indigo-500/30 hover:border-[#D5CFC5] dark:hover:border-cyan-500/50 bg-[#FFFFFF] dark:bg-[#0D1424]/90 hover:bg-[#F3EFEA] dark:hover:bg-[#111B30] transition-all text-left shadow-sm"
            aria-expanded={showUserDropdown}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#C15F3C] to-[#D97706] dark:from-indigo-500 dark:to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden xl:block">
              <p className="text-xs font-semibold text-[#1F1E1B] dark:text-slate-200 leading-none truncate max-w-[120px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#645F57] dark:text-slate-400 leading-none mt-0.5 truncate max-w-[120px]">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-400" />
          </button>

          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/30 bg-[#FFFFFF] dark:bg-[#0D1424]/95 shadow-2xl dark:shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl p-3 z-50 text-xs">
                <div className="px-3 py-2 border-b border-[#E5DFD5] dark:border-slate-800/80 mb-2">
                  <p className="text-[11px] font-medium text-[#918B80] dark:text-slate-400 uppercase tracking-wider">
                    Active Registry Account
                  </p>
                  <p className="font-bold text-[#1F1E1B] dark:text-slate-100 text-sm mt-0.5">
                    {currentUser.name}
                  </p>
                  <p className="text-[#645F57] dark:text-slate-400 text-[11px] font-mono truncate">
                    {currentUser.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#C15F3C]/10 dark:bg-emerald-500/10 text-[#C15F3C] dark:text-emerald-400 border border-[#C15F3C]/20 dark:border-emerald-500/20 text-[10px] font-medium">
                    <UserCheck className="w-3 h-3" />
                    <span>Private Isolated Registry</span>
                  </div>
                </div>

                <div className="space-y-1 mb-2">
                  <p className="px-3 text-[10px] font-semibold text-[#918B80] dark:text-slate-500 uppercase tracking-wider">
                    Switch Account
                  </p>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-[#C15F3C]/10 dark:bg-indigo-600/15 text-[#C15F3C] dark:text-cyan-300 font-semibold border border-[#C15F3C]/25 dark:border-indigo-500/30'
                          : 'hover:bg-[#F3EFEA] dark:hover:bg-slate-900 text-[#3D3B39] dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-[#E5DFD5] dark:bg-slate-800 flex items-center justify-center text-[10px] text-[#1F1E1B] dark:text-slate-200">
                          {u.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs truncate">{u.name}</p>
                          <p className="text-[10px] text-[#918B80] dark:text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] text-[#C15F3C] dark:text-cyan-400 bg-[#C15F3C]/10 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E5DFD5] dark:border-slate-800/80">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onCreateUserClick();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#3D3B39] dark:text-slate-300 hover:text-[#C15F3C] dark:hover:text-cyan-300 hover:bg-[#F3EFEA] dark:hover:bg-slate-900 transition-colors text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
                    <span>Create new isolated account</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
