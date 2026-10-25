import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Check,
  User,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { SkillVersionSnapshot, Skill } from '../types/skill.ts';
import { detectSkillChanges } from '../utils/versionHistory.ts';
import { useToast } from './Toast.tsx';

interface VersionHistoryTimelineProps {
  history: SkillVersionSnapshot[];
  currentSkill: Partial<Skill>;
  onRevertToSnapshot: (snapshot: SkillVersionSnapshot) => void;
}

export function VersionHistoryTimeline({
  history,
  currentSkill,
  onRevertToSnapshot,
}: VersionHistoryTimelineProps) {
  const { showToast } = useToast();
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    history[0]?.versionId || null
  );
  const [confirmRevertId, setConfirmRevertId] = useState<string | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-[#E5DFD5] dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-900/40 text-xs text-[#645F57] dark:text-slate-400 space-y-2 claude-card-shadow">
        <History className="w-8 h-8 text-[#918B80] dark:text-slate-600 mx-auto" />
        <p className="font-semibold text-[#1F1E1B] dark:text-slate-300">No version history yet</p>
        <p className="text-[#918B80] dark:text-slate-500">
          Version snapshots will automatically be tracked as you edit and save changes to this skill.
        </p>
      </div>
    );
  }

  const selectedSnapshot =
    history.find((h) => h.versionId === selectedSnapshotId) || history[0];

  // Compute differences between current skill and selected snapshot
  const diffs = selectedSnapshot
    ? detectSkillChanges(selectedSnapshot.skillState, currentSkill)
    : [];

  const handleConfirmRevert = (snapshot: SkillVersionSnapshot) => {
    onRevertToSnapshot(snapshot);
    setConfirmRevertId(null);
    showToast(
      'Reverted Version',
      `Restored skill definition to version ${snapshot.version} from ${new Date(
        snapshot.timestamp
      ).toLocaleDateString()}.`
    );
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#1F1E1B] dark:text-slate-200 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-[#C15F3C] dark:text-cyan-400" />
            <span>Version History Timeline</span>
          </h3>
          <p className="text-[#645F57] dark:text-slate-400 text-xs mt-0.5">
            Compare past snapshots stored in metadata and revert to any prior state.
          </p>
        </div>

        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F8F5EF] dark:bg-slate-900 border border-[#E5DFD5] dark:border-slate-800 text-[#3D3B39] dark:text-slate-300">
          {history.length} snapshot{history.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Timeline list */}
        <div className="lg:col-span-5 space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {history.map((snapshot, index) => {
            const isSelected = selectedSnapshot?.versionId === snapshot.versionId;
            const isLatest = index === 0;
            const isCurrentMatch = snapshot.version === currentSkill.version;

            return (
              <button
                key={snapshot.versionId}
                type="button"
                onClick={() => setSelectedSnapshotId(snapshot.versionId)}
                aria-label={`Snapshot v${snapshot.version}: ${snapshot.changeSummary}`}
                aria-pressed={isSelected}
                className={`relative w-full text-left p-3.5 rounded-2xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C15F3C] dark:focus-visible:ring-cyan-500 ${
                  isSelected
                    ? 'border-[#C15F3C] bg-[#FAF8F5] ring-2 ring-[#C15F3C]/20 dark:border-cyan-400 dark:bg-indigo-950/30 dark:ring-2 dark:ring-cyan-500/30'
                    : 'border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] hover:bg-[#F8F5EF] dark:hover:bg-[#111B30] hover:border-[#C15F3C]/40 dark:hover:border-cyan-400/50 claude-card-shadow'
                }`}
              >
                {/* Timeline connector visual */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-[#C15F3C]/10 text-[#C15F3C] border border-[#C15F3C]/25 dark:bg-indigo-500/15 dark:text-cyan-300 dark:border-indigo-500/30">
                      v{snapshot.version}
                    </span>

                    {isCurrentMatch && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        <span>Current</span>
                      </span>
                    )}

                    {isLatest && !isCurrentMatch && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F8F5EF] dark:bg-slate-800 text-[#645F57] dark:text-slate-400 border border-[#E5DFD5] dark:border-slate-700">
                        Latest Save
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-[#918B80] dark:text-slate-500">
                    {new Date(snapshot.timestamp).toLocaleDateString()}
                  </span>
                </div>

                {/* Change summary */}
                <p className="text-[#1F1E1B] dark:text-slate-300 text-xs font-medium line-clamp-2 mt-1">
                  {snapshot.changeSummary}
                </p>

                {/* Author & Meta */}
                <div className="mt-2.5 pt-2 border-t border-[#EFEAE2] dark:border-slate-800/60 flex items-center justify-between text-[11px] text-[#918B80] dark:text-slate-500">
                  <span className="flex items-center gap-1 text-[#645F57] dark:text-slate-400">
                    <User className="w-3 h-3 text-[#918B80] dark:text-slate-500" />
                    <span>{snapshot.author}</span>
                  </span>

                  <span className="font-mono text-[10px] text-[#918B80] dark:text-slate-500">
                    {snapshot.skillState.inputSchema?.length || 0} params • {snapshot.skillState.executionType}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Snapshot Detail & Comparison */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E5DFD5] dark:border-indigo-500/25 bg-[#FFFFFF] dark:bg-[#0D1424] p-5 space-y-4 claude-card-shadow dark:shadow-[0_0_25px_rgba(0,0,0,0.5)]">
          {selectedSnapshot ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2] dark:border-slate-800/80 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#C15F3C] dark:text-cyan-300 text-sm">
                      Snapshot: v{selectedSnapshot.version}
                    </span>
                    <span className="text-xs text-[#918B80] dark:text-slate-400">
                      ({new Date(selectedSnapshot.timestamp).toLocaleString()})
                    </span>
                  </div>
                  <p className="text-[#645F57] dark:text-slate-400 text-xs mt-0.5">
                    Recorded by <span className="text-[#1F1E1B] dark:text-slate-300 font-medium">{selectedSnapshot.author}</span>
                  </p>
                </div>

                {/* Revert Action Button */}
                {confirmRevertId === selectedSnapshot.versionId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Confirm revert?</span>
                    </span>
                    <button
                      onClick={() => handleConfirmRevert(selectedSnapshot)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                    >
                      Yes, Revert
                    </button>
                    <button
                      onClick={() => setConfirmRevertId(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-slate-800 hover:bg-[#EFEAE2] dark:hover:bg-slate-700 text-[#3D3B39] dark:text-slate-300 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRevertId(selectedSnapshot.versionId)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-[#C15F3C]/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert to this Version</span>
                  </button>
                )}
              </div>

              {/* Summary note */}
              <div className="p-3 rounded-xl bg-[#F8F5EF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800">
                <span className="text-[10px] font-semibold text-[#918B80] dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Change Note:
                </span>
                <p className="text-[#1F1E1B] dark:text-slate-200 text-xs leading-relaxed">{selectedSnapshot.changeSummary}</p>
              </div>

              {/* Differences compared to current state */}
              <div>
                <h4 className="font-bold text-[#1F1E1B] dark:text-slate-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
                  <span>Changes between this Snapshot and Current State</span>
                </h4>

                {diffs.length === 0 ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>This snapshot matches the current editor definition.</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800 space-y-1.5">
                    {diffs.map((diff, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#1F1E1B] dark:text-slate-300 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C15F3C] dark:bg-cyan-400 shrink-0" />
                        <span>{diff}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Snapshot Parameters overview */}
              <div>
                <h4 className="font-bold text-[#1F1E1B] dark:text-slate-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#C15F3C] dark:text-cyan-400" />
                  <span>Parameters in v{selectedSnapshot.version} ({selectedSnapshot.skillState.inputSchema?.length || 0})</span>
                </h4>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedSnapshot.skillState.inputSchema?.map((p) => (
                    <div
                      key={p.name}
                      className="p-2 rounded-lg bg-[#F8F5EF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#C15F3C] dark:text-cyan-300 font-semibold">{p.name}</span>
                        <span className="font-mono text-[10px] text-[#645F57] dark:text-slate-400">({p.type})</span>
                        {p.required && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                            required
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#645F57] dark:text-slate-400 truncate max-w-xs">{p.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Snapshot Configuration */}
              <div className="p-3 rounded-xl bg-[#F8F5EF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800 text-[11px] text-[#645F57] dark:text-slate-400 grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-[#918B80] dark:text-slate-500">Execution: </span>
                  <span className="text-[#1F1E1B] dark:text-slate-200 font-semibold">{selectedSnapshot.skillState.executionType}</span>
                </div>
                <div>
                  <span className="text-[#918B80] dark:text-slate-500">Timeout: </span>
                  <span className="text-[#1F1E1B] dark:text-slate-200">{selectedSnapshot.skillState.config.timeoutMs}ms</span>
                </div>
                <div>
                  <span className="text-[#918B80] dark:text-slate-500">API Key: </span>
                  <span className="text-[#1F1E1B] dark:text-slate-200">{selectedSnapshot.skillState.config.apiKeyName || 'None'}</span>
                </div>
                <div>
                  <span className="text-[#918B80] dark:text-slate-500">Status: </span>
                  <span className="text-[#1F1E1B] dark:text-slate-200">{selectedSnapshot.skillState.status}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[#918B80] dark:text-slate-500 italic">Select a snapshot from the timeline to inspect.</p>
          )}
        </div>
      </div>
    </div>
  );
}
