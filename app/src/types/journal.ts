export type SynthesisStatus =
  | 'transcribed_offline'
  | 'ready_to_synthesize'
  | 'synthesizing'
  | 'synthesized'
  | 'synthesis_failed';
export interface JournalEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  journalDate: string;
  title: string | null;
  rawTranscript: string;
  synthesizedStory: string | null;
  tags: string[];
  synthesisStatus: SynthesisStatus;
  transcriptRevision: number;
  synthesizedFromRevision: number | null;
  modelId: string | null;
  lastSynthesisError: string | null;
  synthesisAttemptId: string | null;
}
export const statusText: Record<SynthesisStatus, string> = {
  transcribed_offline: 'Not synthesized — transcribed offline',
  ready_to_synthesize: 'Transcript saved · Ready to synthesize',
  synthesizing: 'Synthesizing your entry…',
  synthesized: 'Story ready',
  synthesis_failed: "Couldn't synthesize · Retry",
};
export const isStale = (entry: JournalEntry) =>
  !!entry.synthesizedStory && entry.synthesizedFromRevision !== entry.transcriptRevision;
