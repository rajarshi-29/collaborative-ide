// Web Speech API Voice Recognition Service
export class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStatusCallback = null;
    this.initRecognition();
  }

  static getInstance() {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  initRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStatusCallback) this.onStatusCallback(true);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onStatusCallback) this.onStatusCallback(false);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition event:', event.error);
        if (this.onErrorCallback) this.onErrorCallback(event.error);
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (this.onResultCallback) {
          if (finalTranscript) {
            this.onResultCallback(finalTranscript, true);
          } else if (interimTranscript) {
            this.onResultCallback(interimTranscript, false);
          }
        }
      };
    }
  }

  isSupported() {
    return !!this.recognition;
  }

  startListening(onResult, onError, onStatus) {
    if (!this.recognition) {
      if (onError) onError('Speech Recognition is not supported on this browser/platform.');
      return false;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onStatusCallback = onStatus || null;

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      if (onError) onError(e?.message || 'Failed to start voice listener');
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition', e);
      }
    }
    this.isListening = false;
  }

  getIsListening() {
    return this.isListening;
  }
}
