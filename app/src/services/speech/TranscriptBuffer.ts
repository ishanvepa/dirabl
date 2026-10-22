export class TranscriptBuffer {
  committedText = '';
  interimText = '';
  private lastFinal = '';
  private hadPartial = false;
  private firstInSession = true;
  begin(text: string) {
    this.committedText = text.trim();
    if (!this.committedText.endsWith(this.lastFinal)) this.lastFinal = '';
    this.interimText = '';
    this.firstInSession = true;
    this.hadPartial = false;
  }
  result(text: string, final: boolean) {
    text = text.trim();
    if (!final) {
      this.interimText = text;
      this.hadPartial = true;
      return;
    }
    if (text && !(text === this.lastFinal && (this.firstInSession || !this.hadPartial)))
      this.committedText = [this.committedText, text].filter(Boolean).join(' ');
    this.lastFinal = text;
    this.interimText = '';
    this.hadPartial = false;
    this.firstInSession = false;
  }
  finish() {
    // Preserve the latest visible partial if the OS ends without a final event.
    if (this.interimText) this.result(this.interimText, true);
    return this.committedText;
  }
}
