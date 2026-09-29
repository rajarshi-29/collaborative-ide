import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Copy,
  Check,
  ArrowDownLeft,
  FileText,
  CheckCircle2,
  Loader2,
  Anchor
} from 'lucide-react';

export const ResearchPanel = ({
  isOpen,
  onClose,
  onDock,
  isDetached,
  buttonRef,
  history = [],
  onSendQuery,
  isResearching = false,
  activeFileName = '',
  onApplyCode,
  onClearHistory
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [panelPosStyle, setPanelPosStyle] = useState({});
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);

  // Dynamically calculate adaptive placement relative to button coordinates
  useEffect(() => {
    if (!isOpen) return;

    const calculateAdaptivePosition = () => {
      const buttonNode =
        buttonRef?.current ||
        document.querySelector('.droplet-floating') ||
        document.querySelector('.droplet-docked-container');
      if (!buttonNode) return;

      const rect = buttonNode.getBoundingClientRect();
      const panelWidth = Math.min(460, window.innerWidth - 24);

      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;

      let top = null;
      let bottom = null;
      let verticalOrigin = 'top';

      // Vertical Placement: Open downward if space allows, otherwise open upward
      if (spaceBelow >= 360 || spaceBelow >= spaceAbove) {
        top = rect.bottom + 8;
        verticalOrigin = 'top';
      } else {
        bottom = window.innerHeight - rect.top + 8;
        verticalOrigin = 'bottom';
      }

      // Horizontal Placement
      let left = rect.left + rect.width / 2 - panelWidth / 2;
      let horizontalOrigin = 'center';

      if (!isDetached) {
        // When docked in the sidebar, position nicely to the right of the sidebar
        left = Math.min(rect.right + 12, window.innerWidth - panelWidth - 12);
        top = Math.max(42, Math.min(rect.top, window.innerHeight - 560));
        bottom = null;
        verticalOrigin = 'top';
        horizontalOrigin = 'left';
      } else {
        if (left < 12) {
          left = 12;
          horizontalOrigin = 'left';
        } else if (left + panelWidth > window.innerWidth - 12) {
          left = Math.max(12, window.innerWidth - panelWidth - 12);
          horizontalOrigin = 'right';
        }
      }

      setPanelPosStyle({
        top: top !== null ? `${top}px` : 'auto',
        bottom: bottom !== null ? `${bottom}px` : 'auto',
        left: `${left}px`,
        width: `${panelWidth}px`,
        maxHeight: `${Math.min(560, window.innerHeight - 80)}px`,
        transformOrigin: `${verticalOrigin} ${horizontalOrigin}`
      });
    };

    calculateAdaptivePosition();
    window.addEventListener('resize', calculateAdaptivePosition);
    return () => window.removeEventListener('resize', calculateAdaptivePosition);
  }, [isOpen, buttonRef]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isResearching, isOpen]);

  if (!isOpen) return null;

  const handleSend = (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isResearching) return;

    if (onSendQuery) {
      onSendQuery(trimmed);
    }
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessageContent = (text, messageId) => {
    if (!text) return null;

    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const firstLineBreak = part.indexOf('\n');
        const lang = part.substring(3, firstLineBreak).trim() || 'code';
        const code = part.substring(firstLineBreak + 1, part.length - 3).trim();
        const blockId = `${messageId}-code-${idx}`;
        const isCopied = copiedId === blockId;

        return (
          <div key={idx} className="research-code-block" style={{ margin: '8px 0' }}>
            <div className="research-code-header">
              <span>{lang}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleCopyCode(code, blockId)}
                  style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                  title="Copy snippet"
                >
                  {isCopied ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>

                {onApplyCode && (
                  <button
                    onClick={() => onApplyCode(code)}
                    style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-primary)' }}
                    title="Apply this code directly to active editor"
                  >
                    <ArrowDownLeft size={11} />
                    <span>Apply</span>
                  </button>
                )}
              </div>
            </div>
            <pre className="research-code-content">{code}</pre>
          </div>
        );
      }

      if (!part.trim()) return null;

      return (
        <div key={idx} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '12px', lineHeight: 1.55, margin: '4px 0' }}>
          {part}
        </div>
      );
    });
  };

  return (
    <div
      ref={panelRef}
      className="research-panel"
      style={panelPosStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Sleek Minimal Header */}
      <div className="research-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #38bdf8 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)',
            flexShrink: 0
          }}>
            <Sparkles size={12} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-bright)' }}>
              Research Assistant
            </span>
            <span style={{
              fontSize: '9.5px',
              padding: '1px 5px',
              borderRadius: '3px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontWeight: 500
            }}>
              Gemini 3.5
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isResearching ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#38bdf8' }}>
              <Loader2 size={11} className="spin" />
              <span>Researching...</span>
            </span>
          ) : (
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 6px rgba(52, 211, 153, 0.7)'
            }} title="Gemini Ready" />
          )}

          {/* Dock Button (if detached) */}
          {isDetached && onDock && (
            <button
              onClick={onDock}
              className="btn-secondary"
              style={{ padding: '2px 6px', fontSize: '10px', gap: '3px' }}
              title="Dock droplet back into Explorer"
            >
              <Anchor size={11} />
              <span>Dock</span>
            </button>
          )}

          {/* Close Panel */}
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              padding: '3px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Conversational Research Area */}
      <div className="research-conversation-body">
        {history.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 16px',
            textAlign: 'center',
            gap: '8px',
            color: 'var(--text-muted)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Sparkles size={18} />
            </div>

            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>
              Ask anything about your code
            </div>

            <p style={{ fontSize: '11px', maxWidth: '300px', lineHeight: 1.5 }}>
              Ask technical questions, explore architectural tradeoffs, analyze algorithms, or request deep research from Gemini.
            </p>
          </div>
        ) : (
          history.map((item) => (
            <React.Fragment key={item.id}>
              {/* User Query */}
              {item.sender === 'user' && (
                <div className="research-query-bubble">
                  {item.text}
                </div>
              )}

              {/* Assistant Research Report Card */}
              {item.sender === 'assistant' && (
                <div className="research-result-card">
                  {/* Phased Progress (Only shown while researching or if active) */}
                  {item.phases && item.phases.length > 0 && isResearching && (
                    <div className="research-phases">
                      {item.phases.map((phase, pIdx) => (
                        <div
                          key={pIdx}
                          className={`research-phase-item ${phase.status}`}
                        >
                          {phase.status === 'done' && <CheckCircle2 size={11} color="#34d399" />}
                          {phase.status === 'active' && <Loader2 size={11} className="spin" color="#38bdf8" />}
                          <span>{phase.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Research Content rendered with integrated code blocks */}
                  {item.text && renderMessageContent(item.text, item.id)}

                  {/* Citations & Sources */}
                  {item.sources && item.sources.length > 0 && (
                    <div className="research-sources">
                      <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Citations:</span>
                      {item.sources.map((src, sIdx) => (
                        <span key={sIdx} className="research-source-pill">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Text Input & Actions Footer */}
      <div className="research-input-footer">
        {/* Context bar with active file and clear history button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={11} />
            <span>Context: <strong style={{ color: 'var(--text-bright)' }}>{activeFileName || 'Workspace'}</strong></span>
          </div>

          {history.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="Clear research log"
            >
              <Trash2 size={10} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Input Row */}
        <div className="research-input-row">
          <textarea
            className="research-textarea"
            placeholder="Ask research query or explore code..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isResearching}
            className="btn-primary"
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: '4px',
              gap: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Send query (Enter)"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
