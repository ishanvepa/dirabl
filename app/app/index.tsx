import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useRepositories } from '../src/services/database/context';
import { type JournalEntry, statusText } from '../src/types/journal';
import { Body, Busy, Button, Heading, Notice, Screen, styles } from '../src/components/ui';
export default function Library() {
  const {journal} = useRepositories();
  const [entries,setEntries] = useState<JournalEntry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const load=useCallback(() => { setLoading(true); journal.list().then(setEntries).catch(()=>setError('Could not read your journal. Please retry.')).finally(()=>setLoading(false)); },[journal]);
  useFocusEffect(load);
  return <Screen><Heading>My Journal</Heading><Body>A little space for your thoughts.</Body>
    <Button title="New Entry" onPress={()=>router.push('/new')}/><Button title="Privacy & Settings" onPress={()=>router.push('/settings')}/>
    {loading && <Busy/>}{error && <Notice>{error}<Button title="Retry" onPress={load}/></Notice>}
    {!loading && !entries.length && <View style={styles.card}><Body>Your journal starts here. Speak or type a moment you want to keep.</Body><Button title="Start Journaling" onPress={()=>router.push('/new')}/></View>}
    {entries.map(entry=><Pressable accessibilityRole="button" key={entry.id} onPress={()=>router.push(`/entry/${entry.id}`)} style={styles.card}>
      <Text style={styles.muted}>{new Date(entry.createdAt).toLocaleString()}</Text><Body>{entry.title || 'Untitled Entry'}</Body>
      <Text numberOfLines={3} style={styles.body}>{entry.synthesizedStory || entry.rawTranscript}</Text><Text style={styles.muted}>{statusText[entry.synthesisStatus]}</Text>
    </Pressable>)}
  </Screen>;
}
