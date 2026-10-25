import { isRunningInExpoGo } from 'expo';
import { ManualSpeechTranscriber } from './ManualSpeechTranscriber';
import type { SpeechTranscriber } from './SpeechTranscriber';

export async function createSpeechTranscriber(): Promise<SpeechTranscriber> {
  if (isRunningInExpoGo()) return new ManualSpeechTranscriber();
  // A static import evaluates the missing native module even when the microphone UI is hidden.
  const { ExpoSpeechTranscriber } = await import('./ExpoSpeechTranscriber');
  return new ExpoSpeechTranscriber();
}
