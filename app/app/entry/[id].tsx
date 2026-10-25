import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRepositories } from '../../src/services/database/context';
import { type JournalEntry, isStale } from '../../src/types/journal';
import {
  Body,
  Busy,
  Button,
  Caption,
  Header,
  Heading,
  Label,
  Notice,
  Pill,
  ReadingText,
  Screen,
  TextButton,
  colors,
  fonts,
  styles,
} from '../../src/components/ui';
import { createSynthesisClient } from '../../src/services/api/synthesisClient';
import { SynthesisService } from '../../src/features/synthesis/SynthesisService';
import { useSynthesisConsent } from '../../src/features/synthesis/ConsentProvider';
import { usePreferences } from '../../src/features/preferences/PreferencesProvider';
import { consumeAutomaticTicket } from '../../src/features/journal/finishEntry';
import { appearsOnline } from '../../src/services/connectivity';
import { journalTimestamp } from '../../src/utils/dates';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { journal, settings } = useRepositories();
  const { preferredReadingView } = usePreferences(),
    requestConsent = useSynthesisConsent();
  const online = appearsOnline(useNetInfo());
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
    [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(''),
    [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'story' | 'transcript'>('transcript');
  const initial = useRef(true),
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
        setTab(
          result?.synthesizedStory && preferredReadingView === 'story' ? 'story' : 'transcript',
        );
        initial.current = false;
      }
      return result;
    } catch {
      setError('Could not open your entry. Please try again.');
      return null;
    } finally {
      setLoaded(true);
    }
  }, [id, journal, preferredReadingView]);
  const synthesize = useCallback(
    async (automatic = false) => {
      if (running.current) return;
      running.current = true;
      setError('');
      try {
        const allowed = automatic
          ? (await settings.get('consent')) && (await settings.get('autoSynthesis'))
          : await requestConsent();
        if (allowed) {
          setBusy(true);
          const applied = await service.run(id);
          if (applied) setTab(preferredReadingView);
          await load();
        }
      } catch (e) {
        await load();
        setError(e instanceof Error ? e.message : 'Could not synthesize. Please try again.');
      } finally {
        setBusy(false);
        running.current = false;
      }
    },
    [id, load, service, settings, requestConsent, preferredReadingView],
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
  function beginEdit() {
    if (entry) {
      setDraft(entry.rawTranscript);
      setEditing(true);
      setError('');
    }
  }
  function cancelEdit() {
    if (!dirty) {
      setEditing(false);
      return;
    }
    Alert.alert('Discard edits?', 'The saved transcript will be kept.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => setEditing(false) },
    ]);
  }
  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      setEntry(await journal.updateTranscript(id, draft));
      setEditing(false);
      setTab('transcript');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }
  function more() {
    Alert.alert('Your entry', undefined, [
      ...(!editing ? [{ text: 'Edit original transcript', onPress: beginEdit }] : []),
      { text: 'Privacy & settings', onPress: () => router.push('/settings') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  const stale = !!entry && isStale(entry),
    failed = entry?.synthesisStatus === 'synthesis_failed';
  const canSynthesize = !!entry && (!entry.synthesizedStory || stale);
  const failure = error || entry?.lastSynthesisError;
  const footer =
    entry &&
    (editing ? (
      <View style={[styles.row, { gap: 20 }]}>
        <TextButton
          title="Cancel edits"
          onPress={cancelEdit}
          disabled={saving}
          style={{ fontSize: 14 }}
        />
        <Button
          title="Save transcript"
          style={{ flex: 1 }}
          onPress={() => void saveEdit()}
          loading={saving}
          disabled={!draft.trim()}
        />
      </View>
    ) : canSynthesize ? (
      <>
        {!failed && (
          <Body style={{ fontSize: 11, lineHeight: 17 }}>
            Optional: create a more readable story with AI
          </Body>
        )}
        <Button
          title={
            busy
              ? 'Creating your story…'
              : failed
                ? 'Retry synthesis'
                : stale
                  ? 'Update story   ↗'
                  : 'Turn into a story   ↗'
          }
          disabled={!online || busy || entry.synthesisStatus === 'synthesizing'}
          loading={busy}
          onPress={() => void synthesize()}
        />
        <Caption>
          {!online
            ? 'Connect to the internet to create a story'
            : failed
              ? 'Needs an internet connection'
              : 'Requires internet  ·  Your original stays unchanged'}
        </Caption>
      </>
    ) : (
      <View style={s.readyFooter}>
        <Label>● STORY READY</Label>
        <TextButton
          title="Edit original   ↗"
          onPress={beginEdit}
          style={{ color: colors.ink, fontFamily: fonts.semibold, fontSize: 13 }}
        />
      </View>
    ));
  return (
    <Screen
      header={<Header title="ENTRY" onBack={back} onMore={entry ? more : undefined} />}
      footer={footer}
      footerBorder={!editing}
    >
      {!loaded ? (
        <Busy />
      ) : !entry ? (
        <Notice>
          {error || 'Entry not found.'}
          <TextButton title="Try again" onPress={() => void load()} />
        </Notice>
      ) : editing ? (
        <>
          <Label style={{ color: colors.muted }}>EDIT ORIGINAL TRANSCRIPT</Label>
          <Heading style={s.editHeading}>{'Every word is\nyours to change.'}</Heading>
          <TextInput
            accessibilityLabel="Edit original transcript"
            multiline
            editable={!saving}
            style={s.editInput}
            value={draft}
            onChangeText={setDraft}
            selectionColor={colors.forest}
          />
          <Body style={s.editHint}>
            ⓘ Updating your transcript will make the current story out of date until you synthesize
            again.
          </Body>
          {!!error && <Notice warning>{error}</Notice>}
        </>
      ) : (
        <>
          <Label style={{ color: colors.muted }}>{journalTimestamp(entry.createdAt)}</Label>
          <Heading
            style={[
              s.title,
              {
                fontSize: entry.synthesizedStory ? 44 : 49,
                lineHeight: entry.synthesizedStory ? 48 : 54,
              },
            ]}
          >
            {entry.title || 'Untitled entry'}
          </Heading>
          {!!entry.tags.length && (
            <View style={s.tags}>
              {entry.tags.map((tag) => (
                <Pill key={tag}>{tag.toUpperCase()}</Pill>
              ))}
            </View>
          )}
          {busy || entry.synthesisStatus === 'synthesizing' ? (
            <View style={s.status}>
              <Notice title="◌  CREATING YOUR STORY">
                <Body style={{ fontSize: 12 }}>
                  Your original is saved. This can take a moment.
                </Body>
              </Notice>
            </View>
          ) : failed ? (
            <Pressable
              style={s.status}
              accessibilityRole="button"
              accessibilityLabel="Could not create a story. View error details."
              disabled={!failure}
              onPress={() => Alert.alert('Synthesis details', failure || '')}
            >
              <Notice
                warning
                title="○  COULDN’T CREATE A STORY"
                style={{ minHeight: 121, padding: 18, gap: 18 }}
              >
                Your entry is still saved. You can try again whenever you’re ready.
              </Notice>
            </Pressable>
          ) : !entry.synthesizedStory ? (
            <View style={s.status}>
              <Notice title="●  SAVED ON YOUR DEVICE" style={{ paddingVertical: 12, gap: 5 }}>
                <Body style={{ fontSize: 12, lineHeight: 17 }}>
                  Your words are safe, even without AI.
                </Body>
              </Notice>
            </View>
          ) : null}
          {stale && (
            <View style={s.status}>
              <Notice title="YOUR STORY IS FROM AN EARLIER TRANSCRIPT">
                Synthesize again to bring it up to date.
              </Notice>
            </View>
          )}
          <View accessibilityRole="tablist" style={s.tabs}>
            {(['story', 'transcript'] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityLabel={value === 'story' ? 'Story' : 'Original transcript'}
                accessibilityState={{
                  selected: tab === value,
                  disabled: value === 'story' && !entry.synthesizedStory,
                }}
                disabled={value === 'story' && !entry.synthesizedStory}
                onPress={() => setTab(value)}
                style={[s.tab, tab === value && s.selectedTab]}
              >
                <Text style={[s.tabText, tab === value && s.selectedTabText]}>
                  {value === 'story' ? 'Story' : 'Original'}
                </Text>
              </Pressable>
            ))}
          </View>
          {tab === 'story' ? (
            <Body style={s.contentLabel}>A few thoughts from today</Body>
          ) : (
            <Label style={s.originalLabel}>ORIGINAL TRANSCRIPT</Label>
          )}
          <ReadingText style={s.entryText}>
            {tab === 'story' && entry.synthesizedStory
              ? entry.synthesizedStory
              : entry.rawTranscript}
          </ReadingText>
          {!online && (
            <Body style={{ marginTop: 24, fontSize: 12, lineHeight: 18 }}>
              You’re offline. Your saved journal is available here.
            </Body>
          )}
          {!!error && !failed && (
            <View style={{ marginTop: 20 }}>
              <Notice warning>{error}</Notice>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  title: { marginTop: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  status: { marginTop: 24 },
  tabs: {
    flexDirection: 'row',
    padding: 5,
    gap: 3,
    backgroundColor: colors.quiet,
    borderRadius: 16,
    marginTop: 28,
    minHeight: 54,
  },
  tab: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  selectedTab: { backgroundColor: colors.surface },
  tabText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.muted },
  selectedTabText: { fontFamily: fonts.semibold, color: colors.ink },
  contentLabel: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, marginTop: 28 },
  originalLabel: { color: colors.muted, marginTop: 34 },
  entryText: { marginTop: 24 },
  readyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 42,
  },
  editHeading: { fontSize: 43, lineHeight: 49, marginTop: 24 },
  editInput: { ...styles.input, marginTop: 25, minHeight: 380, padding: 18 },
  editHint: { fontSize: 11, lineHeight: 17, marginTop: 14 },
});
