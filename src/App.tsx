import { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Download,
  Search,
  Grid,
  List,
  ArrowUpDown,
  Star,
  ExternalLink,
  X,
  Code2,
  ChevronDown,
  Network,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  Skill,
  User,
  SkillCategory,
  ExecutionType,
  SkillStatus,
  MarketplaceSource,
  SkillConfig,
} from './types/skill.ts';
import { storageService } from './services/storageService.ts';
import { MARKETPLACE_SKILLS } from './data/marketplaceSkills.ts';
import { VALID_CATEGORIES, VALID_EXECUTION_TYPES } from './utils/validation.ts';

import { ToastProvider, useToast } from './components/Toast.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar, NavigationTab } from './components/Sidebar.tsx';
import { SkillCard } from './components/SkillCard.tsx';
import { SkillTable } from './components/SkillTable.tsx';
import { SkillDetailModal } from './components/SkillDetailModal.tsx';
import { SkillEditorModal } from './components/SkillEditorModal.tsx';
import { MarketplaceInstallModal } from './components/MarketplaceInstallModal.tsx';
import { AgentExportModal } from './components/AgentExportModal.tsx';
import { AgentDependencyGraph } from './components/AgentDependencyGraph.tsx';
import { CategoriesView } from './components/CategoriesView.tsx';
import { ImportExportView } from './components/ImportExportView.tsx';
import { DocumentationView } from './components/DocumentationView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

function MainApp() {
  const { showToast } = useToast();

  // Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skill_registry_theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('skill_registry_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('skill_registry_theme', 'light');
    }
  }, [isDarkMode]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavigationTab>('registry');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // User State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(() => ({
    id: '',
    name: '',
    email: '',
    role: 'Developer',
  }));

  // Skills State (Personal Registry)
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data & skills
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      // storageService is localStorage-backed and synchronous; await to keep the
      // async contract so a spinner can render while data loads.
      const allUsers = await Promise.resolve(storageService.getUsers());
      const active = await Promise.resolve(storageService.getCurrentUser());
      const userSkills = await Promise.resolve(storageService.getSkills(active.id));
      setUsers(allUsers);
      setCurrentUser(active);
      setSkills(userSkills);
    } catch (err) {
      console.error('Failed to load user data:', err);
      showToast('Load Failed', 'Could not load your registry data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleSwitchUser = async (userId: string) => {
    const updatedUser = await storageService.setCurrentUser(userId);
    setCurrentUser(updatedUser);
    const userSkills = await storageService.getSkills(userId);
    setSkills(userSkills);
    setSelectedSkillIds([]);
    showToast('Switched Account', `Logged into private registry for ${updatedUser.name}`);
  };

  const handleCreateUser = async (name: string, email: string) => {
    await storageService.createUser(name, email);
    await loadUserData();
  };

  // Search & Filters for "My Registry"
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<SkillCategory | 'All'>('All');
  const [filterExecutionType, setFilterExecutionType] = useState<ExecutionType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<SkillStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'category' | 'version'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Multi-Selection for Agent Export
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Marketplace Filters
  const [mktSearch, setMktSearch] = useState('');
  const [mktSource, setMktSource] = useState<MarketplaceSource | 'All'>('All');
  const [mktCategory, setMktCategory] = useState<SkillCategory | 'All'>('All');

  // Modals
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [editorSkill, setEditorSkill] = useState<Skill | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [marketplaceInstallSkill, setMarketplaceInstallSkill] = useState<Skill | null>(null);
  const [isAgentExportOpen, setIsAgentExportOpen] = useState(false);

  // Handlers for Registry CRUD
  const handleSaveSkill = async (saved: Skill) => {
    try {
      await storageService.saveSkill(saved);
      const refreshed = await storageService.getSkills(currentUser.id);
      setSkills(refreshed);
    } catch (err) {
      console.error('Failed to save skill:', err);
      showToast('Action Failed', 'Could not save the skill. Please try again.');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await storageService.deleteSkill(id, currentUser.id);
      const refreshed = await storageService.getSkills(currentUser.id);
      setSkills(refreshed);
      setSelectedSkillIds((prev) => prev.filter((i) => i !== id));
      showToast('Skill Deleted', 'Skill removed from your registry.');
    } catch (err) {
      console.error('Failed to delete skill:', err);
      showToast('Action Failed', 'Could not delete the skill. Please try again.');
    }
  };

  const handleDuplicateSkill = async (id: string) => {
    try {
      const duplicated = await storageService.duplicateSkill(id, currentUser.id);
      const refreshed = await storageService.getSkills(currentUser.id);
      setSkills(refreshed);
      showToast('Skill Duplicated', `Created "${duplicated.name}" in drafts.`);
    } catch (err) {
      console.error('Failed to duplicate skill:', err);
      showToast('Action Failed', 'Could not duplicate the skill. Please try again.');
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      const updated = await storageService.toggleArchiveSkill(id, currentUser.id);
      const refreshed = await storageService.getSkills(currentUser.id);
      setSkills(refreshed);
      showToast(
        updated.status === 'deprecated' ? 'Skill Archived' : 'Skill Activated',
        `"${updated.name}" is now ${updated.status}.`
      );
    } catch (err) {
      console.error('Failed to toggle archive state:', err);
      showToast('Action Failed', 'Could not update the archive state. Please try again.');
    }
  };

  const handleResetSeed = async () => {
    try {
      await storageService.resetUserSkillsToDefault(currentUser.id);
      const refreshed = await storageService.getSkills(currentUser.id);
      setSkills(refreshed);
      showToast('Registry Reset', 'Your registry has been restored to the default starter skills.');
    } catch (err) {
      console.error('Failed to reset registry:', err);
      showToast('Action Failed', 'Could not reset the registry. Please try again.');
    }
  };

  const handleInstallMarketplaceSkill = async (
    mktSkill: Skill,
    customConfig: Partial<SkillConfig>
  ) => {
    try {
      const installed = await storageService.installMarketplaceSkill(
        mktSkill,
        customConfig,
        currentUser.id
      );
      const refreshed = await storageService.getSkills(currentUser.id);
      setSkills(refreshed);
      showToast('Installed to Registry', `"${installed.name}" copied to your personal registry.`);
      setActiveTab('registry');
    } catch (err) {
      console.error('Failed to install marketplace skill:', err);
      showToast('Action Failed', 'Could not install the skill. Please try again.');
    }
  };

  // Selection handlers
  const handleToggleSelectSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllSkills = () => {
    if (selectedSkillIds.length === filteredSkills.length) {
      setSelectedSkillIds([]);
    } else {
      setSelectedSkillIds(filteredSkills.map((s) => s.id));
    }
  };

  const handleUpdateSkillDependencies = async (skillId: string, newDependencies: string[]) => {
    const target = skills.find((s) => s.id === skillId);
    if (!target) return;
    const updated: Skill = {
      ...target,
      dependencies: newDependencies,
      updatedAt: new Date().toISOString(),
    };
    await storageService.saveSkill(updated);
    const refreshed = await storageService.getSkills(currentUser.id);
    setSkills(refreshed);
    showToast('Dependencies Updated', `Updated dependency links for "${target.name}".`);
  };

  // Filtered Skills for "My Registry"
  const filteredSkills = useMemo(() => {
    return skills
      .filter((skill) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = skill.name.toLowerCase().includes(q);
          const matchDesc = skill.description.toLowerCase().includes(q);
          const matchCat = skill.category.toLowerCase().includes(q);
          const matchTags = skill.tags?.some((t) => t.toLowerCase().includes(q));
          const matchParams = skill.inputSchema?.some((p) => p.name.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchCat && !matchTags && !matchParams) {
            return false;
          }
        }

        // Category filter
        if (filterCategory !== 'All' && skill.category !== filterCategory) {
          return false;
        }

        // Execution type filter
        if (filterExecutionType !== 'All' && skill.executionType !== filterExecutionType) {
          return false;
        }

        // Status filter
        if (filterStatus !== 'All' && skill.status !== filterStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'category') {
          comparison = a.category.localeCompare(b.category);
        } else if (sortBy === 'version') {
          comparison = a.version.localeCompare(b.version);
        } else {
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [skills, searchQuery, filterCategory, filterExecutionType, filterStatus, sortBy, sortOrder]);

  // Filtered Marketplace Skills
  const filteredMarketplaceSkills = useMemo(() => {
    return MARKETPLACE_SKILLS.filter((s) => {
      if (mktSearch.trim()) {
        const q = mktSearch.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchTags = s.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchTags) return false;
      }
      if (mktSource !== 'All' && s.source !== mktSource) return false;
      if (mktCategory !== 'All' && s.category !== mktCategory) return false;
      return true;
    });
  }, [mktSearch, mktSource, mktCategory]);

  const handleRevertVersion = async (skillId: string, versionId: string) => {
    const reverted = await storageService.revertSkillVersion(skillId, versionId, currentUser.id);
    const refreshed = await storageService.getSkills(currentUser.id);
    setSkills(refreshed);
    setDetailSkill(reverted);
    showToast('Version Reverted', `Reverted "${reverted.name}" to version ${reverted.version}.`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0a0a0a] text-[#1F1E1B] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onCreateUserClick={() => setActiveTab('settings')}
        onAddSkillClick={() => {
          setEditorSkill(null);
          setIsEditorOpen(true);
        }}
        onExportAgentClick={() => setIsAgentExportOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onToggleMobileSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          registryCount={skills.length}
          marketplaceCount={MARKETPLACE_SKILLS.length}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          onResetSeed={handleResetSeed}
        />

        {/* Main Content Area */}
        <main className="ml-0 lg:ml-64 pt-16 flex-1 overflow-y-auto p-4 lg:p-6 bg-transparent transition-all">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4" role="status" aria-live="polite">
              <div className="w-10 h-10 rounded-full border-4 border-[#E5DFD5] dark:border-amber-500/25 border-t-[#C15F3C] dark:border-t-amber-400 animate-spin" />
              <p className="text-xs font-medium text-[#645F57] dark:text-slate-400">Loading your registry…</p>
            </div>
          )}
          {/* TAB 1: MY REGISTRY */}
          {activeTab === 'registry' && !isLoading && (
            <div className="space-y-6">
              {/* Header Title & Quick Count */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F1E1B] dark:text-white tracking-tight">
                      My Skill Registry
                    </h1>
                    <span className="text-[#918B80] dark:text-slate-600 font-light">•</span>
                    <span className="font-mono text-xs text-[#645F57] dark:text-slate-400">
                      {skills.length} available
                    </span>
                  </div>
                  <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1">
                    Manage, test, and export reusable capabilities for autonomous agents.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditorSkill(null);
                      setIsEditorOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-amber-600 dark:via-amber-500 dark:to-orange-500 dark:hover:brightness-110 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Custom Skill</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar & View Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1a1a1a] border border-[#E5DFD5] dark:border-amber-500/25 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs claude-card-shadow dark:shadow-[0_0_25px_rgba(0,0,0,0.5)]">
                {/* Left filter controls */}
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as any)}
                      className="appearance-none bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a] rounded-xl pl-3 pr-8 py-1.5 text-[#1F1E1B] dark:text-slate-200 outline-none focus:border-[#C15F3C] dark:focus:border-amber-500 font-medium text-xs cursor-pointer shadow-xs"
                    >
                      <option value="All">All Categories</option>
                      {VALID_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Execution Type Filter */}
                  <div className="relative">
                    <select
                      value={filterExecutionType}
                      onChange={(e) => setFilterExecutionType(e.target.value as any)}
                      className="appearance-none bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a] rounded-xl pl-3 pr-8 py-1.5 text-[#1F1E1B] dark:text-slate-200 outline-none focus:border-[#C15F3C] dark:focus:border-amber-500 font-medium text-xs cursor-pointer shadow-xs"
                    >
                      <option value="All">All Execution Types</option>
                      {VALID_EXECUTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="appearance-none bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a] rounded-xl pl-3 pr-8 py-1.5 text-[#1F1E1B] dark:text-slate-200 outline-none focus:border-[#C15F3C] dark:focus:border-amber-500 font-medium text-xs cursor-pointer shadow-xs"
                    >
                      <option value="All">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {(filterCategory !== 'All' ||
                    filterExecutionType !== 'All' ||
                    filterStatus !== 'All' ||
                    searchQuery) && (
                    <button
                      onClick={() => {
                        setFilterCategory('All');
                        setFilterExecutionType('All');
                        setFilterStatus('All');
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#C15F3C] hover:text-[#A84E2E] dark:text-amber-400 dark:hover:text-amber-300 font-semibold px-2 py-1 rounded-lg bg-[#C15F3C]/10 dark:bg-amber-500/10 border border-[#C15F3C]/20 dark:border-amber-400/30 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}

                  <span className="text-[11px] text-[#918B80] dark:text-slate-500 ml-auto lg:ml-2">
                    Showing <strong className="text-[#1F1E1B] dark:text-slate-200">{filteredSkills.length}</strong> of {skills.length}
                  </span>
                </div>

                {/* Right sort & view switches */}
                <div className="flex items-center gap-2 justify-between lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#EFEAE2] dark:border-[#3a3a3a]">
                  <div className="flex items-center gap-1.5 text-[#645F57] dark:text-slate-400 text-xs">
                    <span className="hidden sm:inline">Sort:</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="appearance-none bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a] rounded-xl pl-2.5 pr-7 py-1.5 text-[#1F1E1B] dark:text-slate-200 outline-none text-xs font-medium cursor-pointer shadow-xs"
                      >
                        <option value="updated">Recently Updated</option>
                        <option value="name">Name</option>
                        <option value="category">Category</option>
                        <option value="version">Version</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a] text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200 shadow-xs transition-colors"
                      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Grid vs Table View Toggle */}
                  <div className="flex rounded-xl bg-[#F3EFEA] dark:bg-[#0a0a0a] p-0.5 border border-[#E5DFD5] dark:border-[#3a3a3a] shadow-xs">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white shadow-xs'
                          : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                      }`}
                      title="Grid View"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'table'
                          ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white shadow-xs'
                          : 'text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200'
                      }`}
                      title="Table View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Batch Action Banner (when skills are selected) */}
              {selectedSkillIds.length > 0 && (
                <div className="p-3 px-4 rounded-xl bg-[#C15F3C]/10 dark:bg-amber-950/40 border border-[#C15F3C]/25 dark:border-amber-400/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#C15F3C] dark:text-amber-300">
                      {selectedSkillIds.length} skill(s) selected
                    </span>
                    <span className="text-[#918B80] dark:text-slate-500">•</span>
                    <button
                      onClick={() => setSelectedSkillIds([])}
                      className="text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200 text-[11px]"
                    >
                      Deselect all
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAgentExportOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white font-semibold transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export {selectedSkillIds.length} Skills as Agent Tools</span>
                  </button>
                </div>
              )}

              {/* Skills Display (Grid or Table) */}
              {filteredSkills.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-[#E5DFD5] dark:border-amber-500/25 bg-[#FFFFFF] dark:bg-[#1a1a1a] space-y-3 claude-card-shadow dark:shadow-[0_0_25px_rgba(0,0,0,0.5)]">
                  <div className="w-12 h-12 rounded-2xl bg-[#C15F3C]/10 dark:bg-amber-500/10 text-[#C15F3C] dark:text-amber-400 flex items-center justify-center mx-auto border border-[#C15F3C]/20 dark:border-amber-500/30">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#1F1E1B] dark:text-slate-200">No matching skills found</h3>
                  <p className="text-xs text-[#645F57] dark:text-slate-400 max-w-sm mx-auto">
                    No skills matched your search criteria or category filter. Try clearing filters or create a new custom skill.
                  </p>
                  <button
                    onClick={() => {
                      setFilterCategory('All');
                      setFilterExecutionType('All');
                      setFilterStatus('All');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F3EFEA] hover:bg-[#EAE4DC] dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a] text-[#1F1E1B] dark:text-slate-200 text-xs font-semibold border border-[#E5DFD5] dark:border-[#3a3a3a] transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSkills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      isSelected={selectedSkillIds.includes(skill.id)}
                      onToggleSelect={handleToggleSelectSkill}
                      onViewDetails={setDetailSkill}
                      onEdit={(s) => {
                        setEditorSkill(s);
                        setIsEditorOpen(true);
                      }}
                      onDuplicate={handleDuplicateSkill}
                      onToggleArchive={handleToggleArchive}
                      onDelete={handleDeleteSkill}
                    />
                  ))}
                </div>
              ) : (
                <SkillTable
                  skills={filteredSkills}
                  selectedIds={selectedSkillIds}
                  onToggleSelect={handleToggleSelectSkill}
                  onSelectAll={handleSelectAllSkills}
                  onViewDetails={setDetailSkill}
                  onEdit={(s) => {
                    setEditorSkill(s);
                    setIsEditorOpen(true);
                  }}
                  onDuplicate={handleDuplicateSkill}
                  onToggleArchive={handleToggleArchive}
                  onDelete={handleDeleteSkill}
                />
              )}
            </div>
          )}

          {/* TAB 2: SKILL LIBRARY / MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F1E1B] dark:text-white tracking-tight">
                    Pre-Built Skill Marketplace
                  </h1>
                  <span className="text-[#918B80] dark:text-slate-600 font-light">•</span>
                  <span className="font-mono text-xs text-[#C15F3C] dark:text-amber-400">
                    Curated Ecosystem
                  </span>
                </div>
                <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1">
                  Verified tools and connectors from GitHub, Hugging Face, LangChain, LlamaIndex, OpenAI, Anthropic, Google Cloud, and MCP servers.
                </p>
              </div>

              {/* Source Filters Bar */}
              <div className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1a1a1a] border border-[#E5DFD5] dark:border-amber-500/25 space-y-3 text-xs claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-[#645F57] dark:text-slate-400 uppercase tracking-wider">
                    Ecosystem Source:
                  </span>
                  {(
                    [
                      'All',
                      'GitHub',
                      'Hugging Face',
                      'LangChain',
                      'LlamaIndex',
                      'OpenAI',
                      'Anthropic',
                      'Google Cloud',
                      'MCP',
                    ] as const
                  ).map((source) => (
                    <button
                      key={source}
                      onClick={() => setMktSource(source)}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        mktSource === source
                          ? 'bg-[#C15F3C] dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white shadow-sm'
                          : 'bg-[#F8F5EF] dark:bg-[#0a0a0a] text-[#645F57] dark:text-slate-400 hover:text-[#1F1E1B] dark:hover:text-slate-200 border border-[#E5DFD5] dark:border-[#3a3a3a]'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search curated skills..."
                      value={mktSearch}
                      onChange={(e) => setMktSearch(e.target.value)}
                      className="w-full bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1F1E1B] dark:text-slate-200 outline-none focus:border-[#C15F3C] dark:focus:border-amber-500"
                    />
                  </div>

                  <div className="relative shrink-0">
                    <select
                      value={mktCategory}
                      onChange={(e) => setMktCategory(e.target.value as any)}
                      className="appearance-none bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a] rounded-xl pl-3 pr-8 py-1.5 text-[#1F1E1B] dark:text-slate-200 outline-none text-xs font-medium cursor-pointer shadow-xs"
                    >
                      <option value="All">All Categories</option>
                      {VALID_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#918B80] dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Marketplace Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMarketplaceSkills.map((mktSkill) => (
                  <div
                    key={mktSkill.id}
                    className="rounded-2xl border border-[#E5DFD5] dark:border-amber-500/25 bg-[#FFFFFF] dark:bg-[#1a1a1a] p-5 flex flex-col justify-between hover:border-[#C15F3C]/40 dark:hover:border-amber-400/50 transition-all claude-card-shadow dark:hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
                  >
                    <div>
                      {/* Clean kicker: Source • Category • Stars */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-[#645F57] dark:text-slate-400 flex-wrap">
                          <span className="font-semibold text-[#C15F3C] dark:text-amber-300">
                            {mktSkill.source}
                          </span>
                          <span className="text-[#918B80] dark:text-slate-600">•</span>
                          <span className="font-semibold uppercase tracking-wider text-[#1F1E1B] dark:text-slate-300 text-[11px]">
                            {mktSkill.category}
                          </span>
                          <span className="text-[#918B80] dark:text-slate-600">•</span>
                          <span className="font-mono text-[11px] text-[#645F57] dark:text-slate-400">
                            {mktSkill.executionType}
                          </span>
                        </div>

                        {mktSkill.stars && (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-amber-500 dark:text-amber-400 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{mktSkill.stars.toLocaleString()}</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm text-[#1F1E1B] group-hover:text-[#C15F3C] dark:text-slate-100 dark:group-hover:text-amber-300 transition-colors mb-2">
                        {mktSkill.name}
                      </h3>

                      <p className="text-xs text-[#645F57] dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {mktSkill.description}
                      </p>

                      {/* Required Credentials warning if any */}
                      {mktSkill.requiredCredentials && mktSkill.requiredCredentials.length > 0 && (
                        <div className="mb-3 text-[11px] font-mono text-amber-700 dark:text-amber-300/90 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">Key required:</span>
                          <span>{mktSkill.requiredCredentials.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-[#EFEAE2] dark:border-[#3a3a3a] flex items-center justify-between">
                      {mktSkill.docUrl ? (
                        <a
                          href={mktSkill.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1"
                        >
                          <span>Docs</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#918B80] dark:text-slate-500">{mktSkill.source}</span>
                      )}

                      <button
                        onClick={() => setMarketplaceInstallSkill(mktSkill)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>Install to Registry</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <CategoriesView
              skills={skills}
              onSelectCategoryFilter={(cat) => {
                setFilterCategory(cat);
                setActiveTab('registry');
              }}
            />
          )}

          {/* TAB 4: AGENT STUDIO */}
          {activeTab === 'agent-studio' && (
            <div className="space-y-6">
              {/* Studio Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F1E1B] dark:text-white tracking-tight flex items-center gap-2">
                    <Network className="w-6 h-6 text-[#C15F3C] dark:text-amber-400" />
                    <span>Agent Studio & Skill Dependency Graph</span>
                  </h1>
                  <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1 max-w-3xl">
                    Interactive D3 force-directed visualization to inspect tool prerequisites, highlight circular dependency cycles, analyze shared credentials and parameters, and bundle production agent configurations.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAgentExportOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-amber-600 dark:via-amber-500 dark:to-orange-500 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      Export Config Package{' '}
                      <span className="opacity-90 font-mono text-[11px]">
                        ({selectedSkillIds.length > 0 ? selectedSkillIds.length : skills.length})
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Selection Control & Graph Scope Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#E5DFD5] dark:border-amber-500/25 bg-[#FFFFFF] dark:bg-[#1a1a1a] text-xs claude-card-shadow">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#1F1E1B] dark:text-slate-200">
                    Graph Scope:
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a] text-[11px] font-mono text-[#C15F3C] dark:text-amber-400 font-bold">
                    {selectedSkillIds.length > 0
                      ? `${selectedSkillIds.length} Selected Skills`
                      : `All ${skills.length} Registry Skills`}
                  </span>
                  <span className="text-[11px] text-[#645F57] dark:text-slate-400 hidden md:inline">
                    {selectedSkillIds.length > 0
                      ? 'Graph is filtered to your active selection.'
                      : 'Select skills below to isolate a specific agent subsystem.'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedSkillIds(skills.map((s) => s.id))}
                    className="px-3 py-1.5 rounded-xl border border-[#E5DFD5] dark:border-[#3a3a3a] bg-[#F8F5EF] dark:bg-[#0a0a0a] hover:border-[#C15F3C] dark:hover:border-amber-500 text-[11px] font-semibold text-[#1F1E1B] dark:text-slate-300 transition-colors"
                  >
                    Select All ({skills.length})
                  </button>
                  {selectedSkillIds.length > 0 && (
                    <button
                      onClick={() => setSelectedSkillIds([])}
                      className="px-3 py-1.5 rounded-xl border border-[#E5DFD5] dark:border-[#3a3a3a] bg-[#F8F5EF] dark:bg-[#0a0a0a] hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-400 text-[11px] font-semibold text-rose-600 dark:text-rose-400 transition-colors"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* D3 FORCE-DIRECTED GRAPH VISUALIZER */}
              <AgentDependencyGraph
                skills={skills}
                selectedSkillIds={selectedSkillIds}
                onToggleSelectSkill={handleToggleSelectSkill}
                onUpdateSkillDependencies={handleUpdateSkillDependencies}
                isDarkMode={isDarkMode}
              />

              {/* Workflow Guidance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-[#E5DFD5] dark:border-amber-500/25 bg-[#FFFFFF] dark:bg-[#1a1a1a] space-y-2 claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="w-8 h-8 rounded-lg bg-[#C15F3C]/10 text-[#C15F3C] dark:bg-amber-500/15 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-xs">Compose & Validate Graph</h3>
                  <p className="text-[11px] text-[#645F57] dark:text-slate-400 leading-relaxed">
                    Check specific skills below or click nodes on the interactive canvas to resolve prerequisites and eliminate recursive loops.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#E5DFD5] dark:border-amber-500/25 bg-[#FFFFFF] dark:bg-[#1a1a1a] space-y-2 claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:bg-purple-500/15 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-xs">Choose Target Framework</h3>
                  <p className="text-[11px] text-[#645F57] dark:text-slate-400 leading-relaxed">
                    Seamlessly exports to OpenAI Tools, Anthropic Claude Tool Calling, Gemini FunctionDeclarations, or Model Context Protocol.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#E5DFD5] dark:border-amber-500/25 bg-[#FFFFFF] dark:bg-[#1a1a1a] space-y-2 claude-card-shadow dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-xs">Instant Agent Import</h3>
                  <p className="text-[11px] text-[#645F57] dark:text-slate-400 leading-relaxed">
                    Download <code className="text-emerald-700 dark:text-emerald-300 font-mono">agent-tools.json</code> or copy directly into your orchestration server.
                  </p>
                </div>
              </div>

              {/* Interactive Skill Selection & Dependency Matrix */}
              <div className="p-6 rounded-2xl border border-[#E5DFD5] dark:border-amber-500/25 bg-[#FFFFFF] dark:bg-[#1a1a1a] space-y-4 claude-card-shadow">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-[#1F1E1B] dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-[#C15F3C] dark:text-amber-400" />
                    <span>Skills Selection & Dependency Links ({skills.length})</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#645F57] dark:text-slate-400">
                      Click card to toggle selection for Agent Bundle
                    </span>
                    <button
                      onClick={() => setIsAgentExportOpen(true)}
                      className="text-xs font-semibold text-[#C15F3C] hover:text-[#A84E2E] dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      Open Exporter Modal →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {skills.map((skill) => {
                    const isSelected = selectedSkillIds.includes(skill.id);
                    const depCount = skill.dependencies?.length || 0;
                    return (
                      <div
                        key={skill.id}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'border-[#C15F3C] dark:border-amber-400 bg-[#C15F3C]/5 dark:bg-amber-500/10 shadow-xs'
                            : 'border-[#E5DFD5] dark:border-[#3a3a3a] bg-[#F8F5EF] dark:bg-[#0a0a0a] hover:border-[#C15F3C]/50 dark:hover:border-amber-400/50'
                        }`}
                        onClick={() => handleToggleSelectSkill(skill.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectSkill(skill.id);
                              }}
                              className="mt-0.5 text-[#C15F3C] dark:text-amber-400 shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4 text-[#918B80] dark:text-slate-600" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[#1F1E1B] dark:text-white truncate">
                                {skill.name}
                              </p>
                              <p className="text-[10px] text-[#645F57] dark:text-slate-400 line-clamp-1 mt-0.5">
                                {skill.description}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailSkill(skill);
                            }}
                            className="p-1 rounded-lg text-[#918B80] hover:text-[#1F1E1B] dark:text-slate-500 dark:hover:text-slate-200 hover:bg-[#E5DFD5]/50 dark:hover:bg-slate-800 transition-colors shrink-0"
                            title="Inspect Skill Details"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-[#EFEAE2] dark:border-[#3a3a3a]">
                          <span className="font-mono text-[#645F57] dark:text-slate-400 uppercase">
                            {skill.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {depCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#EFEAE2] dark:bg-[#1f1f1f] font-mono font-medium text-[#1F1E1B] dark:text-amber-300">
                                {depCount} {depCount === 1 ? 'Prereq' : 'Prereqs'}
                              </span>
                            ) : (
                              <span className="text-[#918B80] dark:text-slate-600 font-mono">
                                Independent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: IMPORT / EXPORT */}
          {activeTab === 'import-export' && (
            <ImportExportView
              skills={skills}
              userId={currentUser.id}
              onRefreshSkills={loadUserData}
            />
          )}

          {/* TAB 6: DOCUMENTATION */}
          {activeTab === 'docs' && <DocumentationView />}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              users={users}
              onSwitchUser={handleSwitchUser}
              onCreateUser={handleCreateUser}
              onResetSeed={handleResetSeed}
              totalSkills={skills.length}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Skill Detail & Inspector Modal */}
      {detailSkill && (
        <SkillDetailModal
          skill={detailSkill}
          onClose={() => setDetailSkill(null)}
          onEdit={(s) => {
            setDetailSkill(null);
            setEditorSkill(s);
            setIsEditorOpen(true);
          }}
          onDuplicate={(id) => {
            handleDuplicateSkill(id);
            setDetailSkill(null);
          }}
          onToggleArchive={(id) => {
            handleToggleArchive(id);
            setDetailSkill(null);
          }}
          onDelete={handleDeleteSkill}
          onRevertVersion={handleRevertVersion}
        />
      )}

      {/* 2. Skill Editor (Add / Edit) Modal */}
      {isEditorOpen && (
        <SkillEditorModal
          initialSkill={editorSkill}
          currentUserId={currentUser.id}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditorSkill(null);
          }}
          onSave={handleSaveSkill}
        />
      )}

      {/* 3. Marketplace Pre-Install Modal */}
      {marketplaceInstallSkill && (
        <MarketplaceInstallModal
          skill={marketplaceInstallSkill}
          isOpen={Boolean(marketplaceInstallSkill)}
          onClose={() => setMarketplaceInstallSkill(null)}
          onInstall={handleInstallMarketplaceSkill}
        />
      )}

      {/* 4. Agent Schema Export Modal */}
      {isAgentExportOpen && (
        <AgentExportModal
          skills={skills}
          initialSelectedIds={selectedSkillIds}
          isOpen={isAgentExportOpen}
          onClose={() => setIsAgentExportOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ErrorBoundary>
  );
}
