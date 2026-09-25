import React, { useState } from 'react';
import { Search, CaseSensitive, WholeWord, FileCode } from 'lucide-react';

export const SearchPanel = ({
  files = [],
  onSelectFile
}) => {
  const [query, setQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);

  const getMatches = () => {
    if (!query.trim()) return [];

    const results = [];
    const searchRecursive = (items) => {
      for (const item of items) {
        if (item.type === 'file' && item.content) {
          const lines = item.content.split('\n');
          lines.forEach((line, lineIndex) => {
            let isMatch = false;

            if (matchWholeWord) {
              const flags = matchCase ? 'g' : 'gi';
              const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escaped}\\b`, flags);
              isMatch = regex.test(line);
            } else if (matchCase) {
              isMatch = line.includes(query);
            } else {
              isMatch = line.toLowerCase().includes(query.toLowerCase());
            }

            if (isMatch) {
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
  const uniqueFilesCount = new Set(matches.map(m => m.file.id)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>SEARCH</span>
        {query.trim() && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'none' }}>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} in {uniqueFilesCount} {uniqueFilesCount === 1 ? 'file' : 'files'}
          </span>
        )}
      </div>

      {/* Search Input Bar */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
              padding: '3px 0',
              fontSize: '12px'
            }}
          />

          {/* Filter Toggles */}
          <button
            onClick={() => setMatchCase(prev => !prev)}
            style={{
              padding: '2px',
              color: matchCase ? 'var(--accent-primary)' : 'var(--text-muted)',
              background: matchCase ? 'var(--bg-active)' : 'transparent',
              borderRadius: '2px'
            }}
            title="Match Case"
          >
            <CaseSensitive size={14} />
          </button>

          <button
            onClick={() => setMatchWholeWord(prev => !prev)}
            style={{
              padding: '2px',
              color: matchWholeWord ? 'var(--accent-primary)' : 'var(--text-muted)',
              background: matchWholeWord ? 'var(--bg-active)' : 'transparent',
              borderRadius: '2px'
            }}
            title="Match Whole Word"
          >
            <WholeWord size={14} />
          </button>
        </div>
      </div>

      {/* Results List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {query.trim() && matches.length === 0 && (
          <div style={{ padding: '16px 12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No results found for "{query}".
          </div>
        )}

        {matches.map((match, idx) => (
          <div
            key={idx}
            onClick={() => onSelectFile && onSelectFile(match.file, match.lineNumber)}
            style={{
              padding: '6px 12px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileCode size={12} color="var(--accent-primary)" />
                <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>{match.file.name}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Line {match.lineNumber}</span>
            </div>
            <span style={{
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              paddingLeft: '17px'
            }}>
              {match.lineContent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
