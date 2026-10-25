import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Body,
  Button,
  Caption,
  Heading,
  Label,
  Notice,
  TextButton,
  colors,
} from '../../components/ui';
import { useRepositories } from '../../services/database/context';
type ConsentIntent = 'synthesize' | 'automatic' | 'review';
const ConsentContext = createContext<((intent?: ConsentIntent) => Promise<boolean>) | null>(null);
export function ConsentProvider({ children }: PropsWithChildren) {
  const { settings } = useRepositories();
  const insets = useSafeAreaInsets();
  const [intent, setIntent] = useState<ConsentIntent | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const pending = useRef<((accepted: boolean) => void) | null>(null);
  useEffect(
    () => () => {
      pending.current?.(false);
    },
    [],
  );
  function dismiss(accepted = false) {
    setIntent(null);
    setError('');
    pending.current?.(accepted);
    pending.current = null;
  }
  const requestConsent = useCallback(
    async (next: ConsentIntent = 'synthesize') => {
      if (next !== 'review' && (await settings.get('consent'))) return true;
      if (pending.current) return false;
      setError('');
      setIntent(next);
      return new Promise<boolean>((resolve) => {
        pending.current = resolve;
      });
    },
    [settings],
  );
  async function accept() {
    if (busy) return;
    setBusy(true);
    try {
      if (intent !== 'review') await settings.set('consent', true);
      dismiss(intent !== 'review');
    } catch {
      setError('Could not save your choice. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <ConsentContext.Provider value={requestConsent}>
      {children}
      <Modal
        transparent
        animationType="slide"
        visible={intent !== null}
        onRequestClose={() => {
          if (!busy) dismiss();
        }}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={sheet.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Dismiss data sharing details"
            onPress={() => !busy && dismiss()}
          />
          <View
            accessibilityViewIsModal
            style={[sheet.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <View style={sheet.handle} />
            <Label>A CHOICE, NOT A REQUIREMENT</Label>
            <Heading style={sheet.heading}>{'Your words,\nyour choice.'}</Heading>
            <Body style={sheet.explanation}>
              To turn this entry into a story, dirabl sends your saved transcript to its backend and
              OpenAI. The original stays on your device.
            </Body>
            <Body style={sheet.disclosure}>
              Provider data handling and retention policies apply. You can keep journaling without
              ever using AI.
            </Body>
            {!!error && <Notice warning>{error}</Notice>}
            <Button
              variant="primary"
              title={
                intent === 'review'
                  ? 'Done'
                  : intent === 'automatic'
                    ? 'Agree & enable'
                    : 'Agree & synthesize'
              }
              loading={busy}
              onPress={() => void accept()}
            />
            {intent !== 'review' && (
              <TextButton title="Not now" disabled={busy} onPress={() => dismiss()} />
            )}
            {intent === 'review' && (
              <Caption>Your original transcript stays saved on this device.</Caption>
            )}
          </View>
        </View>
      </Modal>
    </ConsentContext.Provider>
  );
}
export function useSynthesisConsent() {
  const request = useContext(ConsentContext);
  if (!request) throw new Error('ConsentProvider is required.');
  return request;
}
const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(27,36,29,0.37)' },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    paddingHorizontal: 24,
    paddingTop: 44,
    gap: 16,
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  handle: {
    position: 'absolute',
    top: 13,
    alignSelf: 'center',
    width: 39,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  heading: { fontSize: 43, lineHeight: 45 },
  explanation: { fontSize: 15, lineHeight: 23, color: colors.ink, marginTop: 4 },
  disclosure: { fontSize: 12, lineHeight: 18, marginVertical: 12 },
});
