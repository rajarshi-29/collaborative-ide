import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { VoiceService } from '../../services/voiceService';

export const VoiceInput = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const voiceService = VoiceService.getInstance();
  const isSupported = voiceService.isSupported();

  const toggleListening = () => {
    if (!isSupported) {
      setErrorMessage('Voice input requires browser mode or configured speech service.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      setErrorMessage('');
    } else {
      setErrorMessage('');
      const started = voiceService.startListening(
        (text, isFinal) => {
          onTranscript(text);
          if (isFinal) {
            setIsListening(false);
          }
        },
        (error) => {
          console.warn('Voice recognition error:', error);
          setIsListening(false);
          if (error === 'network' || error === 'service-not-allowed') {
            setErrorMessage('Voice service unavailable in offline/Electron runtime.');
          } else {
            setErrorMessage(typeof error === 'string' ? error : 'Voice recognition error');
          }
          setTimeout(() => setErrorMessage(''), 4000);
        },
        (status) => {
          setIsListening(status);
        }
      );
      if (started) {
        setIsListening(true);
      }
    }
  };

  const buttonTitle = errorMessage || (
    isListening
      ? 'Stop Voice Input'
      : (isSupported ? 'Voice Input' : 'Voice Input (requires browser mode or speech API keys)')
  );

  return (
    <button
      type="button"
      onClick={toggleListening}
      style={{
        padding: '4px',
        color: isListening ? 'var(--accent-danger)' : (isSupported ? 'var(--text-muted)' : 'var(--text-subtle, #5c6370)'),
        background: isListening ? 'rgba(224, 108, 117, 0.15)' : 'transparent',
        borderRadius: '3px',
        cursor: 'pointer'
      }}
      title={buttonTitle}
      aria-label="Voice Input"
    >
      <Mic size={14} />
    </button>
  );
};

