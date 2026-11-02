import { Skill, User, SkillConfig, SkillStatus } from '../types/skill.ts';
import { STARTER_SKILLS } from '../data/starterSkills.ts';
import { validateSkill } from '../utils/validation.ts';
import {
  detectSkillChanges,
  createVersionSnapshot,
  revertSkillToSnapshot,
} from '../utils/versionHistory.ts';

const API_BASE = import.meta.env.VITE_API_URL || '';
const CURRENT_USER_KEY = 'ai_agent_skill_registry_current_user_id';

// Default users with the user's email from environment metadata
export const DEFAULT_USERS: User[] = [
  {
    id: 'usr_abdulrahman',
    name: 'Abdulrahman Farid',
    email: 'abdulrahmanaymanfarid@gmail.com',
    role: 'AI Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_dev_team',
    name: 'Enterprise Agent Ops',
    email: 'agent-ops@enterprise.ai',
    role: 'Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
];

/**
 * Storage Service for managing per-user persistent registries.
 * All persistence is delegated to the Express backend API.
 */
class StorageService {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  private getCurrentUserId(): string {
    if (typeof window === 'undefined') return DEFAULT_USERS[0].id;
    return localStorage.getItem(CURRENT_USER_KEY) || DEFAULT_USERS[0].id;
  }

  public async getUsers(): Promise<User[]> {
    try {
      return await this.request<User[]>('/api/users');
    } catch {
      return DEFAULT_USERS;
    }
  }

  public async getCurrentUser(): Promise<User> {
    try {
      const currentId = this.getCurrentUserId();
      const users = await this.getUsers();
      return users.find((u) => u.id === currentId) || users[0] || DEFAULT_USERS[0];
    } catch {
      return DEFAULT_USERS[0];
    }
  }

  public async setCurrentUser(userId: string): Promise<User> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    }
    try {
      const users = await this.getUsers();
      return users.find((u) => u.id === userId) || users[0] || DEFAULT_USERS[0];
    } catch {
      return DEFAULT_USERS[0];
    }
  }

  public async createUser(
    name: string,
    email: string,
    role: 'Developer' | 'Admin' | 'AI Engineer' = 'Developer'
  ): Promise<User> {
    const newUser = await this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), role }),
    });
    await this.setCurrentUser(newUser.id);
    return newUser;
  }

  public async getSkills(userId?: string): Promise<Skill[]> {
    const targetUserId = userId || this.getCurrentUserId();
    const skills = await this.request<Skill[]>(`/api/skills?userId=${encodeURIComponent(targetUserId)}`);

    // Enrich version history / dependencies (business logic, not persistence)
    const enriched = skills.map((skill) => {
      let currentSkill = skill;
      if (!currentSkill.versionHistory || currentSkill.versionHistory.length === 0) {
        const starterMatch = STARTER_SKILLS.find(
          (s) => s.id === currentSkill.id || s.name.toLowerCase() === currentSkill.name.toLowerCase()
        );
        if (starterMatch?.versionHistory && starterMatch.versionHistory.length > 0) {
          currentSkill = {
            ...currentSkill,
            versionHistory: starterMatch.versionHistory,
          };
        } else {
          currentSkill = {
            ...currentSkill,
            versionHistory: [
              createVersionSnapshot(currentSkill, 'Initial skill definition snapshot', currentSkill.author),
            ],
          };
        }
      }

      if (currentSkill.dependencies === undefined) {
        const starterMatch = STARTER_SKILLS.find(
          (s) => s.id === currentSkill.id || s.name.toLowerCase() === currentSkill.name.toLowerCase()
        );
        currentSkill = {
          ...currentSkill,
          dependencies: starterMatch?.dependencies || [],
        };
      }

      return currentSkill;
    });

    return enriched;
  }

  public async getSkillById(id: string, userId?: string): Promise<Skill | undefined> {
    const skills = await this.getSkills(userId);
    return skills.find((s) => s.id === id);
  }

  public async saveSkill(skill: Skill): Promise<Skill> {
    const currentId = this.getCurrentUserId();
    const userId = (!skill.userId || skill.userId === 'current') ? currentId : skill.userId;
    const now = new Date().toISOString();
    const currentUser = await this.getCurrentUser();

    let updatedSkill: Skill;

    if (skill.id) {
      // Fetch the existing skill for change detection
      const skills = await this.getSkills(userId);
      const existingSkill = skills.find((s) => s.id === skill.id);

      if (existingSkill) {
        const changes = detectSkillChanges(existingSkill, skill);
        const existingHistory = existingSkill.versionHistory || [];

        // If there are detectable changes, save a snapshot of the prior state in timeline
        if (changes.length > 0) {
          const priorSnapshot = createVersionSnapshot(
            existingSkill,
            changes.join('; '),
            currentUser.name
          );
          updatedSkill = {
            ...skill,
            userId,
            updatedAt: now,
            versionHistory: [priorSnapshot, ...existingHistory],
          };
        } else {
          updatedSkill = {
            ...skill,
            userId,
            updatedAt: now,
            versionHistory: skill.versionHistory || existingHistory,
          };
        }
      } else {
        updatedSkill = {
          ...skill,
          userId,
          updatedAt: now,
          versionHistory: skill.versionHistory || [],
        };
      }

      const saved = await this.request<Skill>(`/api/skills/${encodeURIComponent(skill.id)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedSkill),
      });
      return saved && Object.keys(saved).length > 0 ? saved : updatedSkill;
    }

    const initialSnapshot = createVersionSnapshot(
      skill,
      'Initial skill definition created',
      currentUser.name
    );
    updatedSkill = {
      ...skill,
      id: skill.id || `skill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      createdAt: skill.createdAt || now,
      updatedAt: now,
      versionHistory: skill.versionHistory && skill.versionHistory.length > 0 ? skill.versionHistory : [initialSnapshot],
    };

    const saved = await this.request<Skill>('/api/skills', {
      method: 'POST',
      body: JSON.stringify(updatedSkill),
    });
    return saved && Object.keys(saved).length > 0 ? saved : updatedSkill;
  }

  public async revertSkillVersion(skillId: string, versionId: string, userId?: string): Promise<Skill> {
    const skill = await this.getSkillById(skillId, userId);
    if (!skill) throw new Error('Skill not found');

    const targetSnapshot = skill.versionHistory?.find((v) => v.versionId === versionId);
    if (!targetSnapshot) throw new Error('Version snapshot not found');

    const currentUser = await this.getCurrentUser();
    const reverted = revertSkillToSnapshot(skill, targetSnapshot, currentUser.name);
    return this.saveSkill(reverted);
  }

  public async deleteSkill(id: string, userId?: string): Promise<void> {
    await this.request<void>(`/api/skills/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  public async duplicateSkill(id: string, userId?: string): Promise<Skill> {
    const original = await this.getSkillById(id, userId);
    if (!original) {
      throw new Error(`Skill with id ${id} not found.`);
    }

    const targetUserId = userId || this.getCurrentUserId();
    const duplicate: Skill = {
      ...original,
      id: `skill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${original.name} (Copy)`,
      userId: targetUserId,
      status: 'draft',
      isExample: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.saveSkill(duplicate);
  }

  public async toggleArchiveSkill(id: string, userId?: string): Promise<Skill> {
    const skill = await this.getSkillById(id, userId);
    if (!skill) throw new Error('Skill not found');

    const nextStatus: SkillStatus = skill.status === 'deprecated' ? 'active' : 'deprecated';
    const updated: Skill = { ...skill, status: nextStatus, updatedAt: new Date().toISOString() };
    return this.saveSkill(updated);
  }

  public async installMarketplaceSkill(
    marketplaceSkill: Skill,
    customConfig?: Partial<SkillConfig>,
    userId?: string
  ): Promise<Skill> {
    const targetUserId = userId || this.getCurrentUserId();
    const newSkill: Skill = {
      ...marketplaceSkill,
      id: `installed_${marketplaceSkill.id}_${Date.now().toString(36)}`,
      userId: targetUserId,
      status: 'active',
      isExample: false,
      config: {
        ...marketplaceSkill.config,
        ...(customConfig || {}),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.saveSkill(newSkill);
  }

  public async importSkills(
    incomingSkills: any[],
    userId?: string
  ): Promise<{ importedCount: number; errors: string[] }> {
    const targetUserId = userId || this.getCurrentUserId();
    const errors: string[] = [];
    let count = 0;

    for (let i = 0; i < incomingSkills.length; i++) {
      const item = incomingSkills[i];
      const validation = validateSkill(item);
      if (!validation.isValid) {
        errors.push(`Skill #${i + 1} ("${item.name || 'unnamed'}"): ${validation.errors.map((e) => e.message).join(', ')}`);
        continue;
      }

      const prepared: Skill = {
        ...item,
        id: item.id || `imported_${Date.now()}_${i}`,
        userId: targetUserId,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.saveSkill(prepared);
      count++;
    }

    return { importedCount: count, errors };
  }

  public async resetUserSkillsToDefault(userId?: string): Promise<void> {
    const targetUserId = userId || this.getCurrentUserId();
    const seeded = STARTER_SKILLS.map((skill) => ({
      ...skill,
      userId: targetUserId,
    }));
    for (const skill of seeded) {
      await this.saveSkill(skill);
    }
  }
}

export const storageService = new StorageService();
