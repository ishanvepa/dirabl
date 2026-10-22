import type { JournalRepository } from '../../services/database/journalRepository';
import type { SynthesisRequest, SynthesisResponse } from '../../../../shared/synthesis';
const active = new Set<string>();
export class SynthesisService {
  constructor(
    private repo: JournalRepository,
    private client: (input: SynthesisRequest) => Promise<SynthesisResponse>,
    private uuid: () => string,
  ) {}
  async run(id: string) {
    if (active.has(id)) return false;
    active.add(id);
    const attempt = this.uuid();
    let begun = false;
    try {
      const entry = await this.repo.beginSynthesis(id, attempt);
      begun = true;
      const response = await this.client({
        entryId: id,
        attemptId: attempt,
        transcriptRevision: entry.transcriptRevision,
        rawTranscript: entry.rawTranscript,
      });
      return await this.repo.applySynthesis(id, attempt, entry.transcriptRevision, response);
    } catch (error) {
      if (begun)
        await this.repo.markSynthesisFailed(
          id,
          attempt,
          error instanceof Error ? error.message : 'Synthesis failed. Please retry.',
        );
      throw error;
    } finally {
      active.delete(id);
    }
  }
}
