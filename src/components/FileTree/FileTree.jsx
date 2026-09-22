import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  FileJson,
  Plus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const FileTree = ({
  files = [],
  folderName = 'workspace',
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteItem,
  onOpenFolder,
  onOpenFile
}) => {
  const [openFolders, setOpenFolders] = useState({});
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false);
  const [creatingType, setCreatingType] = useState(null);
  const [targetParentPath, setTargetParentPath] = useState('/');
  const [newItemName, setNewItemName] = useState('');

  const toggleFolder = (path) => {
    setOpenFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleStartCreate = (type, parentPath = '/') => {
    setCreatingType(type);
    setTargetParentPath(parentPath);
    setNewItemName('');
  };

  const handleFinishCreate = () => {
    const trimmed = newItemName.trim();
    if (trimmed) {
      if (creatingType === 'file') {
        onCreateFile(targetParentPath, trimmed);
      } else if (creatingType === 'folder') {
        onCreateFolder(targetParentPath, trimmed);
      }
    }
    setCreatingType(null);
    setNewItemName('');
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode size={14} color="#61afef" />;
      case 'py':
        return <FileCode size={14} color="#e5c07b" />;
      case 'html':
        return <FileCode size={14} color="#e06c75" />;
      case 'css':
        return <FileCode size={14} color="#56b6c2" />;
      case 'json':
        return <FileJson size={14} color="#c678dd" />;
      case 'md':
        return <FileText size={14} color="#98c379" />;
      default:
        return <File size={14} color="var(--text-muted)" />;
    }
  };

  const renderTree = (items, depth = 0) => {
    if (!items || items.length === 0) return null;

    return items.map((item) => {
      const isFolder = item.type === 'directory';
      const isOpen = openFolders[item.path] !== undefined ? openFolders[item.path] : !!item.isOpen;
      const isActive = item.id === activeFileId;

      return (
        <div key={item.id}>
          <div
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.path);
              } else {
                onSelectFile(item);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '3px 8px',
              paddingLeft: `${10 + depth * 14}px`,
              fontSize: '12px',
              cursor: 'pointer',
              background: isActive ? 'var(--bg-active)' : 'transparent',
              color: isActive ? 'var(--text-bright)' : 'var(--text-main)',
              borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent'
            }}
            className="file-tree-item"
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
              {isFolder ? (
                <>
                  {isOpen ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
                  {isOpen ? <FolderOpen size={14} color="#dcb67a" /> : <Folder size={14} color="#dcb67a" />}
                </>
              ) : (
                <>
                  <span style={{ width: '13px' }} />
                  {getFileIcon(item.name)}
                </>
              )}
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {isFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCreate('file', item.path);
                  }}
                  title="New File in Folder"
                  style={{ opacity: 0.7, padding: '2px' }}
                >
                  <Plus size={12} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                title="Delete"
                style={{ opacity: 0.7, padding: '2px' }}
              >
                <Trash2 size={12} color="var(--accent-danger)" />
              </button>
            </div>
          </div>

          {isFolder && isOpen && item.children && (
            <div>
              {renderTree(item.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Explorer Main Header */}
      <div style={{
        padding: '9px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <span>EXPLORER</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {onOpenFolder && (
            <button
              onClick={onOpenFolder}
              title="Open Folder on PC (Ctrl+O)"
              style={{ padding: '2px', color: 'var(--text-muted)' }}
            >
              <FolderOpen size={13} />
            </button>
          )}
          {onOpenFile && (
            <button
              onClick={onOpenFile}
              title="Open File from PC"
              style={{ padding: '2px', color: 'var(--text-muted)' }}
            >
              <File size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Workspace Section Header (VS Code Style Accordion) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px 4px 10px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          color: 'var(--text-bright)'
        }}
      >
        <div
          onClick={() => setIsWorkspaceCollapsed(prev => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            overflow: 'hidden',
            flex: 1
          }}
          title={folderName || 'workspace'}
        >
          {isWorkspaceCollapsed ? (
            <ChevronRight size={13} color="var(--text-muted)" />
          ) : (
            <ChevronDown size={13} color="var(--text-muted)" />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {folderName || 'workspace'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={() => handleStartCreate('file', '/')}
            title="New File"
            style={{ padding: '2px', color: 'var(--text-muted)' }}
          >
            <Plus size={13} />
          </button>
          <button
            onClick={() => handleStartCreate('folder', '/')}
            title="New Folder"
            style={{ padding: '2px', color: 'var(--text-muted)' }}
          >
            <FolderPlus size={13} />
          </button>
        </div>
      </div>

      {/* Creation Input */}
      {creatingType && (
        <div style={{ padding: '6px 8px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            autoFocus
            type="text"
            placeholder={creatingType === 'file' ? 'filename.ext' : 'folder name'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishCreate();
              if (e.key === 'Escape') setCreatingType(null);
            }}
            onBlur={handleFinishCreate}
            style={{ width: '100%', fontSize: '11px', padding: '3px 6px' }}
          />
        </div>
      )}

      {/* Tree Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {files.length === 0 ? (
          <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No folder opened.</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {onOpenFolder && (
                <button
                  onClick={onOpenFolder}
                  className="btn-primary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Open Folder
                </button>
              )}
              {onOpenFile && (
                <button
                  onClick={onOpenFile}
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  Open File
                </button>
              )}
            </div>
          </div>
        ) : (
          !isWorkspaceCollapsed && renderTree(files)
        )}
      </div>
    </div>
  );
};
