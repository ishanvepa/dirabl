export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
export async function migrate(db: Database) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 1)
    throw new Error('This journal needs a newer version of dirabl.');
  if (!version?.user_version)
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
      CREATE TABLE journal_entries (
        id TEXT PRIMARY KEY NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        journal_date TEXT NOT NULL, title TEXT, raw_transcript TEXT NOT NULL DEFAULT '',
        synthesized_story TEXT, tags_json TEXT NOT NULL DEFAULT '[]',
        synthesis_status TEXT NOT NULL DEFAULT 'ready_to_synthesize'
          CHECK(synthesis_status IN ('transcribed_offline','ready_to_synthesize','synthesizing','synthesized','synthesis_failed')),
        transcript_revision INTEGER NOT NULL DEFAULT 1, synthesized_from_revision INTEGER,
        model_id TEXT, last_synthesis_error TEXT, synthesis_attempt_id TEXT
      );
      CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
      CREATE TABLE app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      PRAGMA user_version = 1;
    `);
    });
  await db.runAsync(`UPDATE journal_entries SET synthesis_status='synthesis_failed',
    synthesis_attempt_id=NULL, last_synthesis_error='Synthesis was interrupted. Tap Retry.' WHERE synthesis_status='synthesizing'`);
}
