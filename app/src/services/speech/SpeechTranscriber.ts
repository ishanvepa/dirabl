export interface Availability {
  available: boolean;
  reason?: string;
  canDownloadModel?: boolean;
  manualOnly?: boolean;
}
export interface SpeechSnapshot {
  committedText: string;
  interimText: string;
  active: boolean;
  message: string;
}
export interface SpeechTranscriber {
  checkAvailability(locale: string): Promise<Availability>;
  requestPermission(): Promise<boolean>;
  start(options: { locale: string; text: string }): Promise<void>;
  stop(): Promise<string>;
  subscribe(listener: (snapshot: SpeechSnapshot) => void): () => void;
  downloadModel(locale: string): Promise<void>;
  dispose(): void;
}
