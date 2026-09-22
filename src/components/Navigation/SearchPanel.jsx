import React, { useState } from 'react';
import { Search } from 'lucide-react';

export const SearchPanel = ({
  files = [],
  onSelectFile
}) => {
  const [query, setQuery] = useState('');

  const getMatches = () => {
    if (!query.trim()) return [];

    const results = [];
    const searchRecursive = (items) => {
      for (const item of items) {
        if (item.type === 'file' && item.content) {
          const lines = item.content.split('\n');
          lines.forEach((line, lineIndex) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                file: item,
                lineNumber: lineIndex + 1,
                lineContent: line.trim()
              });
            }
          });
        } else if (item.children) {
          searchRecursive(item.children);
        }
      }
    };
    searchRecursive(files);
    return results;
  };

  const matches = getMatches();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)'
      }}>
        <span>SEARCH</span>
      </div>

      {/* Search Input */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          padding: '2px 6px'
        }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search in files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '2px',
              fontSize: '12px'
            }}
          />
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {matches.map((match, idx) => (
          <div
            key={idx}
            onClick={() => onSelectFile(match.file)}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              borderBottom: '1px solid var(--border-subtle)'
            }}
            className="file-tree-item"
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>{match.file.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>:{match.lineNumber}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {match.lineContent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
