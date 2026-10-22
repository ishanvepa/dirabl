import {Alert} from 'react-native';
import type {SettingsRepository} from '../../services/database/settingsRepository';
export const DISCLOSURE='Synthesis sends this entry’s transcript text through the dirabl backend to OpenAI to create a title, story and tags. Provider data handling and retention policies apply. Speech transcription stays on your device.';
export async function ensureConsent(settings:SettingsRepository) {
  if(await settings.get('consent')) return true;
  const accepted=await new Promise<boolean>(resolve=>Alert.alert('Send text for AI synthesis?',DISCLOSURE,[{text:'Keep local',style:'cancel',onPress:()=>resolve(false)},{text:'Allow synthesis',onPress:()=>resolve(true)}],{cancelable:true,onDismiss:()=>resolve(false)}));
  if(accepted) await settings.set('consent',true);
  return accepted;
}
