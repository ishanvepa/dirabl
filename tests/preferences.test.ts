import { expect, it } from 'vitest';
import { database } from './database';
import { migrate } from '../app/src/services/database/migrations';
import { SettingsRepository } from '../app/src/services/database/settingsRepository';
import { JournalRepository } from '../app/src/services/database/journalRepository';

it('starts a fresh journal in onboarding with local defaults and no AI consent', async () => {
  const { db } = await database();
  await migrate(db);
  const settings = new SettingsRepository(db);
  expect(await settings.getPreferences()).toEqual({
    displayName: '',
    preferredReadingView: 'story',
    onboardingCompleted: false,
  });
  expect(await settings.get('consent')).toBe(false);
  expect(await settings.get('autoSynthesis')).toBe(false);
});

it('persists the completed setup and reading choice across a database reopen without assuming consent', async () => {
  const { db, native } = await database();
  await migrate(db);
  await new SettingsRepository(db).completeOnboarding({
    displayName: '  Alex  ',
    preferredReadingView: 'transcript',
    autoSynthesis: true,
    consent: false,
  });
  const reopened = await database(native.export());
  await migrate(reopened.db);
  const settings = new SettingsRepository(reopened.db);
  expect(await settings.getPreferences()).toEqual({
    displayName: 'Alex',
    preferredReadingView: 'transcript',
    onboardingCompleted: true,
  });
  expect(await settings.get('consent')).toBe(false);
  expect(await settings.get('autoSynthesis')).toBe(false);
});

it('enables automatic synthesis only after the explicit consent choice is saved', async () => {
  const { db } = await database();
  await migrate(db);
  const settings = new SettingsRepository(db);
  await settings.completeOnboarding({
    displayName: '',
    preferredReadingView: 'story',
    autoSynthesis: true,
    consent: true,
  });
  expect(await settings.get('consent')).toBe(true);
  expect(await settings.get('autoSynthesis')).toBe(true);
  expect((await settings.getPreferences()).onboardingCompleted).toBe(true);
});

it('preserves an existing journal on upgrade and respects an explicit onboarding flag', async () => {
  const { db } = await database();
  await migrate(db);
  const journal = new JournalRepository(db, () => 'existing-entry');
  await journal.createDraft({ rawTranscript: 'An existing saved entry.', offline: true });
  await migrate(db);
  const settings = new SettingsRepository(db);
  expect((await settings.getPreferences()).onboardingCompleted).toBe(true);
  expect(await settings.get('consent')).toBe(false);
  await settings.set('onboardingCompleted', false);
  await migrate(db);
  expect((await settings.getPreferences()).onboardingCompleted).toBe(false);
  expect((await journal.getById('existing-entry'))?.rawTranscript).toBe('An existing saved entry.');
});

it('rolls back the whole setup when saving the completion flag fails', async () => {
  const { db } = await database();
  await migrate(db);
  await db.execAsync(`CREATE TRIGGER fail_setup BEFORE INSERT ON app_settings
    WHEN NEW.key='onboardingCompleted' BEGIN SELECT RAISE(ABORT, 'Test write failure'); END;`);
  const settings = new SettingsRepository(db);
  await expect(
    settings.completeOnboarding({
      displayName: 'Alex',
      preferredReadingView: 'transcript',
      autoSynthesis: true,
      consent: true,
    }),
  ).rejects.toThrow();
  expect(await settings.getPreferences()).toEqual({
    displayName: '',
    preferredReadingView: 'story',
    onboardingCompleted: false,
  });
  expect(await settings.get('consent')).toBe(false);
  expect(await settings.get('autoSynthesis')).toBe(false);
});
