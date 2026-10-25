import { useCallback, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Body,
  Button,
  Caption,
  DesignIcon,
  Header,
  Heading,
  Label,
  Notice,
  Pill,
  ReadingChoice,
  ReadingText,
  Rule,
  Screen,
  TextButton,
  colors,
  fonts,
  styles,
} from '../src/components/ui';
import { usePreferences } from '../src/features/preferences/PreferencesProvider';
import type { ReadingView } from '../src/services/database/settingsRepository';

type Step =
  'welcome' | 'name' | 'handwriting' | 'preview' | 'synthesis' | 'preferences' | 'consent' | 'done';
const stepNumber: Record<Step, number> = {
  welcome: 1,
  name: 2,
  handwriting: 3,
  preview: 3,
  synthesis: 4,
  preferences: 5,
  consent: 6,
  done: 6,
};
const previous: Partial<Record<Step, Step>> = {
  name: 'welcome',
  handwriting: 'name',
  preview: 'handwriting',
  synthesis: 'handwriting',
  preferences: 'synthesis',
  consent: 'preferences',
  done: 'preferences',
};

export default function Onboarding() {
  const preferences = usePreferences();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState(preferences.displayName);
  const [view, setView] = useState<ReadingView>(preferences.preferredReadingView);
  const [choice, setChoice] = useState<'with' | 'without'>('with');
  const [automatic, setAutomatic] = useState(false),
    [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const back = useCallback(() => {
    if (!saving) setStep((current) => previous[current] ?? 'welcome');
  }, [saving]);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (step === 'welcome') return false;
        back();
        return true;
      });
      return () => subscription.remove();
    }, [step, back]),
  );
  function skip() {
    if (step === 'name') {
      setName('');
      setStep('handwriting');
    }
    if (step === 'handwriting' || step === 'preview') setStep('synthesis');
    if (step === 'synthesis') {
      setAutomatic(false);
      setStep('preferences');
    }
    if (step === 'preferences') setStep(automatic ? 'consent' : 'done');
    if (step === 'consent') {
      setAutomatic(false);
      setConsent(false);
      setStep('done');
    }
  }
  async function finish(destination: '/' | '/new') {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await preferences.finishOnboarding({
        displayName: name,
        preferredReadingView: view,
        autoSynthesis: automatic,
        consent,
      });
      router.replace(destination);
    } catch {
      setError('Could not save your setup. Your journal is still here; please try again.');
      setSaving(false);
    }
  }

  const isBookend = step === 'welcome' || step === 'done';
  const header = isBookend ? (
    <Header brand right={<Pill>{step === 'welcome' ? 'HELLO' : '✓'}</Pill>} />
  ) : (
    <View>
      <Header
        title={`SETUP  /  ${String(stepNumber[step]).padStart(2, '0')} OF 06`}
        onBack={back}
        right={<TextButton title="Skip" onPress={skip} />}
      />
      <View style={s.progress} accessibilityLabel={`Setup step ${stepNumber[step]} of 6`}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[s.segment, i < stepNumber[step] && s.segmentDone]} />
        ))}
      </View>
    </View>
  );

  let primaryTitle = 'Continue   →',
    primaryAction = () => setStep('name');
  let secondaryTitle: string | undefined, secondaryAction: (() => void) | undefined;
  if (step === 'welcome') {
    primaryTitle = 'Get started   ↗';
  }
  if (step === 'name') {
    primaryAction = () => setStep('handwriting');
    secondaryTitle = 'I’d rather skip this';
    secondaryAction = skip;
  }
  if (step === 'handwriting') {
    primaryTitle = 'Continue without handwriting';
    primaryAction = () => setStep('synthesis');
    secondaryTitle = 'Preview the future upload flow   ↗';
    secondaryAction = () => setStep('preview');
  }
  if (step === 'preview') {
    primaryTitle = 'Looks good   →';
    primaryAction = () => setStep('synthesis');
    secondaryTitle = 'Choose another sample';
    secondaryAction = () => setStep('handwriting');
  }
  if (step === 'synthesis') {
    primaryTitle =
      choice === 'with' ? 'Turn on automatic synthesis' : 'Keep synthesis manual for now';
    primaryAction = () => {
      setAutomatic(choice === 'with');
      setConsent(false);
      setStep('preferences');
    };
    secondaryTitle = 'Keep synthesis manual for now';
    secondaryAction = () => {
      setAutomatic(false);
      setConsent(false);
      setStep('preferences');
    };
  }
  if (step === 'preferences') primaryAction = () => setStep(automatic ? 'consent' : 'done');
  if (step === 'consent') {
    primaryTitle = 'I agree — enable online synthesis';
    primaryAction = () => {
      setConsent(true);
      setAutomatic(true);
      setStep('done');
    };
    secondaryTitle = 'Continue without AI';
    secondaryAction = skip;
  }
  if (step === 'done') {
    primaryTitle = 'Write your first entry   ↗';
    primaryAction = () => void finish('/new');
    secondaryTitle = 'Explore My Journal';
    secondaryAction = () => void finish('/');
  }

  return (
    <Screen
      header={header}
      contentStyle={isBookend ? s.bookend : s.stepContent}
      footer={
        <>
          {!!error && <Notice warning>{error}</Notice>}
          <Button
            title={primaryTitle}
            onPress={primaryAction}
            loading={saving}
            variant={step === 'handwriting' || step === 'consent' ? 'primary' : 'accent'}
          />
          {secondaryTitle && secondaryAction && (
            <TextButton
              title={secondaryTitle}
              onPress={secondaryAction}
              disabled={saving}
              style={
                step === 'done' ? { color: colors.forest, fontFamily: fonts.semibold } : undefined
              }
            />
          )}
          {step === 'welcome' && (
            <Caption style={{ marginTop: 12 }}>NO ACCOUNT NEEDED · ABOUT A MINUTE</Caption>
          )}
          {step === 'preferences' && (
            <Caption style={{ marginTop: 8 }}>YOU CAN CHANGE PREFERENCES LATER</Caption>
          )}
        </>
      }
    >
      {step === 'welcome' && (
        <>
          <Label>A MORE PERSONAL WAY TO JOURNAL</Label>
          <Heading style={s.welcomeTitle}>{'A little room\nfor your life.'}</Heading>
          <Body style={s.welcomeCopy}>
            A private place to speak freely, keep your words, and turn everyday moments into
            something worth revisiting.
          </Body>
          <View style={s.welcomeCard}>
            <Label style={{ color: colors.accent }}>YOUR STORY, IN YOUR OWN WORDS</Label>
            <Heading style={s.quote}>{'Some days, the\nsmallest details\nmean the most.'}</Heading>
            <Rule style={{ marginTop: 20 }} />
            <Caption style={s.quoteCaption}>PRIVATE. PERSONAL. UNCOMPLICATED.</Caption>
          </View>
        </>
      )}
      {step === 'name' && (
        <>
          <Intro
            label="A NOTE FROM YOU TO YOU"
            title={'First, what should\nwe call you?'}
            size={47}
            lineHeight={52}
            description="A name makes this space feel a little more personal. You can always change it later."
          />
          <Label style={{ marginTop: 46, marginBottom: 16 }}>YOUR NAME</Label>
          <TextInput
            accessibilityLabel="Your name"
            value={name}
            onChangeText={setName}
            maxLength={80}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="done"
            style={s.nameInput}
          />
          <View style={s.nameNotice}>
            <View style={{ marginTop: 7 }}>
              <DesignIcon name="lock" />
            </View>
            <View style={{ gap: 8, flex: 1 }}>
              <Text style={s.smallTitle}>Just for your journal</Text>
              <Body style={s.smallCopy}>Your name stays on this device.</Body>
            </View>
          </View>
        </>
      )}
      {step === 'handwriting' && (
        <>
          <Intro
            label="YOUR PERSONAL TOUCH"
            title={'Words in your\nown handwriting.'}
            size={43}
            lineHeight={51}
            description="In an upcoming version, dirabl can make a custom reading font inspired by a sample of your handwriting."
            descriptionSpacing={10}
            small
          />
          <View style={s.comingSoon}>
            <Label>COMING IN A FUTURE UPDATE</Label>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Preview handwriting sample"
            accessibilityHint="Illustrative future feature. No photo is selected or uploaded."
            onPress={() => setStep('preview')}
            style={s.uploadCard}
          >
            <View style={s.uploadCircle}>
              <DesignIcon name="upload" />
            </View>
            <Text style={s.uploadTitle}>Add handwriting sample</Text>
            <Body style={s.smallCopy}>Photo or scanned alphabet · optional</Body>
            <Caption style={{ marginTop: 14 }}>
              Illustrative flow — no upload in current MVP
            </Caption>
          </Pressable>
        </>
      )}
      {step === 'preview' && (
        <>
          <Intro
            label="FUTURE FEATURE  /  PREVIEW"
            title="A little more you."
            size={51}
            lineHeight={58}
            description="An illustration of how a handwriting sample could be reviewed before creating a personal font."
            descriptionSpacing={30}
            small
          />
          <View style={s.sampleCard}>
            <Label>SAMPLE PREVIEW</Label>
            <Rule style={{ marginVertical: 20 }} />
            <Text style={s.sample}>A B C D E F G H I J K L M</Text>
            <Text style={[s.sample, { marginTop: 20 }]}>N O P Q R S T U V W X Y Z</Text>
            <Text style={[s.sample, { fontSize: 25, marginTop: 32 }]}>
              Today was a good day to begin.
            </Text>
            <Caption style={{ textAlign: 'left', marginTop: 26 }}>
              ILLUSTRATIVE ONLY — NOT YOUR GENERATED FONT
            </Caption>
          </View>
        </>
      )}
      {step === 'synthesis' && (
        <>
          <Intro
            label="A HELPFUL OPTION"
            title={'Your words.\nTwo ways to keep them.'}
            size={41}
            lineHeight={47}
            description="Compare the same moment, with and without AI. Your original is preserved either way."
            small
          />
          <View style={s.comparison} accessibilityRole="radiogroup">
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel="Without automatic synthesis"
              accessibilityState={{ checked: choice === 'without' }}
              onPress={() => setChoice('without')}
              style={[s.comparisonCard, choice === 'without' && s.selectedComparison]}
            >
              <Label style={{ color: colors.muted }}>{'WITHOUT\nSYNTHESIS'}</Label>
              <Rule style={{ marginVertical: 16 }} />
              <Heading style={s.comparisonTitle}>{'Original\ntranscript'}</Heading>
              <ReadingText style={s.comparisonText}>
                Went for a walk after work today. It was quiet. Felt better by the time I got home.
              </ReadingText>
              <Caption style={s.comparisonCaption}>Save exactly what you wrote.</Caption>
            </Pressable>
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel="With automatic synthesis"
              accessibilityState={{ checked: choice === 'with' }}
              onPress={() => setChoice('with')}
              style={[s.comparisonCard, choice === 'with' && s.selectedComparison]}
            >
              <View style={s.recommended}>
                <Caption style={{ color: colors.ink, fontFamily: fonts.semibold }}>
                  RECOMMENDED
                </Caption>
              </View>
              <Label style={{ marginTop: 12 }}>{'WITH\nSYNTHESIS'}</Label>
              <Rule style={{ marginVertical: 14 }} />
              <Heading style={s.comparisonTitle}>{'The walk\nI needed'}</Heading>
              <ReadingText style={s.comparisonText}>
                After work, I went for a quiet walk. By the time I got home, I felt a little
                lighter.
              </ReadingText>
              <Caption style={s.comparisonCaption}>Original remains saved.</Caption>
            </Pressable>
          </View>
        </>
      )}
      {step === 'preferences' && (
        <>
          <Intro
            label="FIND YOUR RHYTHM"
            title={'A journal that\nfeels right to read.'}
            size={42}
            lineHeight={47}
            description="Just a few preferences. Nothing here is set in stone."
          />
          <Label style={{ marginTop: 32, marginBottom: 14 }}>OPEN ENTRIES WITH</Label>
          <View accessibilityRole="radiogroup" style={{ gap: 14 }}>
            <ReadingChoice
              selected={view === 'story'}
              title="Story first"
              description="Read the polished version when available"
              onPress={() => setView('story')}
            />
            <ReadingChoice
              selected={view === 'transcript'}
              title="Original first"
              description="Always start with exactly what you said"
              onPress={() => setView('transcript')}
            />
          </View>
          <Rule style={{ marginTop: 36, marginBottom: 20 }} />
          <View style={styles.row}>
            <Label style={{ color: colors.muted }}>GENTLE REMINDERS</Label>
            <View
              accessibilityRole="switch"
              accessibilityLabel="Gentle reminders, planned for a later version"
              accessibilityState={{ disabled: true, checked: false }}
            >
              <DesignIcon name="reminders" />
            </View>
          </View>
          <Body style={[s.smallCopy, { marginTop: 8 }]}>
            Off for now · planned for a later version
          </Body>
        </>
      )}
      {step === 'consent' && (
        <>
          <Intro
            label="PRIVACY COMES FIRST"
            title={'A choice that\nstays yours.'}
            size={47}
            lineHeight={52}
            description="If you enable online synthesis, here’s exactly what happens."
            small
          />
          <View style={s.privacyCard}>
            <PrivacyRow
              number="01"
              title="Your words stay saved here"
              description="Journal entries and transcripts live on your device."
            />
            <Rule />
            <PrivacyRow
              number="02"
              title="AI is an online step"
              description="For synthesis, transcripts go to dirabl’s backend and OpenAI."
            />
            <Rule />
            <PrivacyRow
              number="03"
              title="You remain in control"
              description="Turn automatic synthesis off later; original text stays intact."
            />
          </View>
          <Body style={[s.smallCopy, { marginTop: 16, fontSize: 11 }]}>
            AI may make mistakes. SQLite storage is not separately encrypted. No account is
            required. Provider data handling and retention policies apply.
          </Body>
        </>
      )}
      {step === 'done' && (
        <>
          <Label style={{ marginTop: 18 }}>A PLACE TO CALL YOUR OWN</Label>
          <Heading style={s.doneTitle}>
            {name.trim() ? `You’re all set,\n${name.trim()}.` : 'You’re all set.'}
          </Heading>
          <Body style={{ marginTop: 22 }}>
            Your journal is ready to hold whatever’s on your mind. One entry at a time.
          </Body>
          <View style={s.setupCard}>
            <Label>YOUR SETUP</Label>
            <Rule style={{ marginTop: 16, marginBottom: 18 }} />
            <Body style={s.setupRow}>✓ Personalized journal</Body>
            <Body style={s.setupRow}>
              {automatic && consent
                ? '✓    Automatic synthesis (with consent)'
                : '○    Manual synthesis only'}
            </Body>
            <Body style={[s.setupRow, { color: colors.muted }]}>
              ○ Handwriting style — coming later
            </Body>
            <Caption style={{ textAlign: 'left' }}>Adjust these settings any time.</Caption>
          </View>
        </>
      )}
    </Screen>
  );
}

function Intro({
  label,
  title,
  description,
  size,
  lineHeight,
  small = false,
  descriptionSpacing = 22,
}: {
  label: string;
  title: string;
  description: string;
  size: number;
  lineHeight: number;
  small?: boolean;
  descriptionSpacing?: number;
}) {
  return (
    <>
      <Label>{label}</Label>
      <Heading style={{ fontSize: size, lineHeight, marginTop: 22 }}>{title}</Heading>
      <Body
        style={{
          marginTop: descriptionSpacing,
          fontSize: small ? 14 : 15,
          lineHeight: small ? 22 : 24,
        }}
      >
        {description}
      </Body>
    </>
  );
}
function PrivacyRow({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={s.privacyRow}>
      <Label style={{ width: 25, fontSize: 12 }}>{number}</Label>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={s.privacyTitle}>{title}</Text>
        <Body style={{ fontSize: 11, lineHeight: 18 }}>{description}</Body>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  progress: { flexDirection: 'row', gap: 7, marginHorizontal: 24, height: 4, marginTop: 1 },
  segment: { flex: 1, borderRadius: 2, backgroundColor: colors.border },
  segmentDone: { backgroundColor: colors.forest },
  stepContent: { paddingTop: 38 },
  bookend: { paddingTop: 24 },
  welcomeTitle: { fontSize: 55, lineHeight: 57, marginTop: 32 },
  welcomeCopy: { marginTop: 42, fontSize: 15, lineHeight: 24 },
  welcomeCard: {
    marginTop: 44,
    backgroundColor: colors.forest,
    borderRadius: 23,
    padding: 22,
    minHeight: 249,
  },
  quote: { color: colors.surface, fontSize: 37, lineHeight: 40, marginTop: 24 },
  quoteCaption: { textAlign: 'left', color: colors.surface, marginTop: 12 },
  nameInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 17,
    height: 70,
    paddingHorizontal: 18,
    fontFamily: fonts.editorial,
    color: colors.ink,
    fontSize: 24,
    includeFontPadding: false,
  },
  nameNotice: {
    marginTop: 28,
    minHeight: 88,
    backgroundColor: colors.soft,
    borderRadius: 17,
    paddingHorizontal: 17,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  smallTitle: { fontFamily: fonts.semibold, color: colors.forest, fontSize: 13, lineHeight: 18 },
  smallCopy: { fontSize: 12, lineHeight: 18 },
  comingSoon: {
    backgroundColor: colors.soft,
    minHeight: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  uploadCard: {
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 19,
    backgroundColor: colors.surface,
    minHeight: 226,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 17,
  },
  uploadCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontFamily: fonts.semibold,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
  sampleCard: {
    marginTop: 62,
    minHeight: 296,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 21,
    padding: 20,
  },
  sample: {
    fontFamily: fonts.italic,
    fontSize: 26,
    lineHeight: 34,
    color: colors.ink,
    includeFontPadding: false,
  },
  comparison: { flexDirection: 'row', gap: 12, marginTop: 32 },
  comparisonCard: {
    flex: 1,
    minHeight: 297,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  selectedComparison: { backgroundColor: colors.soft, borderColor: colors.forest },
  comparisonTitle: { fontSize: 27, lineHeight: 30 },
  comparisonText: { fontSize: 15, lineHeight: 22, marginTop: 14 },
  comparisonCaption: {
    textAlign: 'left',
    fontSize: 9,
    marginTop: 'auto',
    paddingTop: 16,
    lineHeight: 14,
  },
  recommended: { borderRadius: 12, backgroundColor: colors.accent, paddingVertical: 5 },
  privacyCard: {
    marginTop: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    paddingHorizontal: 16,
  },
  privacyRow: { flexDirection: 'row', gap: 10, paddingVertical: 20 },
  privacyTitle: { fontFamily: fonts.semibold, color: colors.ink, fontSize: 14, lineHeight: 19 },
  doneTitle: { fontSize: 55, lineHeight: 58, marginTop: 32 },
  setupCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 21,
    padding: 19,
    marginTop: 64,
    minHeight: 234,
  },
  setupRow: { color: colors.ink, fontSize: 14, lineHeight: 21, marginBottom: 24 },
});
