import { it, expect } from 'vitest';
import { TranscriptBuffer } from '../app/src/services/speech/TranscriptBuffer';
it('replaces interim text, commits only finals, and ignores duplicate finals', () => {
  const buffer = new TranscriptBuffer();
  buffer.begin('Before.');
  buffer.result('I wa', false);
  buffer.result('I walked.', false);
  expect(buffer.committedText).toBe('Before.');
  expect(buffer.interimText).toBe('I walked.');
  buffer.result('I walked.', true);
  buffer.result('I walked.', true);
  expect(buffer.finish()).toBe('Before. I walked.');
});
it('preserves last partial on interruption, and prevents duplicate final across restart', () => {
  const buffer = new TranscriptBuffer();
  buffer.begin('');
  buffer.result('A good day.', false);
  expect(buffer.finish()).toBe('A good day.');
  buffer.begin(buffer.committedText);
  buffer.result('A good day.', true);
  expect(buffer.finish()).toBe('A good day.');
  buffer.result('Another thought.', true);
  expect(buffer.finish()).toBe('A good day. Another thought.');
});
