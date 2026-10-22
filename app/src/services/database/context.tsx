import { useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import { JournalRepository } from './journalRepository';
import { SettingsRepository } from './settingsRepository';
export function useRepositories() {
  const db = useSQLiteContext();
  return useMemo(() => ({journal: new JournalRepository(db,randomUUID),settings:new SettingsRepository(db)}),[db]);
}
