import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { migrate } from '../src/services/database/migrations';
import { colors } from '../src/components/ui';
export { ErrorBoundary } from 'expo-router';
export default function Layout() {
  return <SQLiteProvider databaseName="dirabl.db" onInit={migrate}><Stack screenOptions={{headerStyle:{backgroundColor:colors.paper},headerTintColor:colors.ink,contentStyle:{backgroundColor:colors.paper}}}>
    <Stack.Screen name="index" options={{title:'dirabl'}}/>
    <Stack.Screen name="new" options={{title:'New Entry'}}/>
    <Stack.Screen name="entry/[id]" options={{title:'Journal Entry'}}/>
    <Stack.Screen name="settings" options={{title:'Privacy & Settings'}}/>
  </Stack></SQLiteProvider>;
}
