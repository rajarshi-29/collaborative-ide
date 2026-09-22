import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { VoiceService } from '../../services/voiceService';

export const VoiceInput = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const voiceService = VoiceService.getInstance();

  const toggleListening = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
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

  return (
    <button
      type="button"
      onClick={toggleListening}
      style={{
        padding: '4px',
        color: isListening ? 'var(--accent-danger)' : 'var(--text-muted)',
        background: isListening ? 'rgba(224, 108, 117, 0.15)' : 'transparent',
        borderRadius: '3px'
      }}
      title={isListening ? 'Stop Voice Input' : 'Voice Input'}
      aria-label="Voice Input"
    >
      <Mic size={14} />
    </button>
  );
};
