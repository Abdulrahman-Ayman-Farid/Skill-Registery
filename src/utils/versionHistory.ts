import type { Skill, SkillVersionSnapshot } from '../types/skill.ts';

/**
 * Compares two skill states and returns a human-readable list of changes.
 */
export function detectSkillChanges(prev: Partial<Skill>, current: Partial<Skill>): string[] {
  const changes: string[] = [];

  if (prev.name && current.name && prev.name !== current.name) {
    changes.push(`Renamed from "${prev.name}" to "${current.name}"`);
  }

  if (prev.version && current.version && prev.version !== current.version) {
    changes.push(`Version updated from ${prev.version} to ${current.version}`);
  }

  if (prev.description && current.description && prev.description !== current.description) {
    changes.push('Updated description');
  }

  if (prev.category && current.category && prev.category !== current.category) {
    changes.push(`Category changed from ${prev.category} to ${current.category}`);
  }

  if (prev.executionType && current.executionType && prev.executionType !== current.executionType) {
    changes.push(`Execution type changed to ${current.executionType}`);
  }

  if (prev.status && current.status && prev.status !== current.status) {
    changes.push(`Status changed to ${current.status}`);
  }

  // Input parameter comparison
  const prevParams = prev.inputSchema || [];
  const currParams = current.inputSchema || [];

  const prevParamNames = new Set(prevParams.map((p) => p.name));
  const currParamNames = new Set(currParams.map((p) => p.name));

  const addedParams = currParams.filter((p) => !prevParamNames.has(p.name));
  const removedParams = prevParams.filter((p) => !currParamNames.has(p.name));

  if (addedParams.length > 0) {
    changes.push(`Added parameter(s): ${addedParams.map((p) => `"${p.name}"`).join(', ')}`);
  }
  if (removedParams.length > 0) {
    changes.push(`Removed parameter(s): ${removedParams.map((p) => `"${p.name}"`).join(', ')}`);
  }

  // Check if existing parameters were modified (type, required, description)
  for (const currP of currParams) {
    const prevP = prevParams.find((p) => p.name === currP.name);
    if (prevP) {
      if (prevP.type !== currP.type) {
        changes.push(`Changed parameter "${currP.name}" type from ${prevP.type} to ${currP.type}`);
      }
      if (prevP.required !== currP.required) {
        changes.push(`Parameter "${currP.name}" marked as ${currP.required ? 'required' : 'optional'}`);
      }
    }
  }

  // Config changes
  if (prev.config && current.config) {
    if (prev.config.timeoutMs !== current.config.timeoutMs) {
      changes.push(`Execution timeout updated to ${current.config.timeoutMs}ms`);
    }
    if (prev.config.apiKeyName !== current.config.apiKeyName) {
      changes.push(
        current.config.apiKeyName
          ? `Set required API key to ${current.config.apiKeyName}`
          : 'Removed API key requirement'
      );
    }
    if (prev.config.endpointUrl !== current.config.endpointUrl) {
      changes.push('Updated target endpoint URL');
    }
  }

  return changes.length > 0 ? changes : ['Minor configuration updates'];
}

/**
 * Creates a version snapshot record from the current skill state.
 */
export function createVersionSnapshot(
  skill: Skill,
  changeSummary?: string,
  authorName?: string
): SkillVersionSnapshot {
  return {
    versionId: `vsnap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    version: skill.version || '1.0.0',
    timestamp: new Date().toISOString(),
    author: authorName || skill.author || 'Author',
    changeSummary: changeSummary || 'Saved updates',
    skillState: {
      name: skill.name,
      description: skill.description,
      category: skill.category,
      version: skill.version,
      executionType: skill.executionType,
      status: skill.status,
      inputSchema: JSON.parse(JSON.stringify(skill.inputSchema || [])),
      outputSchema: JSON.parse(JSON.stringify(skill.outputSchema || { type: 'object', description: '' })),
      config: JSON.parse(
        JSON.stringify(
          skill.config || { timeoutMs: 10000, retryPolicy: { maxRetries: 2, backoffMs: 1000 } }
        )
      ),
      tags: [...(skill.tags || [])],
      explanation: skill.explanation,
    },
  };
}

/**
 * Reverts a skill to a specific snapshot and records the reversion in history.
 */
export function revertSkillToSnapshot(
  skill: Skill,
  snapshot: SkillVersionSnapshot,
  authorName?: string
): Skill {
  const currentSnapshot = createVersionSnapshot(
    skill,
    `Prior state before reverting to v${snapshot.version}`,
    authorName
  );

  const existingHistory = skill.versionHistory || [];
  const revertRecord: SkillVersionSnapshot = {
    versionId: `vsnap_revert_${Date.now()}`,
    version: snapshot.version,
    timestamp: new Date().toISOString(),
    author: authorName || 'User',
    changeSummary: `Reverted to version ${snapshot.version} (snapshot from ${new Date(snapshot.timestamp).toLocaleDateString()})`,
    skillState: JSON.parse(JSON.stringify(snapshot.skillState)),
  };

  return {
    ...skill,
    ...snapshot.skillState,
    updatedAt: new Date().toISOString(),
    versionHistory: [revertRecord, currentSnapshot, ...existingHistory],
  };
}
