import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule as native } from 'expo-speech-recognition';
import { TranscriptBuffer } from './TranscriptBuffer';
import type { SpeechSnapshot, SpeechTranscriber } from './SpeechTranscriber';
const normalize = (locale: string) => locale.replaceAll('_','-').toLowerCase();
export class ExpoSpeechTranscriber implements SpeechTranscriber {
  private buffer=new TranscriptBuffer();
  private active=false;
  private message='';
  private stopping=false;
  private listeners=new Set<(snapshot: SpeechSnapshot)=>void>();
  private ended?: () => void;
  private subscriptions = [
    native.addListener('result',event=>{this.buffer.result(event.results[0]?.transcript ?? '',event.isFinal);this.emit();}),
    native.addListener('start',()=>{this.active=true;this.emit();}),
    native.addListener('error',()=>{this.message='Dictation was interrupted or unavailable. Your text is preserved; type or try again.';this.emit();}),
    native.addListener('end',()=>{
      this.active=false;this.buffer.finish();
      if (!this.stopping) this.message='Dictation stopped. Review your text, then continue or Finish Entry.';
      this.ended?.();this.emit();
    }),
  ];
  private emit() { for(const listener of this.listeners) listener({committedText:this.buffer.committedText,interimText:this.buffer.interimText,active:this.active,message:this.message}); }
  subscribe(listener: (snapshot: SpeechSnapshot)=>void) {this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};}
  async checkAvailability(locale: string) {
    if (!native.isRecognitionAvailable() || !native.supportsOnDeviceRecognition()) return {available:false,reason:'On-device speech recognition is unavailable. You can type your entry below.'};
    const locales=await native.getSupportedLocales({});
    const installed=locales.installedLocales.some(item=>normalize(item)===normalize(locale));
    return {available:installed,reason:installed ? undefined : `The ${locale} offline language model is not installed. You can type instead.`,canDownloadModel:!installed && Platform.OS==='android'};
  }
  async requestPermission() {
    const permission=await native.getPermissionsAsync();
    if (permission.granted) return true;
    if (permission.status==='denied' || !permission.canAskAgain) return false;
    return (await native.requestPermissionsAsync()).granted;
  }
  async start({locale,text}: {locale:string;text:string}) {
    const available=await this.checkAvailability(locale);
    if (!available.available) throw new Error(available.reason);
    if (!await this.requestPermission()) throw new Error('Microphone permission is off. Enable it in device Settings, or type your entry.');
    this.buffer.begin(text);this.message='';this.stopping=false;this.active=true;this.emit();
    try {native.start({lang:locale,interimResults:true,continuous:true,requiresOnDeviceRecognition:true,addsPunctuation:true,recordingOptions:{persist:false}});}
    catch(e) {this.active=false;this.emit();throw e;}
  }
  async stop() {
    if (!this.active) return this.buffer.finish();
    this.stopping=true;
    await new Promise<void>(resolve=>{
      const timer=setTimeout(()=>{native.abort();resolve();},2000);
      this.ended=()=>{clearTimeout(timer);resolve();};
      native.stop();
    });
    this.ended=undefined;this.active=false;
    const text=this.buffer.finish();this.emit();return text;
  }
  async downloadModel(locale: string) {await native.androidTriggerOfflineModelDownload({locale});}
  dispose() {this.listeners.clear();this.subscriptions.forEach(item=>item.remove());native.abort();this.ended?.();}
}
