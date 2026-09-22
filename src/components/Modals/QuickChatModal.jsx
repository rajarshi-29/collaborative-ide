import React, { useState } from 'react';
import {
  X,
  Bot,
  Send,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { AIService } from '../../services/aiService';

export const QuickChatModal = ({
  isOpen,
  onClose,
  activeFileName,
  selectedCode,
  onApplyCode
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [codeSnippet, setCodeSnippet] = useState(null);
  const [copied, setCopied] = useState(false);
  const aiService = AIService.getInstance();

  if (!isOpen) return null;

  const handleAsk = async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer('');
    setCodeSnippet(null);

    try {
      const stream = aiService.streamChat(
        query,
        'gemini-1.5-flash',
        {
          activeFileName,
          selectedCode
        },
        'chat'
      );

      for await (const chunk of stream) {
        setAnswer(chunk.text);
        if (chunk.codeBlocks && chunk.codeBlocks.length > 0) {
          setCodeSnippet(chunk.codeBlocks[0].code);
        }
      }
    } catch (e) {
      setAnswer(`Error: ${e?.message || 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (codeSnippet) {
      navigator.clipboard.writeText(codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ width: '100%', maxWidth: '580px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={15} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-bright)' }}>
              Quick AI Query
            </span>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Input Area */}
        <div style={{ padding: '12px 14px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              autoFocus
              type="text"
              placeholder="Ask a quick question about code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAsk();
              }}
              style={{ flex: 1 }}
            />
            <button
              onClick={handleAsk}
              disabled={!query.trim() || isLoading}
              className="btn-primary"
              style={{ padding: '4px 12px', gap: '4px' }}
            >
              <Send size={11} />
              <span>Ask</span>
            </button>
          </div>

          {activeFileName && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              Context: {activeFileName}
            </div>
          )}
        </div>

        {/* Output */}
        {(answer || isLoading) && (
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '14px',
            background: 'var(--bg-editor)',
            fontSize: '12px',
            lineHeight: 1.45
          }}>
            {isLoading && !answer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}

            {answer && (
              <div style={{ color: 'var(--text-bright)', whiteSpace: 'pre-wrap' }}>
                {answer}
              </div>
            )}

            {codeSnippet && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCopy}
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                >
                  {copied ? <Check size={12} color="var(--accent-success)" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => {
                    onApplyCode(codeSnippet);
                    onClose();
                  }}
                  className="btn-primary"
                  style={{ padding: '3px 10px', fontSize: '11px', gap: '4px' }}
                >
                  <ArrowRight size={12} />
                  <span>Apply</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
