import type { JournalEntry, SynthesisStatus } from '../../types/journal';
import type { Database } from './migrations';
interface Row {
  id: string; created_at: string; updated_at: string; journal_date: string;
  title: string | null; raw_transcript: string; synthesized_story: string | null; tags_json: string;
  synthesis_status: SynthesisStatus; transcript_revision: number; synthesized_from_revision: number | null;
  model_id: string | null; last_synthesis_error: string | null; synthesis_attempt_id: string | null;
}
function entry(row: Row): JournalEntry {
  return { id: row.id, createdAt: row.created_at, updatedAt: row.updated_at, journalDate: row.journal_date,
    title: row.title, rawTranscript: row.raw_transcript, synthesizedStory: row.synthesized_story,
    tags: JSON.parse(row.tags_json), synthesisStatus: row.synthesis_status, transcriptRevision: row.transcript_revision,
    synthesizedFromRevision: row.synthesized_from_revision, modelId: row.model_id,
    lastSynthesisError: row.last_synthesis_error, synthesisAttemptId: row.synthesis_attempt_id };
}
export function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export class JournalRepository {
  constructor(private db: Database, private uuid: () => string, private now = () => new Date()) {}
  async createDraft(input: { rawTranscript: string; offline: boolean }) {
    const text = input.rawTranscript.trim();
    if (!text) throw new Error('Write or dictate something before saving.');
    const id = this.uuid(), date = this.now();
    await this.db.runAsync(`INSERT INTO journal_entries
      (id,created_at,updated_at,journal_date,raw_transcript,synthesis_status) VALUES (?,?,?,?,?,?)`,
    id, date.toISOString(), date.toISOString(), localDay(date), text, input.offline ? 'transcribed_offline' : 'ready_to_synthesize');
    return (await this.getById(id))!;
  }
  async list() { return (await this.db.getAllAsync<Row>('SELECT * FROM journal_entries ORDER BY created_at DESC')).map(entry); }
  async getById(id: string) {
    const row = await this.db.getFirstAsync<Row>('SELECT * FROM journal_entries WHERE id=?', id);
    return row ? entry(row) : null;
  }
  async updateTranscript(id: string, transcript: string) {
    if (!transcript.trim()) throw new Error('The transcript cannot be empty.');
    await this.db.runAsync(`UPDATE journal_entries SET raw_transcript=?, transcript_revision=transcript_revision+1,
      updated_at=?, synthesis_status='ready_to_synthesize', synthesis_attempt_id=NULL, last_synthesis_error=NULL
      WHERE id=? AND raw_transcript<>?`, transcript.trim(), this.now().toISOString(), id, transcript.trim());
    const result = await this.getById(id);
    if (!result) throw new Error('Entry not found.');
    return result;
  }
  async beginSynthesis(id: string, attemptId: string) {
    const result = await this.db.runAsync(`UPDATE journal_entries SET synthesis_status='synthesizing',
      synthesis_attempt_id=?,last_synthesis_error=NULL,updated_at=?
      WHERE id=? AND synthesis_status<>'synthesizing' AND length(trim(raw_transcript))>0`, attemptId, this.now().toISOString(), id);
    if (!result.changes) throw new Error('This entry is already synthesizing or unavailable.');
    return (await this.getById(id))!;
  }
  async applySynthesis(id: string, attempt: string, revision: number, result: {title: string; story: string; tags: string[]; model: string}) {
    const update = await this.db.runAsync(`UPDATE journal_entries SET title=?,synthesized_story=?,tags_json=?,model_id=?,
      synthesized_from_revision=?,synthesis_status='synthesized',synthesis_attempt_id=NULL,last_synthesis_error=NULL,updated_at=?
      WHERE id=? AND synthesis_attempt_id=? AND transcript_revision=? AND synthesis_status='synthesizing'`,
    result.title,result.story,JSON.stringify(result.tags),result.model,revision,this.now().toISOString(),id,attempt,revision);
    return update.changes === 1;
  }
  async markSynthesisFailed(id: string, attempt: string, error: string) {
    await this.db.runAsync(`UPDATE journal_entries SET synthesis_status='synthesis_failed',synthesis_attempt_id=NULL,
      last_synthesis_error=?,updated_at=? WHERE id=? AND synthesis_attempt_id=?`, error, this.now().toISOString(),id,attempt);
  }
}
