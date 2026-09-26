import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Copy,
  Check,
  Code,
  ArrowDownLeft,
  FileText,
  Search,
  ShieldAlert,
  Cpu,
  Layers,
  CheckCircle2,
  Loader2,
  Anchor
} from 'lucide-react';

const QUICK_COMMANDS = [
  { id: 'deep-research', label: 'Deep Research', icon: Search, query: 'Perform an exhaustive deep research on this codebase architecture, data flows, and potential scaling bottlenecks.' },
  { id: 'analyze-context', label: 'Analyze Context', icon: Cpu, query: 'Analyze the current active file and explain its key dependencies, exports, and execution patterns.' },
  { id: 'arch-review', label: 'Architecture Review', icon: Layers, query: 'Review the architecture of this component. Suggest optimal separation of concerns and maintainability improvements.' },
  { id: 'security-audit', label: 'Security Audit', icon: ShieldAlert, query: 'Run a security audit on this module. Check for prototype pollution, unescaped inputs, race conditions, or unhandled errors.' }
];

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
      const panelWidth = Math.min(430, window.innerWidth - 24);
      const estHeight = 490;

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

      // Horizontal Placement: Center relative to droplet, clamp within IDE viewport
      let left = rect.left + rect.width / 2 - panelWidth / 2;
      let horizontalOrigin = 'center';

      if (left < 12) {
        left = 12;
        horizontalOrigin = 'left';
      } else if (left + panelWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - panelWidth - 12);
        horizontalOrigin = 'right';
      }

      setPanelPosStyle({
        top: top !== null ? `${top}px` : 'auto',
        bottom: bottom !== null ? `${bottom}px` : 'auto',
        left: `${left}px`,
        width: `${panelWidth}px`,
        maxHeight: `${Math.min(520, window.innerHeight - 80)}px`,
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

  return (
    <div
      ref={panelRef}
      className="research-panel"
      style={panelPosStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header */}
      <div className="research-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #38bdf8 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
          }}>
            <Sparkles size={13} />
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)' }}>
              AI Research Assistant
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
              Adaptive Context Engine
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Status Indicator */}
          <span
            className={`badge ${isResearching ? 'badge-warning' : 'badge-success'}`}
            style={{ fontSize: '9.5px', gap: '4px' }}
          >
            {isResearching ? <Loader2 size={10} className="spin" /> : <CheckCircle2 size={10} />}
            <span>{isResearching ? 'Researching' : 'Ready'}</span>
          </span>

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
            style={{ color: 'var(--text-muted)', padding: '3px', borderRadius: '3px' }}
            title="Close Research Panel (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Quick Command Chips */}
      <div className="research-chips-bar">
        {QUICK_COMMANDS.map((chip) => {
          const IconComp = chip.icon;
          return (
            <button
              key={chip.id}
              className="research-chip"
              onClick={() => handleSend(chip.query)}
              disabled={isResearching}
              title={chip.query}
            >
              <IconComp size={11} />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Conversational Research Area */}
      <div className="research-conversation-body">
        {history.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 12px',
            textAlign: 'center',
            gap: '10px',
            color: 'var(--text-muted)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Sparkles size={20} />
            </div>

            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>
              Ask anything about your code
            </div>

            <p style={{ fontSize: '11px', maxWidth: '300px', lineHeight: 1.5 }}>
              The AI Research Droplet analyzes workspace semantics, cross-file imports, and runtime dynamics. Click any quick command above or type your inquiry.
            </p>

            {activeFileName && (
              <div style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent-primary)'
              }}>
                Active Context: <strong>{activeFileName}</strong>
              </div>
            )}
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
                  {/* Multi-Phase Synthesis Progress */}
                  {item.phases && item.phases.length > 0 && (
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

                  {/* Main Research Analysis */}
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {item.text}
                  </div>

                  {/* Code Recommendation Blocks */}
                  {item.codeBlocks && item.codeBlocks.map((block, cIdx) => {
                    const blockId = `${item.id}-code-${cIdx}`;
                    const isCopied = copiedId === blockId;

                    return (
                      <div key={cIdx} className="research-code-block">
                        <div className="research-code-header">
                          <span>{block.language || 'code'}</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleCopyCode(block.code, blockId)}
                              style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                              title="Copy snippet"
                            >
                              {isCopied ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>

                            {onApplyCode && (
                              <button
                                onClick={() => onApplyCode(block.code)}
                                style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-primary)' }}
                                title="Apply this code directly to active editor"
                              >
                                <ArrowDownLeft size={11} />
                                <span>Apply</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <pre className="research-code-content">{block.code}</pre>
                      </div>
                    );
                  })}

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

        {isResearching && (
          <div className="research-result-card" style={{ opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
              <Loader2 size={13} className="spin" />
              <span style={{ fontSize: '11px', fontWeight: 500 }}>
                Synthesizing research across AST and workspace...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Text Input & Actions Footer */}
      <div className="research-input-footer">
        {/* Context bar with active file and clear history button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={11} />
            <span>Context: <strong>{activeFileName || 'Whole Workspace'}</strong></span>
          </div>

          {history.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}
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
            placeholder="Ask research query (e.g. 'Optimize memory allocation in collab.js')..."
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
