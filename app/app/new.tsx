import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Text, TextInput } from 'react-native';
import { router, usePreventRemove } from 'expo-router';

import { useRepositories } from '../src/services/database/context';
import { Body, Button, Heading, Notice, Screen, styles } from '../src/components/ui';
import { createSpeechTranscriber } from '../src/services/speech/createSpeechTranscriber';
import type { Availability, SpeechTranscriber } from '../src/services/speech/SpeechTranscriber';
import { onlineAtFinish } from '../src/services/connectivity';
import { finishEntry } from '../src/features/journal/finishEntry';
export default function NewEntry() {
  const { journal, settings } = useRepositories();
  const [text, setText] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [active, setActive] = useState(false),
    [interim, setInterim] = useState(''),
    [availability, setAvailability] = useState<Availability>();
  const speech = useRef<SpeechTranscriber | null>(null),
    textRef = useRef(''),
    saved = useRef(false),
    [didSave, setDidSave] = useState(false);
  usePreventRemove(!didSave && !!(text || interim || active), ({ repeat }) => {
    Alert.alert('Leave this entry?', 'Your unsaved text will be discarded.', [
      { text: 'Keep writing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setDidSave(true);
          repeat();
        },
      },
    ]);
  });
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void createSpeechTranscriber()
      .then(async (transcriber) => {
        if (disposed) {
          transcriber.dispose();
          return;
        }
        speech.current = transcriber;
        unsubscribe = transcriber.subscribe((snapshot) => {
          setText(snapshot.committedText);
          textRef.current = snapshot.committedText;
          setInterim(snapshot.interimText);
          setActive(snapshot.active);
          if (snapshot.message) setError(snapshot.message);
        });
        const result = await transcriber.checkAvailability('en-US');
        if (!disposed) setAvailability(result);
      })
      .catch(() => {
        if (!disposed)
          setAvailability({
            available: false,
            manualOnly: true,
            reason:
              'Could not initialize local dictation. Use a development build with speech support, or type below.',
          });
      });
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active')
        void speech.current?.stop().catch(() => setError('Dictation stopped. Review your text.'));
    });
    return () => {
      disposed = true;
      unsubscribe?.();
      appState.remove();
      speech.current?.dispose();
      speech.current = null;
    };
  }, []);
  async function dictate() {
    setError('');
    setBusy(true);
    try {
      await speech.current?.start({ locale: 'en-US', text: textRef.current });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dictation is unavailable. Type below.');
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (saved.current || busy) return;
    setBusy(true);
    try {
      const final = active ? await speech.current!.stop() : textRef.current;
      const entry = await finishEntry(journal, settings, final, await onlineAtFinish());
      saved.current = true;
      setDidSave(true);
      setTimeout(() => router.replace(`/entry/${entry.id}`), 0);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not save. Your text is still here; please retry.',
      );
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    try {
      await speech.current?.downloadModel('en-US');
      setAvailability(await speech.current?.checkAvailability('en-US'));
      setError(
        'If the download is pending, finish it in device Settings, then reopen this screen.',
      );
    } catch {
      setError(
        'The language model could not be downloaded. Use device speech Settings or type below.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading>What’s on your mind?</Heading>
      {availability && !availability.manualOnly && (
        <Body>
          Dictation stays on this device. Microphone access is used only while this screen is
          active.
        </Body>
      )}
      {availability?.reason && <Notice>{availability.reason}</Notice>}
      {availability?.canDownloadModel && (
        <Button
          title="Download offline English model"
          disabled={busy}
          onPress={() => void download()}
        />
      )}
      {availability && !availability.manualOnly && (
        <Button
          title={active ? 'Listening…' : 'Start Dictating'}
          disabled={!availability?.available || busy || active}
          onPress={() => void dictate()}
        />
      )}
      {active && <Notice>Listening on-device. Tap Finish Entry when you’re ready.</Notice>}
      <TextInput
        accessibilityLabel="Journal transcript"
        multiline
        editable={!active && !busy}
        value={text}
        onChangeText={(value) => {
          setText(value);
          textRef.current = value;
        }}
        style={styles.input}
        placeholder={availability?.manualOnly ? 'Write here…' : 'Speak or write here…'}
      />
      {!!interim && (
        <Text accessibilityLiveRegion="polite" style={[styles.body, { fontStyle: 'italic' }]}>
          {interim}
        </Text>
      )}
      {!!error && <Notice>{error}</Notice>}
      {availability && !availability.manualOnly && (
        <Button title="Open device Settings" onPress={() => void Linking.openSettings()} />
      )}
      <Button
        title={busy ? 'Please wait…' : 'Finish Entry'}
        disabled={busy || (!text.trim() && !interim.trim() && !active)}
        onPress={() => void finish()}
      />
    </Screen>
  );
}
