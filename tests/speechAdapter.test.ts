import { beforeEach, it, expect, vi } from 'vitest';
const { native, events } = vi.hoisted(() => {
  const events = new Map<string, (event?: unknown) => void>();
  return {
    events,
    native: {
      addListener: vi.fn((name: string, fn: (event?: unknown) => void) => {
        events.set(name, fn);
        return { remove: vi.fn() };
      }),
      isRecognitionAvailable: vi.fn(() => true),
      supportsOnDeviceRecognition: vi.fn(() => true),
      getSupportedLocales: vi.fn(async () => ({ installedLocales: ['en-US'] })),
      getPermissionsAsync: vi.fn(async () => ({
        granted: true,
        status: 'granted',
        canAskAgain: true,
      })),
      requestPermissionsAsync: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      androidTriggerOfflineModelDownload: vi.fn(),
    },
  };
});
vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: { currentState: 'active' },
}));
vi.mock('expo-speech-recognition', () => ({ ExpoSpeechRecognitionModule: native }));
import { ExpoSpeechTranscriber } from '../app/src/services/speech/ExpoSpeechTranscriber';
beforeEach(() => {
  vi.clearAllMocks();
  native.getPermissionsAsync.mockResolvedValue({
    granted: true,
    status: 'granted',
    canAskAgain: true,
  });
  native.getSupportedLocales.mockResolvedValue({ installedLocales: ['en-US'] });
});
it('requires on-device recognition and waits for a late final after stop', async () => {
  const speech = new ExpoSpeechTranscriber();
  await speech.start({ locale: 'en-US', text: 'Before.' });
  expect(native.start).toHaveBeenCalledWith(
    expect.objectContaining({
      requiresOnDeviceRecognition: true,
      recordingOptions: { persist: false },
    }),
  );
  const result = speech.stop();
  const overlappingStop = speech.stop();
  expect(native.stop).toHaveBeenCalledTimes(1);
  events.get('result')?.({ isFinal: true, results: [{ transcript: 'After.' }] });
  events.get('end')?.();
  expect(await result).toBe('Before. After.');
  expect(await overlappingStop).toBe('Before. After.');
  speech.dispose();
});
it('does not start for denied permission or missing offline language model', async () => {
  const speech = new ExpoSpeechTranscriber();
  native.getPermissionsAsync.mockResolvedValue({
    granted: false,
    status: 'denied',
    canAskAgain: true,
  });
  await expect(speech.start({ locale: 'en-US', text: '' })).rejects.toThrow('permission');
  expect(native.requestPermissionsAsync).not.toHaveBeenCalled();
  native.getSupportedLocales.mockResolvedValue({ installedLocales: [] });
  expect(await speech.checkAvailability('en-US')).toMatchObject({
    available: false,
    canDownloadModel: true,
  });
  await expect(speech.start({ locale: 'en-US', text: '' })).rejects.toThrow('not installed');
  expect(native.start).not.toHaveBeenCalled();
  speech.dispose();
});
it('preserves interim text on finalization timeout and ignores late native results', async () => {
  vi.useFakeTimers();
  try {
    const speech = new ExpoSpeechTranscriber();
    await speech.start({ locale: 'en-US', text: 'Saved.' });
    events.get('result')?.({ isFinal: false, results: [{ transcript: 'Last sentence.' }] });
    const stopped = speech.stop();
    await vi.advanceTimersByTimeAsync(2000);
    expect(await stopped).toBe('Saved. Last sentence.');
    const listener = vi.fn();
    speech.subscribe(listener);
    events.get('result')?.({ isFinal: true, results: [{ transcript: 'Late duplicate.' }] });
    expect(listener).not.toHaveBeenCalled();
    speech.dispose();
  } finally {
    vi.useRealTimers();
  }
});
