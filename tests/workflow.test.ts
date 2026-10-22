import { it, expect, vi } from 'vitest';
import { database } from './database';
import { migrate } from '../app/src/services/database/migrations';
import { JournalRepository } from '../app/src/services/database/journalRepository';
import { SettingsRepository } from '../app/src/services/database/settingsRepository';
import { finishEntry, consumeAutomaticTicket } from '../app/src/features/journal/finishEntry';
import { SynthesisService } from '../app/src/features/synthesis/SynthesisService';
import type { SynthesisRequest, SynthesisResponse } from '../shared/synthesis';
async function setup() {
  const { db } = await database();
  await migrate(db);
  return {
    repo: new JournalRepository(db, () => crypto.randomUUID()),
    settings: new SettingsRepository(db),
  };
}
function response(input: SynthesisRequest): SynthesisResponse {
  return {
    entryId: input.entryId,
    attemptId: input.attemptId,
    transcriptRevision: input.transcriptRevision,
    title: 'A Day',
    story: 'I had a day.',
    tags: ['Life', 'Work', 'Reflection'],
    model: 'mock',
  };
}
it('persists before network, defaults auto off, and never gives offline entries an auto ticket', async () => {
  const { repo, settings } = await setup();
  const online = await finishEntry(repo, settings, 'Online thought', true);
  expect(consumeAutomaticTicket(online.id)).toBe(false);
  await settings.set('consent', true);
  await settings.set('autoSynthesis', true);
  const offline = await finishEntry(repo, settings, 'Offline thought', false);
  expect(offline.synthesisStatus).toBe('transcribed_offline');
  expect(consumeAutomaticTicket(offline.id)).toBe(false);
  const next = await finishEntry(repo, settings, 'Online thought', true);
  expect(consumeAutomaticTicket(next.id)).toBe(true);
  expect(consumeAutomaticTicket(next.id)).toBe(false);
  const client = vi.fn(async (input: SynthesisRequest) => {
    expect((await repo.getById(input.entryId))?.rawTranscript).toBe('Offline thought');
    return response(input);
  });
  await new SynthesisService(repo, client, () => crypto.randomUUID()).run(offline.id);
  expect((await repo.getById(offline.id))?.synthesizedStory).toBe('I had a day.');
});
it('guards double taps and discards a response when transcript changes during a request', async () => {
  const { repo } = await setup();
  const entry = await repo.createDraft({ rawTranscript: 'Before', offline: false });
  let resolve!: () => void;
  let started!: () => void;
  const ready = new Promise<void>((r) => (started = r));
  const client = vi.fn(async (input: SynthesisRequest) => {
    started();
    return await new Promise<SynthesisResponse>((r) => {
      resolve = () => r(response(input));
    });
  });
  const service = new SynthesisService(repo, client, () => crypto.randomUUID());
  const first = service.run(entry.id);
  await ready;
  expect(await service.run(entry.id)).toBe(false);
  expect(client).toHaveBeenCalledTimes(1);
  await repo.updateTranscript(entry.id, 'After');
  resolve();
  expect(await first).toBe(false);
  expect((await repo.getById(entry.id))?.rawTranscript).toBe('After');
  expect((await repo.getById(entry.id))?.synthesizedStory).toBeNull();
});
it.each(['HTTP 500', 'timeout', 'invalid JSON', 'refusal', '429', 'airplane mode'])(
  'preserves transcript and allows manual retry after %s',
  async (message) => {
    const { repo } = await setup();
    const entry = await repo.createDraft({ rawTranscript: 'Keep this', offline: true });
    await expect(
      new SynthesisService(
        repo,
        async () => {
          throw new Error(message);
        },
        () => crypto.randomUUID(),
      ).run(entry.id),
    ).rejects.toThrow(message);
    const failed = await repo.getById(entry.id);
    expect(failed?.rawTranscript).toBe('Keep this');
    expect(failed?.synthesisStatus).toBe('synthesis_failed');
    await new SynthesisService(
      repo,
      async (input) => response(input),
      () => crypto.randomUUID(),
    ).run(entry.id);
    expect((await repo.getById(entry.id))?.synthesisStatus).toBe('synthesized');
  },
);
