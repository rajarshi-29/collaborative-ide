import React, { useState, useEffect, useRef } from 'react';
import { FileSystemService } from './services/fileSystemService';
import { CollaborationService } from './services/collaborationService';
import { Header } from './components/Header/Header';
import { ActivityBar } from './components/Navigation/ActivityBar';
import { SearchPanel } from './components/Navigation/SearchPanel';
import { CollabPanel } from './components/Navigation/CollabPanel';
import { FileTree } from './components/FileTree/FileTree';
import { EditorTabs } from './components/Editor/EditorTabs';
import { CodeEditor } from './components/Editor/CodeEditor';
import { DiffViewer } from './components/Editor/DiffViewer';
import { TerminalPanel } from './components/Terminal/TerminalPanel';
import { AISidecar } from './components/AISidecar/AISidecar';
import { StatusBar } from './components/StatusBar/StatusBar';
import { QuickChatModal } from './components/Modals/QuickChatModal';
import { CollaborationModal } from './components/Modals/CollaborationModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { CodeRunnerService } from './services/codeRunnerService';
import { AIResearchWidget } from './components/AIResearchWidget/AIResearchWidget';
import './styles/index.css';

export function App() {
  const fsService = FileSystemService.getInstance();
  const collabService = CollaborationService.getInstance();

  // Workspace & File State
  const [files, setFiles] = useState(() => fsService.getWorkspace());
  const [folderName, setFolderName] = useState(() => fsService.getCurrentFolder().name);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  
  // Navigation & View State
  const [activeView, setActiveView] = useState('explorer');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  // Theme & Layout State
  const [theme, setTheme] = useState('atom-one-dark');
  const [showTerminal, setShowTerminal] = useState(true);
  const [showAISidecar, setShowAISidecar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [sidecarWidth, setSidecarWidth] = useState(320);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });

  // Collaboration State
  const [room, setRoom] = useState(() => collabService.getRoomState());
  
  // Modals & Overlays
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [diffProposal, setDiffProposal] = useState(null);
  const [runOutput, setRunOutput] = useState('');

  // Resizing state
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);
  const isResizingBottom = useRef(false);
  const [terminalHeight, setTerminalHeight] = useState(220);

  // Initialize first tab
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Auto-open first file if present
    const mainFile = fsService.getFileByPath('/src/app.py') || fsService.getFileByPath('/README.md');
    if (mainFile) {
      handleSelectFile(mainFile);
    }

    // Subscribe to Collaboration Room
    const unsubscribe = collabService.subscribe((updatedRoom) => {
      setRoom(updatedRoom);
    });

    // Parse room ID from URL if provided (e.g. invite links)
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    const initialRoom = roomFromUrl && roomFromUrl.trim() ? roomFromUrl.trim() : 'collab-room-alpha';
    collabService.joinRoom(initialRoom);

    // Global Keybindings (Ctrl+I for Quick AI, Ctrl+` for Terminal, Ctrl+O for Open Folder)
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setIsQuickChatOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFolder();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Open real directory from PC
  const handleOpenFolder = async () => {
    const res = await fsService.openDirectory();
    if (res && res.success) {
      setFiles([...fsService.getWorkspace()]);
      setFolderName(res.folderName);
      setTabs([]);
      setActiveTabId(null);
      
      // Auto-open first file if exists
      const firstFile = findFirstFile(res.files);
      if (firstFile) {
        handleSelectFile(firstFile);
      }
    }
  };

  // Open individual file(s) from PC
  const handleOpenFile = async () => {
    const res = await fsService.openFile();
    if (res && res.success && res.files && res.files.length > 0) {
      setFiles([...fsService.getWorkspace()]);
      handleSelectFile(res.files[0]);
    }
  };

  const findFirstFile = (items) => {
    for (const item of items) {
      if (item.type === 'file') return item;
      if (item.children) {
        const found = findFirstFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // File & Tab Operations
  const handleSelectFile = async (file, lineNumber = null) => {
    if (file.type !== 'file') return;

    const existingTab = tabs.find(t => t.fileId === file.id);
    if (existingTab) {
      if (lineNumber) {
        setTabs(prev => prev.map(t => t.id === existingTab.id ? { ...t, targetLine: lineNumber } : t));
      }
      setActiveTabId(existingTab.id);
      return;
    }

    let content = file.content;
    if ((content === undefined || content === null || content === '') && (file.fullPath || file.fileHandle)) {
      const loaded = await fsService.readFileContent(file);
      if (loaded !== undefined && loaded !== null) {
        content = loaded;
      }
    }

    const newTab = {
      id: 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      fileId: file.id,
      name: file.name,
      title: file.name,
      path: file.path,
      fullPath: file.fullPath,
      fileHandle: file.fileHandle,
      language: file.language || 'plaintext',
      content: content !== undefined && content !== null ? content : '',
      targetLine: lineNumber || null
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (tabId) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const closedTab = tabs.find(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);

    // Dispose Monaco model if not used by any remaining tabs
    if (closedTab && window.monaco) {
      try {
        const modelPath = closedTab.path || closedTab.id;
        const isStillUsed = newTabs.some(t => (t.path || t.id) === modelPath);
        if (!isStillUsed) {
          const modelUri = window.monaco.Uri.parse(modelPath);
          const existingModel = window.monaco.editor.getModel(modelUri);
          if (existingModel) {
            existingModel.dispose();
          }
        }
      } catch (e) {
        console.warn('Failed to dispose Monaco model:', e);
      }
    }

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const nextActive = newTabs[Math.max(0, tabIndex - 1)];
        setActiveTabId(nextActive.id);
      } else {
        setActiveTabId(null);
      }
    }
  };

  const handleEditorContentChange = (newContent) => {
    if (!activeTabId) return;

    setTabs(prev =>
      prev.map(t => {
        if (t.id === activeTabId) {
          if (t.content !== newContent) {
            return { ...t, content: newContent, isDirty: true };
          }
        }
        return t;
      })
    );

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab && activeTab.content !== newContent) {
      fsService.updateFileContent(activeTab.fileId, newContent);
    }
  };

  const handleCreateFile = async (parentPath, fileName) => {
    const newFile = await fsService.createFile(parentPath, fileName);
    setFiles([...fsService.getWorkspace()]);
    handleSelectFile(newFile);
  };

  const handleCreateFolder = async (parentPath, folderName) => {
    await fsService.createDirectory(parentPath, folderName);
    setFiles([...fsService.getWorkspace()]);
  };

  const handleDeleteItem = async (id) => {
    await fsService.deleteItem(id);
    setFiles([...fsService.getWorkspace()]);
    setTabs(prev => prev.filter(t => t.fileId !== id));
  };

  // ActivityBar view selection toggle
  const handleSelectView = (view) => {
    if (activeView === view && isSidebarVisible) {
      setIsSidebarVisible(false);
    } else {
      setActiveView(view);
      setIsSidebarVisible(true);
    }
  };

  // Run Code Action
  const handleRunCode = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    setShowTerminal(true);
    const timeStr = new Date().toLocaleTimeString();
    
    setRunOutput(`Executing ${activeTab.name || activeTab.path} (${activeTab.language})...\n`);

    const res = await CodeRunnerService.runCode(activeTab);
    
    let outputText = `[${timeStr}] Executed: ${activeTab.name || activeTab.path} (${activeTab.language})\n`;
    outputText += `---------------------------------------------------\n`;
    if (res.stdout) {
      outputText += res.stdout + '\n';
    }
    if (res.stderr) {
      outputText += `[STDERR]:\n${res.stderr}\n`;
    }
    outputText += `Process finished with exit code ${res.exitCode}.`;

    setRunOutput(outputText);
  };

  // Code Apply
  const handleApplyCode = (code) => {
    if (!activeTabId) return;
    handleEditorContentChange(code);
  };

  const handleDiffPreview = (code) => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    setDiffProposal({
      originalContent: activeTab.content,
      modifiedContent: code,
      language: activeTab.language
    });
  };

  const handleAcceptDiff = () => {
    if (diffProposal) {
      handleApplyCode(diffProposal.modifiedContent);
      setDiffProposal(null);
    }
  };

  const handleRejectDiff = () => {
    setDiffProposal(null);
  };

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  // Horizontal resizing handlers
  const handleMouseDownLeft = () => {
    isResizingLeft.current = true;
    const onMouseMove = (e) => {
      if (isResizingLeft.current) {
        setSidebarWidth(Math.max(160, Math.min(450, e.clientX - 48)));
      }
    };
    const onMouseUp = () => {
      isResizingLeft.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleMouseDownRight = () => {
    isResizingRight.current = true;
    const onMouseMove = (e) => {
      if (isResizingRight.current) {
        setSidecarWidth(Math.max(240, Math.min(600, window.innerWidth - e.clientX)));
      }
    };
    const onMouseUp = () => {
      isResizingRight.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleMouseDownBottom = () => {
    isResizingBottom.current = true;
    const onMouseMove = (e) => {
      if (isResizingBottom.current) {
        const newHeight = window.innerHeight - e.clientY - 24;
        setTerminalHeight(Math.max(120, Math.min(600, newHeight)));
      }
    };
    const onMouseUp = () => {
      isResizingBottom.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        room={room}
        theme={theme}
        onThemeChange={setTheme}
        onRunCode={handleRunCode}
        onOpenFolder={handleOpenFolder}
        onOpenFile={handleOpenFile}
        onOpenCollaborationModal={() => setIsCollabModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal(prev => !prev)}
        showAISidecar={showAISidecar}
        onToggleAISidecar={() => setShowAISidecar(prev => !prev)}
        activeFileName={activeTab?.title}
      />

      {/* Main Workspace Body */}
      <div className="workspace-body">
        {/* Activity Bar (Far Left) */}
        <ActivityBar
          activeView={isSidebarVisible ? activeView : null}
          onSelectView={handleSelectView}
          showAISidecar={showAISidecar}
          onToggleAISidecar={() => setShowAISidecar(prev => !prev)}
          showTerminal={showTerminal}
          onToggleTerminal={() => setShowTerminal(prev => !prev)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Left Sidebar: Explorer / Search / Collab */}
        {isSidebarVisible && (
          <div className="sidebar-left" style={{ width: `${sidebarWidth}px` }}>
            {activeView === 'explorer' && (
              <FileTree
                files={files}
                folderName={folderName}
                activeFileId={activeTab?.fileId || null}
                activeFileName={activeTab?.title}
                onApplyCode={handleApplyCode}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onCreateFolder={handleCreateFolder}
                onDeleteItem={handleDeleteItem}
                onOpenFolder={handleOpenFolder}
                onOpenFile={handleOpenFile}
              />
            )}
            {activeView === 'search' && (
              <SearchPanel
                files={files}
                onSelectFile={handleSelectFile}
              />
            )}
            {activeView === 'collab' && (
              <CollabPanel
                room={room}
                onJoinRoom={(newRoomId) => collabService.joinRoom(newRoomId)}
                onLeaveRoom={() => collabService.leaveRoom()}
                onReconnect={() => collabService.reconnect()}
                onSelectFile={handleSelectFile}
                files={files}
              />
            )}
          </div>
        )}

        {/* Left Resizer */}
        {isSidebarVisible && (
          <div className="gutter-horizontal" onMouseDown={handleMouseDownLeft} />
        )}

        {/* Center Workspace (Editor + Bottom Terminal) */}
        <div className="workspace-center">
          <div className="editor-section">
            <EditorTabs
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={handleCloseTab}
            />

            <CodeEditor
              activeTab={activeTab}
              theme={theme}
              onChangeContent={handleEditorContentChange}
              onCursorChange={setCursorPosition}
            />

            {/* Diff Preview Overlay */}
            {diffProposal && (
              <DiffViewer
                originalContent={diffProposal.originalContent}
                modifiedContent={diffProposal.modifiedContent}
                language={diffProposal.language}
                theme={theme}
                onAccept={handleAcceptDiff}
                onReject={handleRejectDiff}
              />
            )}
          </div>

          {/* Bottom Terminal Section */}
          {showTerminal && (
            <>
              <div className="gutter-vertical" onMouseDown={handleMouseDownBottom} />
              <TerminalPanel
                height={terminalHeight}
                onClose={() => setShowTerminal(false)}
                onAskAIWithLog={(log) => {
                  setShowAISidecar(true);
                  setIsQuickChatOpen(true);
                }}
                runOutput={runOutput}
                onClearRunOutput={() => setRunOutput('')}
                files={files}
                activeTab={activeTab}
              />
            </>
          )}
        </div>

        {/* Right Resizer */}
        {showAISidecar && (
          <div className="gutter-horizontal" onMouseDown={handleMouseDownRight} />
        )}

        {/* Right Sidebar: AI Sidecar */}
        {showAISidecar && (
          <div className="sidebar-right" style={{ width: `${sidecarWidth}px` }}>
            <AISidecar
              onClose={() => setShowAISidecar(false)}
              activeFileName={activeTab?.title}
              activeFileContent={activeTab?.content}
              selectedCode=""
              onApplyCode={handleApplyCode}
              onDiffPreview={handleDiffPreview}
            />
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        room={room}
        activeLanguage={activeTab?.language}
        cursorPosition={cursorPosition}
        onOpenCollaborationModal={() => setIsCollabModalOpen(true)}
      />

      {/* Floating Modals */}
      <QuickChatModal
        isOpen={isQuickChatOpen}
        onClose={() => setIsQuickChatOpen(false)}
        activeFileName={activeTab?.title}
        selectedCode=""
        onApplyCode={handleApplyCode}
      />

      <CollaborationModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        room={room}
        onJoinRoom={(newRoomId) => collabService.joinRoom(newRoomId)}
        onLeaveRoom={() => collabService.leaveRoom()}
        onReconnect={() => collabService.reconnect()}
        onSelectFile={handleSelectFile}
        files={files}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Floating / Detached AI Research Widget Portal */}
      <AIResearchWidget
        isDockedSlot={false}
        activeFileName={activeTab?.title}
        activeFileContent={activeTab?.content}
        onApplyCode={handleApplyCode}
      />
    </div>
  );
}
