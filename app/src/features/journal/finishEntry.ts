import type { JournalRepository } from '../../services/database/journalRepository';
import type { SettingsRepository } from '../../services/database/settingsRepository';
const automaticTickets = new Set<string>();
// Tickets live only in this process and are created exclusively by Finish.
// They are never reconstructed by connectivity events, routes or app startup.
export function consumeAutomaticTicket(id: string) {
  const exists = automaticTickets.has(id);
  automaticTickets.delete(id);
  return exists;
}
export async function finishEntry(
  journal: JournalRepository,
  settings: SettingsRepository,
  text: string,
  online: boolean,
) {
  const entry = await journal.createDraft({ rawTranscript: text, offline: !online });
  try {
    if (online && (await settings.get('consent')) && (await settings.get('autoSynthesis')))
      automaticTickets.add(entry.id);
  } catch {
    /* A settings read error must never hide a successfully saved entry. */
  }
  return entry;
}
