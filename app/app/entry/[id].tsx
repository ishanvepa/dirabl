import { useCallback,useMemo,useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect,useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useRepositories } from '../../src/services/database/context';
import { type JournalEntry,statusText,isStale } from '../../src/types/journal';
import { Body, Busy, Button, Heading, Notice, Screen, styles } from '../../src/components/ui';
import {createSynthesisClient} from '../../src/services/api/synthesisClient';
import {SynthesisService} from '../../src/features/synthesis/SynthesisService';
import {ensureConsent} from '../../src/features/synthesis/consent';
export default function Detail() {
  const {id}=useLocalSearchParams<{id:string}>(),{journal,settings}=useRepositories();
  const service=useMemo(()=>new SynthesisService(journal,createSynthesisClient(process.env.EXPO_PUBLIC_SYNTHESIS_API_URL),randomUUID),[journal]);
  const [entry,setEntry]=useState<JournalEntry|null>(null),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [tab,setTab]=useState<'story'|'transcript'>('transcript');
  const load=useCallback(async()=>{
    try {const result=await journal.getById(id);setEntry(result);if(result?.synthesizedStory)setTab('story');setError('');}
    catch{setError('Could not open your entry. Please retry.');}finally{setLoaded(true);}
  },[id,journal]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  async function synthesize() {
    if(busy)return;setBusy(true);setError('');
    try{if(await ensureConsent(settings)){await service.run(id);await load();}}
    catch(e){await load();setError(e instanceof Error ? e.message : 'Could not synthesize. Please retry.');}
    finally{setBusy(false);}
  }
  return <Screen>{!loaded ? <Busy/> : entry ? <>
    <Heading>{entry.title || 'Untitled Entry'}</Heading><Text style={styles.muted}>{new Date(entry.createdAt).toLocaleString()}</Text>
    {!!entry.tags.length && <Text style={styles.muted}>{entry.tags.join(' · ')}</Text>}
    <Notice>{busy ? 'Synthesizing your entry…' : statusText[entry.synthesisStatus]}</Notice>
    {isStale(entry) && <Notice>The story is from an earlier transcript. Synthesize again to update it.</Notice>}
    {entry.synthesizedStory && <Button title="Story" onPress={()=>setTab('story')}/>}
    <Button title="Original Transcript" onPress={()=>setTab('transcript')}/>
    <Body>{tab==='story' && entry.synthesizedStory ? entry.synthesizedStory : entry.rawTranscript}</Body>
    {busy && <Busy/>}
    {(!entry.synthesizedStory || isStale(entry)) && <Button title={entry.synthesisStatus==='synthesis_failed' ? 'Retry Synthesis' : 'Synthesize Entry'} disabled={busy || entry.synthesisStatus==='synthesizing'} onPress={()=>void synthesize()}/>}
    {!!entry.lastSynthesisError && <Notice>{entry.lastSynthesisError}</Notice>}
  </> : <Notice>Entry not found.</Notice>}
  {!!error && <Notice>{error}<Button title="Reload entry" onPress={()=>void load()}/></Notice>}
  </Screen>;
}
