import { beforeEach, expect, it, vi } from 'vitest';
const { inExpoGo, nativeModuleLoaded, nativeCreated } = vi.hoisted(() => ({
  inExpoGo: vi.fn(() => true),
  nativeModuleLoaded: vi.fn(),
  nativeCreated: vi.fn(),
}));
vi.mock('expo', () => ({ isRunningInExpoGo: inExpoGo }));
vi.mock('../app/src/services/speech/ExpoSpeechTranscriber', () => {
  nativeModuleLoaded();
  return {
    ExpoSpeechTranscriber: class {
      constructor() {
        nativeCreated();
      }
    },
  };
});
import { createSpeechTranscriber } from '../app/src/services/speech/createSpeechTranscriber';
import { EXPO_GO_NOTICE } from '../app/src/services/speech/ManualSpeechTranscriber';
beforeEach(() => {
  vi.clearAllMocks();
  inExpoGo.mockReturnValue(true);
});
it('does not evaluate or construct the native speech adapter inside Expo Go', async () => {
  const speech = await createSpeechTranscriber();
  expect(await speech.checkAvailability('en-US')).toMatchObject({
    available: false,
    manualOnly: true,
    reason: EXPO_GO_NOTICE,
  });
  expect(nativeModuleLoaded).not.toHaveBeenCalled();
  expect(nativeCreated).not.toHaveBeenCalled();
  const listener = vi.fn();
  const unsubscribe = speech.subscribe(listener);
  expect(await speech.requestPermission()).toBe(false);
  await expect(speech.start({ locale: 'en-US', text: 'Typed thought' })).rejects.toThrow(
    EXPO_GO_NOTICE,
  );
  await expect(speech.downloadModel('en-US')).rejects.toThrow(EXPO_GO_NOTICE);
  await speech.stop();
  unsubscribe();
  speech.dispose();
  expect(listener).not.toHaveBeenCalled();
});
it('loads and constructs the native adapter in a development build', async () => {
  inExpoGo.mockReturnValue(false);
  await createSpeechTranscriber();
  expect(nativeCreated).toHaveBeenCalledTimes(1);
});
