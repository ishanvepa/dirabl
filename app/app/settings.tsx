import {useEffect,useState} from 'react';
import {Switch} from 'react-native';
import { Body, Button, Heading, Notice, Screen } from '../src/components/ui';
import {useRepositories} from '../src/services/database/context';
import {DISCLOSURE,ensureConsent} from '../src/features/synthesis/consent';
export default function Settings() {
  const {settings}=useRepositories();const [auto,setAuto]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState('');
  useEffect(()=>{settings.get('autoSynthesis').then(setAuto).catch(()=>setError('Could not read settings.')).finally(()=>setBusy(false));},[settings]);
  async function toggle(value:boolean) {
    setBusy(true);setError('');
    try{if(!value || await ensureConsent(settings)){await settings.set('autoSynthesis',value);setAuto(value);}}
    catch{setError('Could not save settings. Please retry.');}finally{setBusy(false);}
  }
  async function revoke(){setBusy(true);try{await settings.set('autoSynthesis',false);await settings.set('consent',false);setAuto(false);}catch{setError('Could not update consent. Please retry.');}finally{setBusy(false);}}
  return <Screen><Heading>Your words, your choice</Heading><Body>{DISCLOSURE}</Body>
    <Body>Automatic online synthesis</Body><Switch accessibilityLabel="Automatic online synthesis" value={auto} disabled={busy} onValueChange={value=>void toggle(value)}/>
    <Body>Initially off. When enabled, only new entries finished online are automatically sent. Entries saved offline always need a manual tap, even after reconnecting.</Body>
    <Button title="Turn off automatic synthesis and reset consent" disabled={busy} onPress={()=>void revoke()}/>
    <Body>Your journal is stored on this device in SQLite. Local storage is protected by the app sandbox, but is not separately encrypted by dirabl.</Body>
    {!!error && <Notice>{error}</Notice>}
  </Screen>;
}
