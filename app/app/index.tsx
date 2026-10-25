import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useRepositories } from '../src/services/database/context';
import { type JournalEntry } from '../src/types/journal';
import {
  Busy,
  Button,
  Caption,
  DesignIcon,
  Header,
  Heading,
  Label,
  Notice,
  Pill,
  ReadingText,
  Rule,
  Screen,
  TextButton,
  colors,
  fonts,
  styles,
} from '../src/components/ui';
import { friendlyTimestamp, journalDay, shortDate } from '../src/utils/dates';

const libraryStatus = (entry: JournalEntry) =>
  ({
    synthesized: 'STORY READY',
    synthesizing: 'CREATING A STORY',
    synthesis_failed: 'SAVED · RETRY AVAILABLE',
    transcribed_offline: 'SAVED OFFLINE',
    ready_to_synthesize: 'ORIGINAL SAVED',
  })[entry.synthesisStatus];
export default function Library() {
  const { journal } = useRepositories();
  const [entries, setEntries] = useState<JournalEntry[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    journal
      .list()
      .then(setEntries)
      .catch(() => setError('Could not read your journal. Please try again.'))
      .finally(() => setLoading(false));
  }, [journal]);
  useFocusEffect(load);
  const latest = entries[0],
    others = entries.slice(1);
  function open(entry: JournalEntry) {
    router.push(`/entry/${entry.id}`);
  }
  return (
    <Screen
      header={<Header brand onMore={() => router.push('/settings')} />}
      footerBorder={!!latest}
      footer={
        !loading && !error ? (
          <>
            <Button
              title={latest ? '＋   New entry' : 'Write your first entry'}
              onPress={() => router.push('/new')}
            />
            <Caption>
              {latest
                ? 'PRIVATE BY DEFAULT   •   SAVED ON DEVICE'
                : 'PRIVATE. PERSONAL. JUST FOR YOU.'}
            </Caption>
          </>
        ) : undefined
      }
    >
      {loading ? (
        <Busy />
      ) : error ? (
        <Notice warning>
          {error}
          <Button title="Try again" onPress={load} />
        </Notice>
      ) : latest ? (
        <>
          <Label style={{ color: colors.muted }}>{journalDay(new Date(), true)}</Label>
          <Heading style={s.libraryHeading}>{'A collection of\nlittle moments.'}</Heading>
          <View style={{ marginTop: 18 }}>
            <Pill>
              {String(entries.length).padStart(2, '0')} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
            </Pill>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open latest entry: ${latest.title || 'Untitled entry'}`}
            onPress={() => open(latest)}
            style={({ pressed }) => [s.featured, pressed && styles.pressed]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Label style={{ color: colors.accent, width: '57%' }}>LATEST ENTRY</Label>
              <Label style={{ color: colors.accent }}>
                01 / {String(entries.length).padStart(2, '0')}
              </Label>
            </View>
            <Heading numberOfLines={3} style={s.featuredTitle}>
              {latest.title || 'Untitled entry'}
            </Heading>
            <View style={[styles.row, { marginTop: 'auto', paddingTop: 12 }]}>
              <Text style={s.featuredDate}>{friendlyTimestamp(latest.createdAt)}</Text>
              <View style={s.arrowCircle}>
                <DesignIcon name="arrow" />
              </View>
            </View>
          </Pressable>
          {!!others.length && (
            <>
              <View style={[styles.row, { marginTop: 22, marginBottom: 8 }]}>
                <Label style={{ color: colors.muted }}>MORE FROM YOUR JOURNAL</Label>
                <TextButton
                  title={showAll ? 'Show less  ↑' : 'See all  ↗'}
                  onPress={() => setShowAll((value) => !value)}
                  style={{ color: colors.forest, fontFamily: fonts.semibold }}
                />
              </View>
              <Rule />
              {(showAll ? others : others.slice(0, 2)).map((entry) => (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${entry.title || 'Untitled entry'}`}
                  onPress={() => open(entry)}
                  style={({ pressed }) => [s.listEntry, pressed && styles.pressed]}
                >
                  <Label>
                    {shortDate(entry.createdAt)} • {libraryStatus(entry)}
                  </Label>
                  <Heading style={s.listTitle}>{entry.title || 'Untitled entry'}</Heading>
                  <Text numberOfLines={2} style={s.preview}>
                    {entry.synthesizedStory || entry.rawTranscript}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
        </>
      ) : (
        <>
          <Label style={{ marginTop: 4, color: colors.muted }}>YOUR OWN LITTLE ARCHIVE</Label>
          <Heading style={s.emptyHeading}>{'It all begins\nwith a thought.'}</Heading>
          <Rule style={{ marginTop: 44 }} />
          <Text style={s.quote}>“</Text>
          <ReadingText style={s.emptyDescription}>
            {
              'A space for the things you\nwant to remember, the feelings\nyou want to untangle, and the\ndays worth writing down.'
            }
          </ReadingText>
        </>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  libraryHeading: { marginTop: 12, fontSize: 49, lineHeight: 51 },
  featured: {
    marginTop: 16,
    backgroundColor: colors.forest,
    borderRadius: 22,
    padding: 22,
    minHeight: 208,
  },
  featuredTitle: {
    color: colors.surface,
    fontSize: 36,
    lineHeight: 39,
    marginTop: 24,
    flexShrink: 1,
  },
  featuredDate: { fontFamily: fonts.medium, color: colors.surface, fontSize: 12, lineHeight: 17 },
  arrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listEntry: { paddingVertical: 20, borderBottomColor: colors.border, borderBottomWidth: 1 },
  listTitle: { fontSize: 27, lineHeight: 32, marginTop: 6 },
  preview: {
    fontFamily: fonts.regular,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  emptyHeading: { marginTop: 24, fontSize: 51, lineHeight: 54 },
  quote: {
    fontFamily: fonts.editorial,
    fontSize: 140,
    lineHeight: 140,
    color: colors.accent,
    marginTop: 14,
    includeFontPadding: false,
  },
  emptyDescription: { fontSize: 17, lineHeight: 26, marginTop: 28 },
});
