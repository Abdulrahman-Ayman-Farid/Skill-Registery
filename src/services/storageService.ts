import { Skill, User, SkillConfig, SkillStatus } from '../types/skill.ts';
import { STARTER_SKILLS } from '../data/starterSkills.ts';
import { validateSkill } from '../utils/validation.ts';
import {
  detectSkillChanges,
  createVersionSnapshot,
  revertSkillToSnapshot,
} from '../utils/versionHistory.ts';

const STORAGE_KEY_PREFIX = 'ai_agent_skill_registry_';
const USERS_STORAGE_KEY = `${STORAGE_KEY_PREFIX}users`;
const CURRENT_USER_KEY = `${STORAGE_KEY_PREFIX}current_user_id`;

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
 */
class StorageService {
  private memoryCache: Map<string, Skill[]> = new Map();

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (typeof window === 'undefined') return;

    // Initialize users
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!storedUsers) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    }

    // Initialize current user
    const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentUserId) {
      localStorage.setItem(CURRENT_USER_KEY, DEFAULT_USERS[0].id);
    }

    // Seed default user skills if not present
    const defaultUserKey = this.getUserSkillsKey(DEFAULT_USERS[0].id);
    if (!localStorage.getItem(defaultUserKey)) {
      const seeded = STARTER_SKILLS.map((skill) => ({
        ...skill,
        userId: DEFAULT_USERS[0].id,
      }));
      localStorage.setItem(defaultUserKey, JSON.stringify(seeded));
    }
  }

  private getUserSkillsKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}skills_${userId}`;
  }

  public getUsers(): User[] {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }

  public getCurrentUser(): User {
    if (typeof window === 'undefined') return DEFAULT_USERS[0];
    const users = this.getUsers();
    const currentId = localStorage.getItem(CURRENT_USER_KEY);
    return users.find((u) => u.id === currentId) || users[0] || DEFAULT_USERS[0];
  }

  public setCurrentUser(userId: string): User {
    localStorage.setItem(CURRENT_USER_KEY, userId);
    const user = this.getCurrentUser();
    // Ensure the new user has a skills entry (seed with starters on first login)
    const key = this.getUserSkillsKey(userId);
    if (!localStorage.getItem(key)) {
      const seeded = STARTER_SKILLS.map((skill) => ({
        ...skill,
        id: `${skill.id}-${userId.slice(0, 4)}`,
        userId: userId,
      }));
      localStorage.setItem(key, JSON.stringify(seeded));
    }
    return user;
  }

  public createUser(name: string, email: string, role: 'Developer' | 'Admin' | 'AI Engineer' = 'Developer'): User {
    const users = this.getUsers();
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
    };
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    this.setCurrentUser(newUser.id);
    return newUser;
  }

  public getSkills(userId?: string): Skill[] {
    if (typeof window === 'undefined') return STARTER_SKILLS;
    const targetUserId = userId || this.getCurrentUser().id;
    const key = this.getUserSkillsKey(targetUserId);

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Seed initial skills for this user
        const seeded = STARTER_SKILLS.map((skill) => ({
          ...skill,
          userId: targetUserId,
        }));
        localStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      }
      const parsed: Skill[] = JSON.parse(raw);
      let wasEnriched = false;
      const enriched = parsed.map((skill) => {
        let currentSkill = skill;
        if (!currentSkill.versionHistory || currentSkill.versionHistory.length === 0) {
          const starterMatch = STARTER_SKILLS.find(
            (s) => s.id === currentSkill.id || s.name.toLowerCase() === currentSkill.name.toLowerCase()
          );
          if (starterMatch?.versionHistory && starterMatch.versionHistory.length > 0) {
            wasEnriched = true;
            currentSkill = {
              ...currentSkill,
              versionHistory: starterMatch.versionHistory,
            };
          } else {
            wasEnriched = true;
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
          wasEnriched = true;
          currentSkill = {
            ...currentSkill,
            dependencies: starterMatch?.dependencies || [],
          };
        }

        return currentSkill;
      });

      if (wasEnriched) {
        localStorage.setItem(key, JSON.stringify(enriched));
      }
      return enriched;
    } catch (e) {
      console.error('Failed to parse skills from localStorage', e);
      return STARTER_SKILLS;
    }
  }

  public getSkillById(id: string, userId?: string): Skill | undefined {
    const skills = this.getSkills(userId);
    return skills.find((s) => s.id === id);
  }

  public saveSkill(skill: Skill): Skill {
    const currentId = this.getCurrentUser().id;
    const userId = (!skill.userId || skill.userId === 'current') ? currentId : skill.userId;
    const skills = this.getSkills(userId);
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser();

    const existingIndex = skills.findIndex((s) => s.id === skill.id);
    let updatedSkill: Skill;

    if (existingIndex >= 0) {
      const existingSkill = skills[existingIndex];
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
      skills[existingIndex] = updatedSkill;
    } else {
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
      skills.unshift(updatedSkill);
    }

    const key = this.getUserSkillsKey(userId);
    localStorage.setItem(key, JSON.stringify(skills));
    return updatedSkill;
  }

  public revertSkillVersion(skillId: string, versionId: string, userId?: string): Skill {
    const targetUserId = userId || this.getCurrentUser().id;
    const skill = this.getSkillById(skillId, targetUserId);
    if (!skill) throw new Error('Skill not found');

    const targetSnapshot = skill.versionHistory?.find((v) => v.versionId === versionId);
    if (!targetSnapshot) throw new Error('Version snapshot not found');

    const reverted = revertSkillToSnapshot(skill, targetSnapshot, this.getCurrentUser().name);
    return this.saveSkill(reverted);
  }

  public deleteSkill(id: string, userId?: string): void {
    const targetUserId = userId || this.getCurrentUser().id;
    const skills = this.getSkills(targetUserId);
    const filtered = skills.filter((s) => s.id !== id);
    const key = this.getUserSkillsKey(targetUserId);
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  public duplicateSkill(id: string, userId?: string): Skill {
    const targetUserId = userId || this.getCurrentUser().id;
    const original = this.getSkillById(id, targetUserId);
    if (!original) {
      throw new Error(`Skill with id ${id} not found.`);
    }

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

    return this.saveSkill(duplicate);
  }

  public toggleArchiveSkill(id: string, userId?: string): Skill {
    const targetUserId = userId || this.getCurrentUser().id;
    const skill = this.getSkillById(id, targetUserId);
    if (!skill) throw new Error('Skill not found');

    const nextStatus: SkillStatus = skill.status === 'deprecated' ? 'active' : 'deprecated';
    const updated: Skill = { ...skill, status: nextStatus, updatedAt: new Date().toISOString() };
    return this.saveSkill(updated);
  }

  public installMarketplaceSkill(
    marketplaceSkill: Skill,
    customConfig?: Partial<SkillConfig>,
    userId?: string
  ): Skill {
    const targetUserId = userId || this.getCurrentUser().id;
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

    return this.saveSkill(newSkill);
  }

  public importSkills(
    incomingSkills: any[],
    userId?: string
  ): { importedCount: number; errors: string[] } {
    const targetUserId = userId || this.getCurrentUser().id;
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
      this.saveSkill(prepared);
      count++;
    }

    return { importedCount: count, errors };
  }

  public resetUserSkillsToDefault(userId?: string): void {
    const targetUserId = userId || this.getCurrentUser().id;
    const seeded = STARTER_SKILLS.map((skill) => ({
      ...skill,
      userId: targetUserId,
    }));
    const key = this.getUserSkillsKey(targetUserId);
    localStorage.setItem(key, JSON.stringify(seeded));
  }
}

export const storageService = new StorageService();
