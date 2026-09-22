import React from 'react';
import {
  Files,
  Search,
  Users,
  Terminal,
  Bot,
  Settings
} from 'lucide-react';

export const ActivityBar = ({
  activeView,
  onSelectView,
  showAISidecar,
  onToggleAISidecar,
  showTerminal,
  onToggleTerminal,
  onOpenSettings
}) => {
  return (
    <aside className="activity-bar" aria-label="Activity Bar">
      <div className="activity-bar-group">
        <button
          className={`activity-bar-button ${activeView === 'explorer' ? 'active' : ''}`}
          onClick={() => onSelectView('explorer')}
          title="Explorer (Files)"
          aria-label="Explorer"
        >
          <Files size={19} strokeWidth={1.7} />
        </button>

        <button
          className={`activity-bar-button ${activeView === 'search' ? 'active' : ''}`}
          onClick={() => onSelectView('search')}
          title="Search in Files"
          aria-label="Search"
        >
          <Search size={19} strokeWidth={1.7} />
        </button>

        <button
          className={`activity-bar-button ${activeView === 'collab' ? 'active' : ''}`}
          onClick={() => onSelectView('collab')}
          title="Collaborators"
          aria-label="Collaborators"
        >
          <Users size={19} strokeWidth={1.7} />
        </button>

        <button
          className={`activity-bar-button ${showTerminal ? 'active' : ''}`}
          onClick={onToggleTerminal}
          title="Toggle Terminal Panel"
          aria-label="Toggle Terminal Panel"
        >
          <Terminal size={19} strokeWidth={1.7} />
        </button>

        <button
          className={`activity-bar-button ${showAISidecar ? 'active' : ''}`}
          onClick={onToggleAISidecar}
          title="Toggle AI Assistant"
          aria-label="Toggle AI Assistant"
        >
          <Bot size={19} strokeWidth={1.7} />
        </button>
      </div>

      <div className="activity-bar-group">
        <button
          className="activity-bar-button"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={19} strokeWidth={1.7} />
        </button>
      </div>
    </aside>
  );
};
