---
name: electron-development
description: >-
  Guide for implementing native desktop features, IPC communication, secure preload bridge bindings,
  file system operations, and child process execution in the Electron runtime.
---

# Electron Development & Native Integration Runbook

This skill outlines the workflow for developing native desktop capabilities within the Electron layer of the Collaborative IDE.

---

## 1. Security Architecture & Baseline

All Electron code must comply with Chromium and Electron security best practices:

- **Context Isolation**: Always enable `contextIsolation: true` in `webPreferences`.
- **Node Integration**: Always disable `nodeIntegration: false`.
- **Preload Scripts**: The preload script is the **only** layer allowed to bridge Node.js APIs to the renderer.
- **Path Sanitization**: Validate all file paths received from the renderer process in `main.cjs` to prevent directory traversal outside the user workspace.

---

## 2. Adding New IPC Channels: 3-Step Pattern

Whenever native functionality (e.g. running a build tool, reading Git status) is required, follow this 3-step pattern:

### Step 1: Implement Main Process Handler (`electron/main.cjs`)
Register an asynchronous handler using `ipcMain.handle()`:

```javascript
ipcMain.handle('git:getStatus', async (event, workspacePath) => {
  try {
    if (!workspacePath || typeof workspacePath !== 'string') {
      throw new Error('Invalid workspace path');
    }
    const { execSync } = require('child_process');
    const output = execSync('git status --porcelain', {
      cwd: workspacePath,
      encoding: 'utf8'
    });
    return { success: true, output };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
```

### Step 2: Expose in Preload Bridge (`electron/preload.cjs`)
Expose a typed, promise-returning function via `contextBridge`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Existing methods...
  getGitStatus: (workspacePath) => ipcRenderer.invoke('git:getStatus', workspacePath)
});
```

### Step 3: Consume in React Renderer (`src/`)
Invoke the method with an appropriate fallback for non-Electron environments:

```javascript
export async function fetchGitStatus(workspacePath) {
  if (window.electronAPI?.getGitStatus) {
    const res = await window.electronAPI.getGitStatus(workspacePath);
    if (!res.success) throw new Error(res.error);
    return res.output;
  }
  // Graceful fallback
  return '';
}
```

---

## 3. Native File System Operations

When manipulating files from `main.cjs`:
- **Recursive Directory Creation**: Always pass `{ recursive: true }` to `fs.mkdirSync` or `fs.promises.mkdir`.
- **Atomic File Writes**: For critical files, write to a temporary file before renaming to prevent data corruption if the IDE process terminates mid-write.
- **Normalization**: Always normalize path separators (`path.normalize(p)`) to support Windows backslashes and POSIX slashes interchangeably.

---

## 4. Spawning Child Processes & Terminal Commands

When running compilers or language runtimes from `CodeRunnerService`:
- Use `child_process.spawn` with stream listeners (`stdout.on('data')`, `stderr.on('data')`) for real-time output.
- Set `shell: true` on Windows if executing shell-specific commands (`dir`, `.bat` files).
- Handle process termination cleanly by attaching `proc.on('close', code => ...)` and `proc.on('error', err => ...)`.
- Ensure child processes are killed if the user requests cancellation or closes the terminal session.
