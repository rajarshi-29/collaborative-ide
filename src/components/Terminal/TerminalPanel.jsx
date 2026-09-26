import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Maximize2,
  Minimize2,
  X,
  Trash2
} from 'lucide-react';

import { CodeRunnerService } from '../../services/codeRunnerService';

export const TerminalPanel = ({
  height = 220,
  onClose,
  onAskAIWithLog,
  runOutput = '',
  onClearRunOutput,
  files = [],
  activeTab = null
}) => {
  const terminalContainerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  const [activeTabPanel, setActiveTabPanel] = useState('terminal');
  const [isMaximized, setIsMaximized] = useState(false);
  const lastOutputRef = useRef('');

  const findFileByNameOrPath = (query) => {
    if (!query) return null;
    const clean = query.replace(/^\.?\//, '');
    const search = (items) => {
      for (const item of items) {
        if (item.name === clean || item.path === query || item.path === '/' + clean || item.name.toLowerCase() === clean.toLowerCase()) {
          return item;
        }
        if (item.children) {
          const found = search(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(files);
  };

  // Sync runOutput from header Run button into active terminal
  useEffect(() => {
    if (runOutput && runOutput !== lastOutputRef.current && xtermRef.current) {
      lastOutputRef.current = runOutput;
      const lines = runOutput.split('\n');
      for (const line of lines) {
        xtermRef.current.writeln(line);
      }
      xtermRef.current.write('collab-ide:~/workspace$ ');
    }
  }, [runOutput]);

  useEffect(() => {
    if (!terminalContainerRef.current) return;

    // Initialize XTerm
    const term = new XTerm({
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
      fontSize: 12,
      lineHeight: 1.2,
      theme: {
        background: '#181a1f',
        foreground: '#abb2bf',
        cursor: '#abb2bf',
        cursorAccent: '#181a1f',
        selectionBackground: 'rgba(255, 255, 255, 0.15)',
        black: '#181a1f',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#e5c07b',
        blue: '#4d78cc',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf'
      },
      cursorBlink: true,
      cursorStyle: 'block',
      convertEol: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);

    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {}
    }, 50);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.write('collab-ide:~/workspace$ ');

    let lineBuffer = '';

    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        // Enter key
        term.write('\r\n');
        handleTerminalCommand(lineBuffer.trim(), term);
        lineBuffer = '';
      } else if (code === 127 || code === 8) {
        // Backspace
        if (lineBuffer.length > 0) {
          lineBuffer = lineBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code >= 32) {
        lineBuffer += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
      } catch (e) {}
    }, 50);
    return () => clearTimeout(timer);
  }, [height, isMaximized]);

  const handleTerminalCommand = async (cmd, term) => {
    if (!cmd) {
      term.write('collab-ide:~/workspace$ ');
      return;
    }

    const parts = cmd.split(' ').filter(Boolean);
    const mainCmd = parts[0]?.toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    switch (mainCmd) {
      case 'help':
        term.writeln('Available Commands:');
        term.writeln('  run               - Execute code from active editor tab');
        term.writeln('  python <file>     - Execute a Python script');
        term.writeln('  node <file>       - Execute a JavaScript file');
        term.writeln('  cat <file>        - Print file content');
        term.writeln('  ls                - List files in current workspace');
        term.writeln('  clear             - Clear the terminal screen');
        term.writeln('  echo <text>       - Print text to terminal');
        break;

      case 'clear':
        term.clear();
        break;

      case 'ls': {
        const fileNames = files.map(f => (f.type === 'directory' ? f.name + '/' : f.name));
        term.writeln(fileNames.join('   ') || '(workspace empty)');
        break;
      }

      case 'echo':
        term.writeln(arg);
        break;

      case 'cat': {
        const target = findFileByNameOrPath(arg);
        if (target && target.type === 'file') {
          const lines = (target.content || '').split('\n');
          for (const l of lines) term.writeln(l);
        } else {
          term.writeln(`cat: ${arg}: No such file`);
        }
        break;
      }

      case 'python':
      case 'python3':
      case 'py': {
        const target = arg ? findFileByNameOrPath(arg) : (activeTab ? activeTab : null);
        if (!target) {
          term.writeln(`python: can't open file '${arg}': [Errno 2] No such file`);
          break;
        }
        term.writeln(`Executing ${target.name}...`);
        const res = await CodeRunnerService.runCode(target);
        if (res.stdout) {
          for (const l of res.stdout.split('\n')) term.writeln(l);
        }
        if (res.stderr) {
          for (const l of res.stderr.split('\n')) term.writeln(`\x1b[31m${l}\x1b[0m`);
        }
        term.writeln(`[Process finished with exit code ${res.exitCode}]`);
        break;
      }

      case 'node': {
        const target = arg ? findFileByNameOrPath(arg) : (activeTab ? activeTab : null);
        if (!target) {
          term.writeln(`node: Cannot find module '${arg}'`);
          break;
        }
        term.writeln(`Executing ${target.name}...`);
        const res = await CodeRunnerService.runCode(target);
        if (res.stdout) {
          for (const l of res.stdout.split('\n')) term.writeln(l);
        }
        if (res.stderr) {
          for (const l of res.stderr.split('\n')) term.writeln(`\x1b[31m${l}\x1b[0m`);
        }
        term.writeln(`[Process finished with exit code ${res.exitCode}]`);
        break;
      }

      case 'run': {
        if (!activeTab) {
          term.writeln('run: No active file tab open in editor.');
          break;
        }
        term.writeln(`Executing ${activeTab.name} (${activeTab.language})...`);
        const res = await CodeRunnerService.runCode(activeTab);
        if (res.stdout) {
          for (const l of res.stdout.split('\n')) term.writeln(l);
        }
        if (res.stderr) {
          for (const l of res.stderr.split('\n')) term.writeln(`\x1b[31m${l}\x1b[0m`);
        }
        term.writeln(`[Process finished with exit code ${res.exitCode}]`);
        break;
      }

      default: {
        if (window.electronAPI?.runCommand) {
          try {
            const cwd = activeTab?.fullPath ? activeTab.fullPath.substring(0, activeTab.fullPath.lastIndexOf('\\') || activeTab.fullPath.lastIndexOf('/')) : null;
            const res = await window.electronAPI.runCommand(cmd, cwd);
            if (res.stdout) {
              for (const l of res.stdout.split('\n')) term.writeln(l);
            }
            if (res.stderr) {
              for (const l of res.stderr.split('\n')) term.writeln(`\x1b[31m${l}\x1b[0m`);
            }
            break;
          } catch (e) {
            // fallback to command not found
          }
        }
        term.writeln(`bash: ${mainCmd}: command not found`);
      }
    }

    term.write('collab-ide:~/workspace$ ');
  };

  return (
    <div className="terminal-section" style={{ height: isMaximized ? '75vh' : `${height || 220}px` }}>
      {/* Panel Header */}
      <div style={{
        height: '30px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '1px' }}>
          <button
            onClick={() => setActiveTabPanel('terminal')}
            style={{
              padding: '0 10px',
              height: '100%',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: activeTabPanel === 'terminal' ? 'var(--text-bright)' : 'var(--text-muted)',
              borderBottom: activeTabPanel === 'terminal' ? '1px solid var(--accent-primary)' : '1px solid transparent'
            }}
          >
            Terminal
          </button>

          <button
            onClick={() => setActiveTabPanel('output')}
            style={{
              padding: '0 10px',
              height: '100%',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: activeTabPanel === 'output' ? 'var(--text-bright)' : 'var(--text-muted)',
              borderBottom: activeTabPanel === 'output' ? '1px solid var(--accent-primary)' : '1px solid transparent'
            }}
          >
            Output
          </button>

          <button
            onClick={() => setActiveTabPanel('problems')}
            style={{
              padding: '0 10px',
              height: '100%',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: activeTabPanel === 'problems' ? 'var(--text-bright)' : 'var(--text-muted)',
              borderBottom: activeTabPanel === 'problems' ? '1px solid var(--accent-primary)' : '1px solid transparent'
            }}
          >
            Problems (0)
          </button>
        </div>

        {/* Panel Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {activeTabPanel === 'output' && runOutput && onClearRunOutput && (
            <button
              onClick={onClearRunOutput}
              style={{ padding: '3px', color: 'var(--text-muted)' }}
              title="Clear Output"
            >
              <Trash2 size={13} />
            </button>
          )}

          {runOutput && onAskAIWithLog && (
            <button
              onClick={() => onAskAIWithLog(runOutput)}
              className="btn-secondary"
              style={{
                fontSize: '11px',
                padding: '2px 6px'
              }}
              title="Send output to AI Assistant"
            >
              Ask AI
            </button>
          )}

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{ padding: '3px', color: 'var(--text-muted)' }}
            title={isMaximized ? 'Restore Panel' : 'Maximize Panel'}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <button
            onClick={onClose}
            style={{ padding: '3px', color: 'var(--text-muted)' }}
            title="Close Panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Panel Contents */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#181a1f' }}>
        {/* Terminal Tab */}
        <div
          ref={terminalContainerRef}
          style={{
            position: 'absolute',
            inset: 0,
            padding: '4px 8px',
            display: activeTabPanel === 'terminal' ? 'block' : 'none'
          }}
        />

        {/* Output Tab */}
        {activeTabPanel === 'output' && (
          <div style={{ padding: '8px 12px', overflowY: 'auto', height: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            <pre style={{ color: 'var(--text-bright)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {runOutput}
            </pre>
          </div>
        )}

        {/* Problems Tab */}
        {activeTabPanel === 'problems' && (
          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <p>No problems have been detected in the workspace.</p>
          </div>
        )}
      </div>
    </div>
  );
};
