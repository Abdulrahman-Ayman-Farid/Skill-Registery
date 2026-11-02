import type { Skill } from '../types/skill.ts';
import { serializeSkill } from '../utils/validation.ts';

const DISCORD_WEBHOOK_KEY = 'discord_webhook_url';

export function getDiscordWebhookUrl(): string {
  return localStorage.getItem(DISCORD_WEBHOOK_KEY) || '';
}

export function setDiscordWebhookUrl(url: string): void {
  localStorage.setItem(DISCORD_WEBHOOK_KEY, url);
}

export async function shareSkillToDiscord(
  skill: Skill,
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl) {
    return { success: false, error: 'No Discord Webhook URL configured' };
  }

  let serializedJson = serializeSkill(skill, 'json');
  if (serializedJson.length > 1900) {
    serializedJson = serializedJson.slice(0, 1900) + '\n... (truncated)';
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: serializedJson }),
    });

    if (response.status === 204 || response.status === 200) {
      return { success: true };
    }
    if (response.status === 429) {
      return { success: false, error: 'Rate limited by Discord. Please try again later.' };
    }
    if (response.status === 404) {
      return { success: false, error: 'Invalid Discord Webhook URL' };
    }
    return { success: false, error: 'Failed to share to Discord' };
  } catch {
    return { success: false, error: 'Failed to share to Discord' };
  }
}
