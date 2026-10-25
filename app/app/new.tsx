import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, usePreventRemove } from 'expo-router';
import { useRepositories } from '../src/services/database/context';
import {
  Body,
  Button,
  Caption,
  DesignIcon,
  Header,
  Heading,
  Label,
  Notice,
  ReadingText,
  Rule,
  Screen,
  TextButton,
  colors,
  fonts,
  styles,
} from '../src/components/ui';
import { ExpoSpeechTranscriber } from '../src/services/speech/ExpoSpeechTranscriber';
import type { Availability, SpeechTranscriber } from '../src/services/speech/SpeechTranscriber';
import { onlineAtFinish } from '../src/services/connectivity';
import { finishEntry } from '../src/features/journal/finishEntry';
import { journalTimestamp } from '../src/utils/dates';

export default function NewEntry() {
  const { journal, settings } = useRepositories();
  const [text, setText] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [active, setActive] = useState(false),
    [interim, setInterim] = useState('');
  const [availability, setAvailability] = useState<Availability>();
  const speech = useRef<SpeechTranscriber | null>(null),
    textRef = useRef('');
  const saved = useRef(false),
    [didSave, setDidSave] = useState(false),
    created = useRef(new Date());
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
    const transcriber = new ExpoSpeechTranscriber();
    speech.current = transcriber;
    const unsubscribe = transcriber.subscribe((snapshot) => {
      setText(snapshot.committedText);
      textRef.current = snapshot.committedText;
      setInterim(snapshot.interimText);
      setActive(snapshot.active);
      if (snapshot.message) setError(snapshot.message);
    });
    void transcriber
      .checkAvailability('en-US')
      .then((result) => {
        if (!disposed) setAvailability(result);
      })
      .catch(() => {
        if (!disposed)
          setAvailability({
            available: false,
            reason: 'Could not check local speech support. You can type your entry.',
          });
      });
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active')
        void transcriber.stop().catch(() => setError('Dictation stopped. Review your text.'));
    });
    return () => {
      disposed = true;
      unsubscribe();
      appState.remove();
      transcriber.dispose();
      speech.current = null;
    };
  }, []);
  async function dictate() {
    setError('');
    setBusy(true);
    try {
      await speech.current?.start({ locale: 'en-US', text: textRef.current });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Dictation is unavailable. You can type your entry.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (saved.current || busy) return;
    setBusy(true);
    setError('');
    try {
      const final = active ? await speech.current!.stop() : textRef.current;
      const entry = await finishEntry(journal, settings, final, await onlineAtFinish());
      saved.current = true;
      setDidSave(true);
      setTimeout(() => router.replace(`/entry/${entry.id}`), 0);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not save. Your text is still here; please try again.',
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
        'The language model could not be downloaded. Use device speech Settings or type your entry.',
      );
    } finally {
      setBusy(false);
    }
  }
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  return (
    <Screen
      header={
        <Header
          title="NEW ENTRY"
          onBack={back}
          right={
            <Label style={{ color: colors.muted, fontFamily: fonts.medium }}>
              {active ? 'ON DEVICE  ●' : 'PRIVATE  ●'}
            </Label>
          }
        />
      }
      footer={
        <>
          {!active && (!availability || availability.reason) && (
            <Caption style={{ fontSize: 11, lineHeight: 16, textAlign: 'left' }}>
              {availability?.reason || 'Checking on-device dictation. You can type your entry.'}
            </Caption>
          )}
          {!active && (
            <Button
              title={availability ? '◉   Start dictating' : 'Checking dictation…'}
              onPress={() => void dictate()}
              disabled={!availability?.available || busy}
            />
          )}
          <Button
            title={busy ? 'Please wait…' : 'Finish entry'}
            variant={active ? 'primary' : text.trim() ? 'accent' : 'quiet'}
            disabled={busy || (!text.trim() && !interim.trim() && !active)}
            loading={busy}
            onPress={() => void finish()}
          />
          {active && <Caption>Audio is not saved · Text stays on device</Caption>}
        </>
      }
    >
      <Heading style={active ? s.activeHeading : s.heading}>
        {active ? 'Your words,\nas they come.' : 'What’s on\nyour mind?'}
      </Heading>
      {active ? (
        <>
          <Label style={{ marginTop: 24 }}>LIVE DICTATION</Label>
          <View style={s.micHalo}>
            <View style={s.micCircle}>
              <DesignIcon name="microphone" />
            </View>
          </View>
          <Text accessibilityLiveRegion="polite" style={s.listening}>
            ● Listening…
          </Text>
          <View style={s.liveCard}>
            {text ? (
              <ReadingText style={{ fontSize: 21 }}>{text}</ReadingText>
            ) : (
              <Body>Your words will appear here as you speak.</Body>
            )}
            {!!interim && (
              <Text accessibilityLiveRegion="polite" style={s.interim}>
                {interim}
              </Text>
            )}
          </View>
        </>
      ) : (
        <>
          <Label style={s.timestamp}>{journalTimestamp(created.current)}</Label>
          <View style={s.editor}>
            {!text && (
              <View
                pointerEvents="none"
                importantForAccessibility="no-hide-descendants"
                style={s.paperLines}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Rule key={i} style={{ marginBottom: 37 }} />
                ))}
              </View>
            )}
            <TextInput
              accessibilityLabel="Journal transcript"
              multiline
              editable={!busy}
              value={text}
              onChangeText={(value) => {
                setText(value);
                textRef.current = value;
              }}
              accessibilityHint="Start writing here, or use your voice. There’s no right way to begin."
              selectionColor={colors.forest}
              style={s.textInput}
            />
            {!text && (
              <View
                pointerEvents="none"
                importantForAccessibility="no-hide-descendants"
                style={s.placeholder}
              >
                <ReadingText style={{ fontSize: 18, lineHeight: 29, color: colors.muted }}>
                  {'Start writing here, or use your voice.\nThere’s no right way to begin.'}
                </ReadingText>
              </View>
            )}
          </View>
          <Body style={s.localNote}>● Dictation stays on your device</Body>
          {availability?.reason && (
            <View style={{ marginTop: 16, gap: 8 }}>
              {availability.canDownloadModel && (
                <TextButton
                  title="Download offline English model"
                  disabled={busy}
                  onPress={() => void download()}
                  style={{ color: colors.forest }}
                />
              )}
              <TextButton
                title="Open device Settings  ↗"
                onPress={() => void Linking.openSettings()}
              />
            </View>
          )}
        </>
      )}
      {!!error && <Notice warning>{error}</Notice>}
    </Screen>
  );
}
const s = StyleSheet.create({
  heading: { fontSize: 50, lineHeight: 54 },
  activeHeading: { fontSize: 48, lineHeight: 53 },
  timestamp: { color: colors.muted, marginTop: 26, marginBottom: 20 },
  editor: {
    minHeight: 330,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    overflow: 'hidden',
  },
  textInput: {
    ...styles.input,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    minHeight: 330,
    fontSize: 18,
  },
  paperLines: { position: 'absolute', left: 20, right: 20, top: 128 },
  placeholder: { position: 'absolute', left: 20, right: 20, top: 20 },
  localNote: {
    color: colors.forest,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 16,
  },
  micHalo: {
    alignSelf: 'center',
    width: 147,
    height: 147,
    borderRadius: 74,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  micCircle: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listening: {
    fontFamily: fonts.semibold,
    color: colors.forest,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 15,
  },
  liveCard: { ...styles.card, marginTop: 34, minHeight: 203 },
  interim: {
    fontFamily: fonts.italic,
    color: colors.muted,
    fontSize: 20,
    lineHeight: 28,
    marginTop: 18,
    includeFontPadding: false,
  },
});
