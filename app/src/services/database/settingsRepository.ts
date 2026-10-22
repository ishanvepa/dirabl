import type { Database } from './migrations';
export class SettingsRepository {
  constructor(private db: Database) {}
  async get(key: 'consent' | 'autoSynthesis') {
    return (await this.db.getFirstAsync<{value: string}>('SELECT value FROM app_settings WHERE key=?',key))?.value === 'true';
  }
  async set(key: 'consent' | 'autoSynthesis', value: boolean) {
    await this.db.runAsync('INSERT INTO app_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,String(value));
  }
}
