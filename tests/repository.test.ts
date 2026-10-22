import { describe, it, expect } from 'vitest';
import { database } from './database';
import { migrate } from '../app/src/services/database/migrations';
import { JournalRepository } from '../app/src/services/database/journalRepository';
import { SettingsRepository } from '../app/src/services/database/settingsRepository';
describe('SQLite persistence', () => {
  it('migrates, preserves Unicode and SQL-like text, and reopens persisted entries', async () => {
    const { db, native } = await database();
    await migrate(db);
    const repo = new JournalRepository(db, () => 'one');
    const text = "Today’s journal: '); DROP TABLE journal_entries; -- 🌱";
    await repo.createDraft({ rawTranscript: text, offline: true });
    const reopened = await database(native.export());
    await migrate(reopened.db);
    expect((await new JournalRepository(reopened.db, () => 'two').list())[0].rawTranscript).toBe(
      text,
    );
  });
  it('rejects empty entries and defaults cloud settings off', async () => {
    const { db } = await database();
    await migrate(db);
    await expect(
      new JournalRepository(db, () => 'one').createDraft({ rawTranscript: ' ', offline: true }),
    ).rejects.toThrow();
    const settings = new SettingsRepository(db);
    expect(await settings.get('consent')).toBe(false);
    await settings.set('autoSynthesis', true);
    expect(await settings.get('autoSynthesis')).toBe(true);
  });
  it('preserves story, increments revisions, and discards an old attempt after editing', async () => {
    const { db } = await database();
    await migrate(db);
    const repo = new JournalRepository(db, () => 'one');
    await repo.createDraft({ rawTranscript: 'A walk', offline: true });
    await repo.beginSynthesis('one', 'a');
    const result = { title: 'Walk', story: 'I walked.', tags: ['Daily Life'], model: 'test' };
    expect(await repo.applySynthesis('one', 'a', 1, result)).toBe(true);
    await expect(repo.beginSynthesis('one', 'no-regeneration')).rejects.toThrow();
    await repo.updateTranscript('one', 'A longer walk');
    await repo.beginSynthesis('one', 'b');
    await repo.updateTranscript('one', 'A long walk');
    expect(await repo.applySynthesis('one', 'b', 2, result)).toBe(false);
    const entry = await repo.getById('one');
    expect(entry?.transcriptRevision).toBe(3);
    expect(entry?.synthesizedStory).toBe('I walked.');
    expect(entry?.rawTranscript).toBe('A long walk');
  });
  it('allows only one attempt and recovers interrupted requests without resending', async () => {
    const { db } = await database();
    await migrate(db);
    const repo = new JournalRepository(db, () => 'one');
    await repo.createDraft({ rawTranscript: 'A saved thought', offline: false });
    await repo.beginSynthesis('one', 'a');
    await expect(repo.beginSynthesis('one', 'b')).rejects.toThrow();
    await repo.markSynthesisFailed('one', 'b', 'Wrong attempt');
    expect((await repo.getById('one'))?.synthesisStatus).toBe('synthesizing');
    await migrate(db);
    expect((await repo.getById('one'))?.synthesisStatus).toBe('synthesis_failed');
    expect((await repo.getById('one'))?.rawTranscript).toBe('A saved thought');
  });
});
