import React, { useState } from 'react';
import {
  Copy,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileCode,
  ArrowLeftRight
} from 'lucide-react';

export const ChatMessage = ({
  message,
  onApplyCode,
  onDiffPreview
}) => {
  const isAssistant = message.sender === 'assistant';
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showThought, setShowThought] = useState(false);

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderContent = (content) => {
    if (!content) return null;

    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineBreak = part.indexOf('\n');
        const lang = part.substring(3, firstLineBreak).trim() || 'plaintext';
        const code = part.substring(firstLineBreak + 1, part.length - 3).trim();

        return (
          <div
            key={idx}
            style={{
              margin: '8px 0',
              borderRadius: '4px',
              overflow: 'hidden',
              background: 'var(--bg-editor)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Code Block Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              background: 'var(--bg-panel)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{lang}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {onDiffPreview && (
                  <button
                    onClick={() => onDiffPreview(code)}
                    className="btn-secondary"
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      gap: '3px'
                    }}
                    title="Preview side-by-side diff"
                  >
                    <ArrowLeftRight size={11} />
                    Diff
                  </button>
                )}

                {onApplyCode && (
                  <button
                    onClick={() => onApplyCode(code)}
                    className="btn-primary"
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      gap: '3px'
                    }}
                    title="Apply code directly to active file"
                  >
                    <ArrowRight size={11} />
                    Apply
                  </button>
                )}

                <button
                  onClick={() => handleCopy(code, idx)}
                  style={{
                    padding: '2px 4px',
                    color: 'var(--text-muted)'
                  }}
                  title="Copy code"
                >
                  {copiedIndex === idx ? <Check size={12} color="var(--accent-success)" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Code Content */}
            <pre style={{
              padding: '8px 10px',
              margin: 0,
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
              color: 'var(--text-bright)',
              lineHeight: 1.45
            }}>
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Regular Text
      return (
        <div key={idx} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.45, fontSize: '12px' }}>
          {part}
        </div>
      );
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '8px 12px',
      borderBottom: '1px solid var(--border-color)',
      background: isAssistant ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
    }}>
      {/* Message Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: isAssistant ? 'var(--accent-primary)' : 'var(--text-bright)' }}>
          {isAssistant ? (message.model || 'Assistant') : 'User'}
        </span>
        {message.timestamp && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {message.timestamp}
          </span>
        )}
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
          {message.attachments.map((att, i) => (
            <span
              key={i}
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '2px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <FileCode size={10} />
              {att.name}
            </span>
          ))}
        </div>
      )}

      {/* Thought Process Collapsible */}
      {message.thoughtProcess && (
        <div style={{
          margin: '4px 0',
          background: 'var(--bg-panel)',
          borderRadius: '3px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setShowThought(!showThought)}
            style={{
              width: '100%',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontWeight: 500
            }}
          >
            {showThought ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <span>Thought Process</span>
          </button>
          {showThought && (
            <div style={{
              padding: '6px 8px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.4,
              borderTop: '1px solid var(--border-subtle)'
            }}>
              {message.thoughtProcess}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ color: 'var(--text-bright)' }}>
        {renderContent(message.content)}
      </div>

      {message.isStreaming && (
        <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '4px' }}>
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      )}
    </div>
  );
};
