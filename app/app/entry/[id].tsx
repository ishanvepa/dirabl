import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Text, TextInput } from 'react-native';
import { useFocusEffect, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRepositories } from '../../src/services/database/context';
import { type JournalEntry, statusText, isStale } from '../../src/types/journal';
import { Body, Busy, Button, Heading, Notice, Screen, styles } from '../../src/components/ui';
import { createSynthesisClient } from '../../src/services/api/synthesisClient';
import { SynthesisService } from '../../src/features/synthesis/SynthesisService';
import { ensureConsent } from '../../src/features/synthesis/consent';
import { consumeAutomaticTicket } from '../../src/features/journal/finishEntry';
import { appearsOnline } from '../../src/services/connectivity';
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { journal, settings } = useRepositories();
  const network = useNetInfo(),
    online = appearsOnline(network);
  const service = useMemo(
    () =>
      new SynthesisService(
        journal,
        createSynthesisClient(process.env.EXPO_PUBLIC_SYNTHESIS_API_URL),
        randomUUID,
      ),
    [journal],
  );
  const [entry, setEntry] = useState<JournalEntry | null>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(''),
    [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'story' | 'transcript'>('transcript'),
    initial = useRef(true),
    running = useRef(false);
  const dirty = editing && draft !== entry?.rawTranscript;
  usePreventRemove(dirty, ({ repeat }) =>
    Alert.alert('Discard transcript edits?', 'Your saved transcript will be kept.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard edits',
        style: 'destructive',
        onPress: () => {
          setEditing(false);
          repeat();
        },
      },
    ]),
  );
  const load = useCallback(async () => {
    try {
      const result = await journal.getById(id);
      setEntry(result);
      setError('');
      if (initial.current) {
        setTab(result?.synthesizedStory ? 'story' : 'transcript');
        initial.current = false;
      }
      return result;
    } catch {
      setError('Could not open your entry. Please retry.');
      return null;
    } finally {
      setLoaded(true);
    }
  }, [id, journal]);
  const synthesize = useCallback(
    async (automatic = false) => {
      if (running.current) return;
      running.current = true;
      setBusy(true);
      setError('');
      try {
        const allowed = automatic
          ? (await settings.get('consent')) && (await settings.get('autoSynthesis'))
          : await ensureConsent(settings);
        if (allowed) {
          const applied = await service.run(id);
          if (applied) setTab('story');
          await load();
        }
      } catch (e) {
        await load();
        setError(e instanceof Error ? e.message : 'Could not synthesize. Please retry.');
      } finally {
        setBusy(false);
        running.current = false;
      }
    },
    [id, load, service, settings],
  );
  useFocusEffect(
    useCallback(() => {
      let focused = true;
      void load().then((result) => {
        if (
          focused &&
          result?.synthesisStatus === 'ready_to_synthesize' &&
          consumeAutomaticTicket(id)
        )
          void synthesize(true);
      });
      return () => {
        focused = false;
      };
    }, [id, load, synthesize]),
  );
  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      setEntry(await journal.updateTranscript(id, draft));
      setEditing(false);
      setTab('transcript');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes. Please retry.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      {!loaded ? (
        <Busy />
      ) : entry ? (
        <>
          <Heading>{entry.title || 'Untitled Entry'}</Heading>
          <Text style={styles.muted}>{new Date(entry.createdAt).toLocaleString()}</Text>
          {!!entry.tags.length && <Text style={styles.muted}>{entry.tags.join(' · ')}</Text>}
          <Notice>{busy ? 'Synthesizing your entry…' : statusText[entry.synthesisStatus]}</Notice>
          {isStale(entry) && (
            <Notice>The story is from an earlier transcript. Synthesize again to update it.</Notice>
          )}
          {entry.synthesizedStory && (
            <Button
              title={tab === 'story' ? 'Story · Selected' : 'Story'}
              onPress={() => setTab('story')}
            />
          )}
          <Button
            title={tab === 'transcript' ? 'Original Transcript · Selected' : 'Original Transcript'}
            onPress={() => setTab('transcript')}
          />
          {editing ? (
            <>
              <TextInput
                accessibilityLabel="Edit original transcript"
                multiline
                editable={!saving}
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
              />
              <Button
                title="Save Transcript"
                disabled={saving || !draft.trim()}
                onPress={() => void saveEdit()}
              />
              <Button
                title="Cancel Edits"
                disabled={saving}
                onPress={() => {
                  if (!dirty) setEditing(false);
                  else
                    Alert.alert('Discard edits?', 'The saved transcript will be kept.', [
                      { text: 'Keep editing', style: 'cancel' },
                      { text: 'Discard', style: 'destructive', onPress: () => setEditing(false) },
                    ]);
                }}
              />
            </>
          ) : (
            <>
              <Body>
                {tab === 'story' && entry.synthesizedStory
                  ? entry.synthesizedStory
                  : entry.rawTranscript}
              </Body>
              <Button
                title="Edit Original Transcript"
                onPress={() => {
                  setDraft(entry.rawTranscript);
                  setEditing(true);
                  setTab('transcript');
                }}
              />
            </>
          )}
          {busy && <Busy />}
          {!online && (
            <Notice>
              You’re offline. Your journal is available here. Synthesize manually when connected.
            </Notice>
          )}
          {(!entry.synthesizedStory || isStale(entry)) && (
            <Button
              title={
                entry.synthesisStatus === 'synthesis_failed'
                  ? 'Retry Synthesis'
                  : 'Synthesize Entry'
              }
              disabled={!online || busy || editing || entry.synthesisStatus === 'synthesizing'}
              onPress={() => void synthesize()}
            />
          )}
          {!!entry.lastSynthesisError && <Notice>{entry.lastSynthesisError}</Notice>}
        </>
      ) : (
        <Notice>Entry not found.</Notice>
      )}
      {!!error && (
        <Notice>
          {error}
          <Button title="Reload entry" onPress={() => void load()} />
        </Notice>
      )}
    </Screen>
  );
}
