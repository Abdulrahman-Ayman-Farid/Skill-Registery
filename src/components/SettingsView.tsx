import { useState } from 'react';
import {
  Users,
  Database,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { User } from '../types/skill.ts';
import { useToast } from './Toast.tsx';

interface SettingsViewProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (userId: string) => void;
  onCreateUser: (name: string, email: string) => void;
  onResetSeed: () => void;
  totalSkills: number;
}

export function SettingsView({
  currentUser,
  users,
  onSwitchUser,
  onCreateUser,
  onResetSeed,
  totalSkills,
}: SettingsViewProps) {
  const { showToast } = useToast();
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    await onCreateUser(newUserName, newUserEmail);
    showToast('User Created', `Created and switched to account for ${newUserName}`);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUser(false);
  };

  return (
    <div className="space-y-8 max-w-4xl text-xs">
      <div>
        <h2 className="text-xl font-bold text-[#1F1E1B] dark:text-white tracking-tight">Registry Settings & Accounts</h2>
        <p className="text-xs text-[#645F57] dark:text-slate-400 mt-1">
          Manage isolated user registries, offline storage persistence, and runtime security.
        </p>
      </div>

      {/* Account Isolation Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C15F3C] dark:text-amber-400" />
            <h3 className="font-bold text-[#1F1E1B] dark:text-slate-100 text-sm">Per-User Data Isolation</h3>
          </div>

          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3EFEA] hover:bg-[#EAE4DC] dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a] text-[#1F1E1B] dark:text-slate-200 text-xs font-semibold border border-[#E5DFD5] dark:border-[#3a3a3a] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Account</span>
          </button>
        </div>

        <p className="text-[#645F57] dark:text-slate-400 leading-relaxed">
          Each account maintains a completely separate, private registry of skills. Skills added, edited, or deleted under one user do not affect other users.
        </p>

        {showAddUser && (
          <form
            onSubmit={handleCreateUserSubmit}
            className="p-4 rounded-xl border border-[#C15F3C]/30 dark:border-amber-500/30 bg-[#F8F5EF] dark:bg-[#0a0a0a]/80 space-y-3"
          >
            <h4 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-xs">Register New Account</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#645F57] dark:text-slate-400 font-medium">User Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#1a1a1a] border border-[#E5DFD5] dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-[#1F1E1B] dark:text-slate-100 focus:ring-2 focus:ring-[#C15F3C] dark:focus:ring-amber-400 mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#645F57] dark:text-slate-400 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@example.ai"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#FFFFFF] dark:bg-[#1a1a1a] border border-[#E5DFD5] dark:border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-[#1F1E1B] dark:text-slate-100 focus:ring-2 focus:ring-[#C15F3C] dark:focus:ring-amber-400 mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-3 py-1.5 rounded-lg text-[#645F57] hover:text-[#1F1E1B] dark:text-slate-400 dark:hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white font-semibold text-xs shadow-md shadow-[#C15F3C]/20"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* User list */}
        <div className="space-y-2">
          {users.map((u) => {
            const isCurrent = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors hover:bg-[#F8F5EF] dark:hover:bg-[#1f1f1f] ${
                  isCurrent
                    ? 'border-[#C15F3C]/40 bg-[#FAF8F5] dark:border-amber-500/40 dark:bg-amber-950/20 text-[#1F1E1B] dark:text-slate-100'
                    : 'border-[#E5DFD5] dark:border-[#2a2a2a] bg-[#FFFFFF] dark:bg-[#0a0a0a]/40 text-[#645F57] dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#C15F3C]/10 text-[#C15F3C] dark:bg-amber-600/30 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1F1E1B] dark:text-slate-200">{u.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                          Active Session
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#918B80] dark:text-slate-500">{u.email}</span>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => {
                      onSwitchUser(u.id);
                      showToast('Switched Account', `Logged in as ${u.name}`);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#F3EFEA] hover:bg-[#C15F3C] hover:text-white dark:bg-[#1f1f1f] dark:hover:bg-amber-600 dark:hover:text-white text-[#3D3B39] dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    Switch to this account
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Storage Health & Maintenance */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-[#1F1E1B] dark:text-slate-100 text-sm">Storage & Maintenance</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a]">
            <p className="text-[#645F57] dark:text-slate-400 text-[11px]">Personal Skills</p>
            <p className="font-mono text-lg font-bold text-[#1F1E1B] dark:text-slate-100 mt-1">{totalSkills}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a]">
            <p className="text-[#645F57] dark:text-slate-400 text-[11px]">Storage Engine</p>
            <p className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">Indexed / LocalStorage</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0a0a0a] border border-[#E5DFD5] dark:border-[#3a3a3a]">
            <p className="text-[#645F57] dark:text-slate-400 text-[11px]">Seed Status</p>
            <p className="font-mono text-xs font-semibold text-[#1F1E1B] dark:text-slate-200 mt-1">12 Production Starters</p>
          </div>
        </div>

        <div className="pt-3 border-t border-[#EFEAE2] dark:border-[#2a2a2a] flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#1F1E1B] dark:text-slate-200 text-xs">Restore Starter Catalog</p>
            <p className="text-[11px] text-[#645F57] dark:text-slate-400">
              Re-seeds your account with the 12 official starter skills (Web Search, SQL, RAG, etc.).
            </p>
          </div>

          <button
            onClick={() => {
              onResetSeed();
              showToast('Restored Starter Skills', 'Registry reset to the 12 starter skills.');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3EFEA] hover:bg-[#EAE4DC] dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a] text-[#1F1E1B] dark:text-slate-300 font-semibold border border-[#E5DFD5] dark:border-[#3a3a3a] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Starters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
