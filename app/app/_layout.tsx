import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrate } from '../src/services/database/migrations';
import { Busy, Header, Notice, Screen, colors } from '../src/components/ui';
import { fontAssets } from '../src/components/theme';
import {
  PreferencesProvider,
  usePreferences,
} from '../src/features/preferences/PreferencesProvider';
import { ConsentProvider } from '../src/features/synthesis/ConsentProvider';
export { ErrorBoundary } from 'expo-router';
function Navigation() {
  const { onboardingCompleted } = usePreferences();
  return (
    <ConsentProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
          animation: 'fade',
        }}
      >
        <Stack.Protected guard={onboardingCompleted}>
          <Stack.Screen name="index" />
          <Stack.Screen name="new" />
          <Stack.Screen name="entry/[id]" />
          <Stack.Screen name="settings" />
        </Stack.Protected>
        <Stack.Screen name="onboarding" />
      </Stack>
    </ConsentProvider>
  );
}
export default function Layout() {
  const [loaded, error] = useFonts(fontAssets);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!loaded ? (
        <Screen header={<Header brand />}>
          {error ? (
            <Notice>Could not load the journal fonts. Reopen the app to try again.</Notice>
          ) : (
            <Busy />
          )}
        </Screen>
      ) : (
        <SQLiteProvider databaseName="dirabl.db" onInit={migrate}>
          <PreferencesProvider>
            <Navigation />
          </PreferencesProvider>
        </SQLiteProvider>
      )}
    </SafeAreaProvider>
  );
}
