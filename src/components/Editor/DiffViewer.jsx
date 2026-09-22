import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Check, X, ArrowLeftRight } from 'lucide-react';

export const DiffViewer = ({
  originalContent,
  modifiedContent,
  language,
  theme,
  onAccept,
  onReject
}) => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      background: 'var(--bg-editor)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Diff Toolbar */}
      <div style={{
        height: '34px',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <ArrowLeftRight size={14} color="var(--accent-primary)" />
          <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>Diff Preview</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onReject}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
          >
            <X size={12} />
            Reject
          </button>

          <button
            onClick={onAccept}
            className="btn-primary"
            style={{ padding: '3px 10px', fontSize: '11px', gap: '4px' }}
          >
            <Check size={12} />
            Accept Changes
          </button>
        </div>
      </div>

      {/* Monaco Diff Editor */}
      <div style={{ flex: 1 }}>
        <DiffEditor
          height="100%"
          language={language}
          original={originalContent}
          modified={modifiedContent}
          theme={theme === 'light-modern' ? 'light' : theme}
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            renderSideBySide: true,
            automaticLayout: true,
            readOnly: true
          }}
        />
      </div>
    </div>
  );
};
