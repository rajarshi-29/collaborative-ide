import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Trash2,
  FileCode,
  X,
  Bot
} from 'lucide-react';
import { AIService } from '../../services/aiService';
import { ModelSelector } from './ModelSelector';
import { VoiceInput } from './VoiceInput';
import { ChatMessage } from './ChatMessage';

export const AISidecar = ({
  onClose,
  activeFileName,
  activeFileContent,
  selectedCode,
  onApplyCode,
  onDiffPreview
}) => {
  const [selectedModelId, setSelectedModelId] = useState('gemini-1.5-flash');
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const aiService = AIService.getInstance();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = async (customText) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isGenerating) return;

    const userMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.map(a => ({ name: a.name, type: 'file', size: a.size }))
    };

    const assistantMsgId = 'assistant-' + Date.now();
    const initialAssistantMsg = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModelId,
      isStreaming: true
    };

    setMessages(prev => [...prev, userMessage, initialAssistantMsg]);
    setInputPrompt('');
    setAttachments([]);
    setIsGenerating(true);

    try {
      const stream = aiService.streamChat(
        textToSend,
        selectedModelId,
        {
          activeFileName,
          activeFileContent,
          selectedCode,
          attachments: attachments.map(a => ({ name: a.name }))
        },
        mode
      );

      for await (const chunk of stream) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: chunk.text,
                  thoughtProcess: chunk.thoughtProcess,
                  codeBlocks: chunk.codeBlocks,
                  isStreaming: true
                }
              : m
          )
        );
      }
    } catch (e) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `Error generating response: ${e?.message || 'Network error'}`,
                isStreaming: false
              }
            : m
        )
      );
    } finally {
      setMessages(prev =>
        prev.map(m => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
      );
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments = [];
    for (let i = 0; i < files.length; i++) {
      newAttachments.push({
        name: files[i].name,
        size: files[i].size
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  return (
    <div className="sidebar-right" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidecar Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bot size={15} color="var(--accent-primary)" />
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>
              COPILOT CHAT
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{ padding: '3px', color: 'var(--text-muted)' }}
                title="Clear Conversation"
              >
                <Trash2 size={13} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{ padding: '3px', color: 'var(--text-muted)' }}
              title="Close Panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <ModelSelector
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
        />

        {/* Mode Segmented Switcher */}
        <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-panel)', padding: '2px', borderRadius: '3px' }}>
          {['chat', 'inline-edit', 'explain', 'tests'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '3px 0',
                fontSize: '11px',
                fontWeight: mode === m ? 500 : 400,
                textTransform: 'capitalize',
                borderRadius: '2px',
                background: mode === m ? 'var(--bg-active)' : 'transparent',
                color: mode === m ? 'var(--text-bright)' : 'var(--text-muted)'
              }}
            >
              {m === 'chat' && 'Chat'}
              {m === 'inline-edit' && 'Edit'}
              {m === 'explain' && 'Explain'}
              {m === 'tests' && 'Tests'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onApplyCode={onApplyCode}
            onDiffPreview={onDiffPreview}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Active File Context Bar */}
      {activeFileName && (
        <div style={{
          padding: '4px 12px',
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FileCode size={12} color="var(--accent-primary)" />
            <span>Context:</span>
            <span style={{ color: 'var(--text-bright)' }}>{activeFileName}</span>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div style={{
          padding: '4px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {attachments.map((att, i) => (
            <div
              key={i}
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '2px',
                background: 'var(--bg-panel-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-bright)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{att.name}</span>
              <X
                size={11}
                style={{ cursor: 'pointer' }}
                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
              />
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '4px',
          padding: '4px 6px'
        }}>
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Copilot..."
            rows={2}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '2px',
              fontSize: '12px',
              resize: 'none',
              boxShadow: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ color: 'var(--text-muted)', padding: '3px' }}
                title="Attach file"
              >
                <Paperclip size={14} />
              </button>

              <VoiceInput
                onTranscript={(text) => {
                  setInputPrompt(prev => prev + (prev ? ' ' : '') + text);
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputPrompt.trim() || isGenerating}
              className="btn-primary"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                gap: '4px'
              }}
              title="Send message"
            >
              <Send size={11} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
