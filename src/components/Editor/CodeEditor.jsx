import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { CollaborationService } from '../../services/collaborationService';

export const CodeEditor = ({
  activeTab,
  theme,
  onChangeContent,
  onCursorChange
}) => {
  const editorRef = useRef(null);
  const collabService = CollaborationService.getInstance();

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    window.monaco = monaco;

    // Define Refined Atom One Dark Theme in Monaco
    monaco.editor.defineTheme('atom-one-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '636d83', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'type', foreground: 'e5c07b' },
        { token: 'function', foreground: '61afef' },
        { token: 'variable', foreground: 'e06c75' }
      ],
      colors: {
        'editor.background': '#282c34',
        'editor.foreground': '#abb2bf',
        'editor.lineHighlightBackground': '#2c313a',
        'editorCursor.foreground': '#4d78cc',
        'editorWhitespace.foreground': '#3b4048',
        'editorIndentGuide.background': '#3b4048',
        'editorIndentGuide.activeBackground': '#4d78cc'
      }
    });

    monaco.editor.defineTheme('tokyo-night', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'bb9af7' },
        { token: 'string', foreground: '9ece6a' },
        { token: 'number', foreground: 'ff9e64' },
        { token: 'type', foreground: '7dcfff' },
        { token: 'function', foreground: '7aa2f7' }
      ],
      colors: {
        'editor.background': '#1a1b26',
        'editor.foreground': '#a9b1d6',
        'editor.lineHighlightBackground': '#1f2335'
      }
    });

    monaco.editor.defineTheme('midnight-slate', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b' },
        { token: 'keyword', foreground: 'a855f7' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'function', foreground: '38bdf8' }
      ],
      colors: {
        'editor.background': '#111827',
        'editor.foreground': '#94a3b8',
        'editor.lineHighlightBackground': '#1e293b'
      }
    });

    const targetTheme = theme === 'light-modern' ? 'light' : theme;
    monaco.editor.setTheme(targetTheme);

    // Track Cursor Position for StatusBar & Collaboration
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({ line: e.position.lineNumber, col: e.position.column });
      }
      if (activeTab) {
        collabService.updateCursor(
          e.position.lineNumber,
          e.position.column,
          activeTab.fileId,
          activeTab.name || activeTab.title || activeTab.path
        );
      }
    });
  };

  useEffect(() => {
    if (editorRef.current && activeTab) {
      collabService.bindToMonaco(editorRef.current, activeTab.fileId, activeTab.content);
      collabService.updateCursor(1, 1, activeTab.fileId, activeTab.name || activeTab.title || activeTab.path);
    }
  }, [activeTab?.fileId]);

  useEffect(() => {
    if (editorRef.current && activeTab?.targetLine) {
      try {
        editorRef.current.revealLineInCenter(activeTab.targetLine);
        editorRef.current.setPosition({ lineNumber: activeTab.targetLine, column: 1 });
        editorRef.current.focus();
      } catch (e) {}
    }
  }, [activeTab?.targetLine, activeTab?.id]);

  if (!activeTab) {
    return (
      <div
        className="editor-empty-state"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          background: 'var(--bg-editor)'
        }}
      />
    );
  }

  return (
    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Editor
        path={activeTab.path || activeTab.id}
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        theme={theme === 'light-modern' ? 'light' : theme}
        onChange={(val) => {
          if (val !== undefined) {
            onChangeContent(val);
          }
        }}
        onMount={handleEditorMount}
        options={{
          fontSize: 13,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: true, maxColumn: 80, scale: 0.75 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          formatOnType: true,
          formatOnPaste: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          glyphMargin: false
        }}
      />
    </div>
  );
};
