import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { systemSettings } from '../models/schema.js';

const DEFAULTS: Record<string, string> = {
  attendance_threshold: '75',
  academic_year: '2025-2026',
  current_semester: '8',
  app_mode: 'general',
};

export async function getSetting(key: string): Promise<string> {
  const [setting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  return setting?.value || DEFAULTS[key] || '';
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await db.select().from(systemSettings);
  const result = { ...DEFAULTS };
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
}

export async function updateSetting(key: string, value: string) {
  const [existing] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(systemSettings)
    .values({ key, value })
    .returning();

  return created;
}

export async function updateSettings(settings: Record<string, string>) {
  const results = [];
  for (const [key, value] of Object.entries(settings)) {
    results.push(await updateSetting(key, value));
  }
  return results;
}

export async function seedDefaultSettings() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const existing = await getSetting(key);
    if (existing === DEFAULTS[key]) {
      await updateSetting(key, value);
    }
  }
}
