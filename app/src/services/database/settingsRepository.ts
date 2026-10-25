import type { Database } from './migrations';
export type ReadingView = 'story' | 'transcript';
export interface JournalPreferences {
  displayName: string;
  preferredReadingView: ReadingView;
  onboardingCompleted: boolean;
}
export interface OnboardingPreferences {
  displayName: string;
  preferredReadingView: ReadingView;
  autoSynthesis: boolean;
  consent: boolean;
}
export class SettingsRepository {
  constructor(private db: Database) {}
  async get(key: 'consent' | 'autoSynthesis' | 'onboardingCompleted') {
    return (
      (
        await this.db.getFirstAsync<{ value: string }>(
          'SELECT value FROM app_settings WHERE key=?',
          key,
        )
      )?.value === 'true'
    );
  }
  async set(key: 'consent' | 'autoSynthesis' | 'onboardingCompleted', value: boolean) {
    await this.db.runAsync(
      'INSERT INTO app_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      key,
      String(value),
    );
  }

  async getText(key: 'displayName' | 'preferredReadingView') {
    return (
      (
        await this.db.getFirstAsync<{ value: string }>(
          'SELECT value FROM app_settings WHERE key=?',
          key,
        )
      )?.value ?? ''
    );
  }
  async setText(key: 'displayName' | 'preferredReadingView', value: string) {
    await this.db.runAsync(
      'INSERT INTO app_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      key,
      value,
    );
  }
  async getPreferences(): Promise<JournalPreferences> {
    const [displayName, view, onboardingCompleted] = await Promise.all([
      this.getText('displayName'),
      this.getText('preferredReadingView'),
      this.get('onboardingCompleted'),
    ]);
    return {
      displayName,
      preferredReadingView: view === 'transcript' ? 'transcript' : 'story',
      onboardingCompleted,
    };
  }
  async completeOnboarding(input: OnboardingPreferences) {
    await this.db.withTransactionAsync(async () => {
      await this.setText('displayName', input.displayName.trim().slice(0, 80));
      await this.setText('preferredReadingView', input.preferredReadingView);
      await this.set('consent', input.consent);
      await this.set('autoSynthesis', input.autoSynthesis && input.consent);
      await this.set('onboardingCompleted', true);
    });
    return this.getPreferences();
  }
}
