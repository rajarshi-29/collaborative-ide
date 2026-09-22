import React from 'react';
import { GitBranch, AlertCircle, CheckCircle, Radio } from 'lucide-react';

export const StatusBar = ({
  room,
  activeLanguage,
  cursorPosition,
  onOpenCollaborationModal
}) => {
  return (
    <footer className="status-bar" aria-label="Status Bar">
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <button
          className="status-bar-item"
          title="Source Control Branch"
          onClick={() => {}}
        >
          <GitBranch size={12} />
          <span>main</span>
        </button>

        <button
          className="status-bar-item"
          title="Problems: 0 errors, 0 warnings"
          onClick={() => {}}
        >
          <CheckCircle size={12} color="var(--accent-success)" />
          <span>0</span>
        </button>

        {room && (
          <button
            className="status-bar-item"
            title="Real-time Collaboration Status"
            onClick={onOpenCollaborationModal}
          >
            <Radio size={11} color="var(--accent-success)" />
            <span>{room.roomId || 'Offline'}</span>
            {room.collaborators && room.collaborators.length > 0 && (
              <span>({room.collaborators.length})</span>
            )}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {cursorPosition && (
          <span className="status-bar-item" title="Cursor Line and Column">
            Ln {cursorPosition.line}, Col {cursorPosition.col}
          </span>
        )}

        <span className="status-bar-item" title="Indentation Settings">
          Spaces: 2
        </span>

        <span className="status-bar-item" title="File Encoding">
          UTF-8
        </span>

        {activeLanguage && (
          <span className="status-bar-item" title="Active Language Mode" style={{ textTransform: 'capitalize' }}>
            {activeLanguage}
          </span>
        )}
      </div>
    </footer>
  );
};
