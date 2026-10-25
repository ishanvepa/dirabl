import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { useRepositories } from '../../services/database/context';
import type {
  JournalPreferences,
  OnboardingPreferences,
  ReadingView,
} from '../../services/database/settingsRepository';
import { Busy, Button, Header, Notice, Screen } from '../../components/ui';

interface PreferencesContextValue extends JournalPreferences {
  finishOnboarding: (input: OnboardingPreferences) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateReadingView: (view: ReadingView) => Promise<void>;
}
const PreferencesContext = createContext<PreferencesContextValue | null>(null);
export function PreferencesProvider({ children }: PropsWithChildren) {
  const { settings } = useRepositories();
  const [preferences, setPreferences] = useState<JournalPreferences | null>(null),
    [error, setError] = useState(false);
  const load = useCallback(async () => {
    setError(false);
    try {
      setPreferences(await settings.getPreferences());
    } catch {
      setError(true);
    }
  }, [settings]);
  useEffect(() => {
    void load();
  }, [load]);
  if (!preferences)
    return (
      <Screen header={<Header brand />}>
        {error ? (
          <Notice>
            Could not open your journal preferences.
            <Button title="Try again" onPress={() => void load()} />
          </Notice>
        ) : (
          <Busy />
        )}
      </Screen>
    );
  return (
    <PreferencesContext.Provider
      value={{
        ...preferences,
        finishOnboarding: async (input) => {
          setPreferences(await settings.completeOnboarding(input));
        },
        updateName: async (name) => {
          const displayName = name.trim().slice(0, 80);
          await settings.setText('displayName', displayName);
          setPreferences((current) => current && { ...current, displayName });
        },
        updateReadingView: async (preferredReadingView) => {
          await settings.setText('preferredReadingView', preferredReadingView);
          setPreferences((current) => current && { ...current, preferredReadingView });
        },
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error('PreferencesProvider is required.');
  return preferences;
}
