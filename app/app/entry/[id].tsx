import { useCallback,useState } from 'react';
import { useFocusEffect,useLocalSearchParams } from 'expo-router';
import { useRepositories } from '../../src/services/database/context';
import type { JournalEntry } from '../../src/types/journal';
import { Body, Busy, Heading, Notice, Screen } from '../../src/components/ui';
export default function Detail() {
  const {id}=useLocalSearchParams<{id:string}>(),{journal}=useRepositories();
  const [entry,setEntry]=useState<JournalEntry|null>(null),[loaded,setLoaded]=useState(false);
  useFocusEffect(useCallback(()=>{journal.getById(id).then(setEntry).finally(()=>setLoaded(true));},[id,journal]));
  return <Screen>{!loaded ? <Busy/> : entry ? <><Heading>{entry.title || 'Untitled Entry'}</Heading><Body>{new Date(entry.createdAt).toLocaleString()}</Body><Body>{entry.rawTranscript}</Body></> : <Notice>Entry not found.</Notice>}</Screen>;
}
