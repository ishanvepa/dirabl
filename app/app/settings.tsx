import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body,
  Button,
  Caption,
  Header,
  Heading,
  Label,
  Notice,
  ReadingChoice,
  Rule,
  Screen,
  TextButton,
  Toggle,
  colors,
  fonts,
  styles,
} from '../src/components/ui';
import { useRepositories } from '../src/services/database/context';
import { useSynthesisConsent } from '../src/features/synthesis/ConsentProvider';
import { usePreferences } from '../src/features/preferences/PreferencesProvider';
import type { ReadingView } from '../src/services/database/settingsRepository';

export default function Settings() {
  const { settings } = useRepositories(),
    preferences = usePreferences(),
    requestConsent = useSynthesisConsent();
  const [auto, setAuto] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState('');
  const [name, setName] = useState(preferences.displayName),
    [notice, setNotice] = useState('');
  useEffect(() => {
    setName(preferences.displayName);
  }, [preferences.displayName]);
  useEffect(() => {
    settings
      .get('autoSynthesis')
      .then(setAuto)
      .catch(() => setError('Could not read settings.'))
      .finally(() => setBusy(false));
  }, [settings]);
  async function toggle(value: boolean) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (!value || (await requestConsent('automatic'))) {
        await settings.set('autoSynthesis', value);
        setAuto(value);
      }
    } catch {
      setError('Could not save settings. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    setBusy(true);
    setError('');
    try {
      await settings.set('autoSynthesis', false);
      await settings.set('consent', false);
      setAuto(false);
      setNotice('AI sharing reset. You’ll be asked before sending another transcript.');
    } catch {
      setError('Could not reset consent. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function saveName() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await preferences.updateName(name);
      setNotice('Your journal name has been saved on this device.');
    } catch {
      setError('Could not save your name. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function setView(view: ReadingView) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await preferences.updateReadingView(view);
    } catch {
      setError('Could not save your reading preference. Please try again.');
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
          title="SETTINGS"
          onBack={back}
          onMore={() =>
            Alert.alert(
              'dirabl',
              'A private place for your thoughts. Your journal is saved on this device.',
            )
          }
        />
      }
    >
      <Label>PRIVATE BY DESIGN</Label>
      <Heading style={s.heading}>Yours to keep.</Heading>
      <Body style={s.intro}>
        Your journal lives here, on your device. You decide when your words leave it.
      </Body>
      <Rule style={{ marginTop: 33 }} />
      <Label style={s.sectionLabel}>{'01    YOUR JOURNAL'}</Label>
      <Heading style={s.sectionHeading}>Stored on this device</Heading>
      <Body style={s.description}>
        Entries can be read and edited offline. No account is needed.
      </Body>
      <Rule style={{ marginTop: 32 }} />
      <Label style={s.sectionLabel}>{'02    OPTIONAL AI'}</Label>
      <View style={[styles.row, { marginTop: 8, gap: 12 }]}>
        <Body style={s.settingTitle}>Automatic online synthesis</Body>
        <Toggle
          value={auto}
          disabled={busy}
          onChange={(value) => void toggle(value)}
          label="Automatic online synthesis"
        />
      </View>
      <Body style={[s.description, { marginTop: 16 }]}>
        Off by default. When enabled, new entries may be sent to the dirabl backend and OpenAI after
        you finish.
      </Body>
      <Rule style={{ marginTop: 36, marginBottom: 4 }} />
      <View style={styles.row}>
        <TextButton
          title="Review AI data sharing"
          onPress={() => void requestConsent('review')}
          style={{ color: colors.ink, fontSize: 14 }}
        />
        <Body style={{ color: colors.ink, fontSize: 18 }}>↗</Body>
      </View>
      <View style={{ alignItems: 'flex-start', marginTop: 14 }}>
        <TextButton
          title="Reset synthesis consent"
          disabled={busy}
          onPress={() => void revoke()}
          style={{ color: colors.orange, fontSize: 14 }}
        />
      </View>
      {!!notice && (
        <Body
          accessibilityLiveRegion="polite"
          style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}
        >
          {notice}
        </Body>
      )}
      {!!error && <Notice warning>{error}</Notice>}
      <Caption style={s.encryption}>The SQLite journal is not separately encrypted.</Caption>
      <Rule style={{ marginTop: 30 }} />
      <Label style={s.sectionLabel}>{'03    MAKE IT YOURS'}</Label>
      <Label style={{ marginTop: 18, marginBottom: 12 }}>YOUR NAME</Label>
      <TextInput
        accessibilityLabel="Your journal name"
        editable={!busy}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={colors.muted}
        maxLength={80}
        autoCapitalize="words"
        style={s.nameInput}
      />
      {name.trim() !== preferences.displayName && (
        <Button
          title="Save name"
          disabled={busy}
          onPress={() => void saveName()}
          style={{ marginTop: 12 }}
        />
      )}
      <Label style={{ marginTop: 28, marginBottom: 14 }}>OPEN ENTRIES WITH</Label>
      <View accessibilityRole="radiogroup" style={{ gap: 14, opacity: busy ? 0.6 : 1 }}>
        <ReadingChoice
          selected={preferences.preferredReadingView === 'story'}
          title="Story first"
          description="Read the polished version when available"
          onPress={() => !busy && void setView('story')}
        />
        <ReadingChoice
          selected={preferences.preferredReadingView === 'transcript'}
          title="Original first"
          description="Always start with exactly what you said"
          onPress={() => !busy && void setView('transcript')}
        />
      </View>
      <TextButton
        title="Review your setup   ↗"
        onPress={() => router.push('/onboarding')}
        style={{ color: colors.forest, marginTop: 24 }}
      />
      <Caption style={{ marginTop: 16 }}>YOUR NAME AND PREFERENCES STAY ON THIS DEVICE.</Caption>
    </Screen>
  );
}
const s = StyleSheet.create({
  heading: { fontSize: 48, lineHeight: 53, marginTop: 22 },
  intro: { marginTop: 26, lineHeight: 23 },
  sectionLabel: { marginTop: 20 },
  sectionHeading: { fontSize: 21, lineHeight: 27, marginTop: 12 },
  description: { fontSize: 13, lineHeight: 20, marginTop: 18 },
  settingTitle: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 14, flex: 1 },
  encryption: { textAlign: 'left', marginTop: 28, fontSize: 10, lineHeight: 15 },
  nameInput: { ...styles.input, minHeight: 0, height: 64, paddingVertical: 12, fontSize: 24 },
});
