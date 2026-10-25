import type { SpeechTranscriber } from './SpeechTranscriber';

export const EXPO_GO_NOTICE = 'Voice dictation requires the development build. You can type here.';

// Does not emit speech events: the editor owns typed text, including across app backgrounding.
export class ManualSpeechTranscriber implements SpeechTranscriber {
  async checkAvailability() {
    return { available: false, manualOnly: true, reason: EXPO_GO_NOTICE };
  }
  async requestPermission() {
    return false;
  }
  async start() {
    throw new Error(EXPO_GO_NOTICE);
  }
  async stop() {
    return '';
  }
  subscribe() {
    return () => {};
  }
  async downloadModel() {
    throw new Error(EXPO_GO_NOTICE);
  }
  dispose() {}
}
