import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Text, TextInput } from 'react-native';
import { router, usePreventRemove } from 'expo-router';

import { useRepositories } from '../src/services/database/context';
import { Body, Button, Heading, Notice, Screen, styles } from '../src/components/ui';
import { ExpoSpeechTranscriber } from '../src/services/speech/ExpoSpeechTranscriber';
import type { Availability } from '../src/services/speech/SpeechTranscriber';
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
  const speech = useRef<ExpoSpeechTranscriber | null>(null),
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
    const transcriber = new ExpoSpeechTranscriber();
    speech.current = transcriber;
    const unsubscribe = transcriber.subscribe((snapshot) => {
      setText(snapshot.committedText);
      textRef.current = snapshot.committedText;
      setInterim(snapshot.interimText);
      setActive(snapshot.active);
      if (snapshot.message) setError(snapshot.message);
    });
    transcriber
      .checkAvailability('en-US')
      .then(setAvailability)
      .catch(() =>
        setAvailability({
          available: false,
          reason: 'Could not check local speech support. You can type your entry.',
        }),
      );
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active')
        void transcriber.stop().catch(() => setError('Dictation stopped. Review your text.'));
    });
    return () => {
      unsubscribe();
      appState.remove();
      transcriber.dispose();
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
      <Body>
        Dictation stays on this device. Microphone access is used only while this screen is active.
      </Body>
      {availability?.reason && <Notice>{availability.reason}</Notice>}
      {availability?.canDownloadModel && (
        <Button
          title="Download offline English model"
          disabled={busy}
          onPress={() => void download()}
        />
      )}
      <Button
        title={active ? 'Listening…' : 'Start Dictating'}
        disabled={!availability?.available || busy || active}
        onPress={() => void dictate()}
      />
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
        placeholder="Speak or write here…"
      />
      {!!interim && (
        <Text accessibilityLiveRegion="polite" style={[styles.body, { fontStyle: 'italic' }]}>
          {interim}
        </Text>
      )}
      {!!error && <Notice>{error}</Notice>}
      <Button title="Open device Settings" onPress={() => void Linking.openSettings()} />
      <Button
        title={busy ? 'Please wait…' : 'Finish Entry'}
        disabled={busy || (!text.trim() && !interim.trim() && !active)}
        onPress={() => void finish()}
      />
    </Screen>
  );
}
