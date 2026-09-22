import React from 'react';
import {
  Play,
  Settings,
  Terminal,
  Bot,
  Users,
  Code,
  FolderOpen,
  File
} from 'lucide-react';

export const Header = ({
  room,
  theme,
  onThemeChange,
  onRunCode,
  onOpenFolder,
  onOpenFile,
  onOpenCollaborationModal,
  onOpenSettingsModal,
  showTerminal,
  onToggleTerminal,
  showAISidecar,
  onToggleAISidecar,
  activeFileName
}) => {
  const themes = [
    { id: 'atom-one-dark', label: 'Atom One Dark' },
    { id: 'tokyo-night', label: 'Tokyo Night' },
    { id: 'midnight-slate', label: 'Midnight Slate' },
    { id: 'light-modern', label: 'Light Modern' }
  ];

  return (
    <header className="app-header">
      {/* Left: Brand Identity & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code size={16} color="var(--accent-primary)" />
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-bright)' }}>
            Collaborative IDE
          </span>
        </div>

        {onOpenFolder && (
          <button
            onClick={onOpenFolder}
            className="btn-secondary"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              gap: '4px',
              marginLeft: '2px'
            }}
            title="Open Folder on PC (Ctrl+Shift+O)"
          >
            <FolderOpen size={12} />
            <span>Open Folder</span>
          </button>
        )}

        {onOpenFile && (
          <button
            onClick={onOpenFile}
            className="btn-secondary"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              gap: '4px'
            }}
            title="Open File from PC (Ctrl+O)"
          >
            <File size={12} />
            <span>Open File</span>
          </button>
        )}

        {activeFileName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginLeft: '4px',
            paddingLeft: '8px',
            borderLeft: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            <span>{activeFileName}</span>
          </div>
        )}
      </div>

      {/* Center: Compact Collaboration Indicator */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {room && (
          <button
            onClick={onOpenCollaborationModal}
            className="btn-secondary"
            style={{
              padding: '3px 10px',
              fontSize: '12px',
              gap: '6px',
              color: 'var(--text-bright)'
            }}
            title="Manage Collaboration Room"
          >
            <Users size={13} color="var(--accent-success)" />
            <span>Room:</span>
            <strong style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
              {room.roomId || ''}
            </strong>
            {room.collaborators && room.collaborators.length > 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                ({room.collaborators.length})
              </span>
            )}
          </button>
        )}
      </div>

      {/* Right: Workspace Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Run Action */}
        <button
          onClick={onRunCode}
          className="btn-primary"
          style={{
            padding: '3px 10px',
            gap: '5px'
          }}
          title="Run Active File (Ctrl+F5)"
        >
          <Play size={12} fill="currentColor" />
          <span>Run</span>
        </button>

        {/* Theme Selector */}
        <select
          value={theme}
          onChange={(e) => onThemeChange(e.target.value)}
          style={{
            height: '26px',
            fontSize: '11px',
            padding: '2px 6px',
            cursor: 'pointer'
          }}
          title="Select Color Theme"
        >
          {themes.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        {/* Terminal Toggle */}
        <button
          onClick={onToggleTerminal}
          style={{
            padding: '5px',
            color: showTerminal ? 'var(--text-bright)' : 'var(--text-muted)',
            background: showTerminal ? 'var(--bg-active)' : 'transparent'
          }}
          title="Toggle Terminal Panel (Ctrl+`)"
        >
          <Terminal size={15} />
        </button>

        {/* AI Assistant Toggle */}
        <button
          onClick={onToggleAISidecar}
          style={{
            padding: '5px',
            color: showAISidecar ? 'var(--text-bright)' : 'var(--text-muted)',
            background: showAISidecar ? 'var(--bg-active)' : 'transparent'
          }}
          title="Toggle AI Assistant (Ctrl+I)"
        >
          <Bot size={15} />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          style={{
            padding: '5px',
            color: 'var(--text-muted)'
          }}
          title="Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
