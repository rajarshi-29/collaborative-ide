import React from 'react';
import { X } from 'lucide-react';

export const EditorTabs = ({
  tabs = [],
  activeTabId,
  onSelectTab,
  onCloseTab
}) => {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-tab-inactive)',
      borderBottom: '1px solid var(--border-color)',
      overflowX: 'auto',
      flexShrink: 0,
      height: '32px'
    }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 10px',
              height: '100%',
              fontSize: '12px',
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              background: isActive ? 'var(--bg-tab-active)' : 'transparent',
              color: isActive ? 'var(--text-bright)' : 'var(--text-muted)',
              borderRight: '1px solid var(--border-color)',
              borderTop: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent'
            }}
          >
            <span style={{ whiteSpace: 'nowrap', userSelect: 'none' }}>{tab.title}</span>

            {tab.isDirty && (
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--accent-warning)',
                  marginLeft: '2px'
                }}
                title="Unsaved changes"
              />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              style={{
                opacity: isActive ? 0.8 : 0.4,
                padding: '2px',
                borderRadius: '2px',
                marginLeft: tab.isDirty ? '2px' : '4px'
              }}
              className="tab-close-btn"
              title="Close tab"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
