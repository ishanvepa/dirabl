import { useState } from 'react';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import { useRepositories } from '../src/services/database/context';
import { Button, Heading, Notice, Screen, styles } from '../src/components/ui';
export default function NewEntry() {
  const {journal}=useRepositories(); const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function finish() {
    setBusy(true); try { const entry=await journal.createDraft({rawTranscript:text,offline:true}); router.replace(`/entry/${entry.id}`); }
    catch {setError('Could not save. Your text is still here; please retry.');setBusy(false);}
  }
  return <Screen><Heading>What’s on your mind?</Heading><TextInput accessibilityLabel="Journal transcript" multiline value={text} onChangeText={setText} style={styles.input} placeholder="Start writing here…"/>
    {error && <Notice>{error}</Notice>}<Button title="Finish Entry" disabled={!text.trim() || busy} onPress={()=>void finish()}/></Screen>;
}
