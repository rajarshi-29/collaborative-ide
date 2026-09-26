const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function readDirectoryRecursive(dirPath, rootPath = dirPath, depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      if (
        entry.name === '.git' ||
        entry.name === 'node_modules' ||
        entry.name === '.vscode' ||
        entry.name === 'dist' ||
        entry.name === '.idea'
      ) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = '/' + path.relative(rootPath, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        items.push({
          id: 'dir-' + fullPath,
          name: entry.name,
          path: relativePath,
          fullPath: fullPath,
          type: 'directory',
          isOpen: depth < 1,
          children: readDirectoryRecursive(fullPath, rootPath, depth + 1, maxDepth)
        });
      } else {
        const ext = entry.name.split('.').pop()?.toLowerCase() || '';
        const langMap = {
          js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
          py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
          c: 'c', cpp: 'cpp', java: 'java', go: 'go', rs: 'rust', sql: 'sql', sh: 'shell'
        };
        items.push({
          id: 'file-' + fullPath,
          name: entry.name,
          path: relativePath,
          fullPath: fullPath,
          type: 'file',
          language: langMap[ext] || 'plaintext'
        });
      }
    }

    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });

    return items;
  } catch (err) {
    console.warn('Error reading directory:', dirPath, err);
    return [];
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Collaborative IDE',
    width: 1366,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    backgroundColor: '#181a1f',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const distPath = path.join(__dirname, '../dist/index.html');

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Native File System Dialog & Operations
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Open Workspace Folder'
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const rootPath = result.filePaths[0];
  const folderName = path.basename(rootPath);
  const files = readDirectoryRecursive(rootPath);

  return {
    canceled: false,
    rootPath,
    folderName,
    files
  };
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Open File from PC'
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const files = [];
  for (const filePath of result.filePaths) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const name = path.basename(filePath);
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const langMap = {
        js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
        py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
        c: 'c', cpp: 'cpp', java: 'java', go: 'go', rs: 'rust', sql: 'sql', sh: 'shell'
      };
      files.push({
        id: 'file-' + filePath,
        name,
        path: '/' + name,
        fullPath: filePath,
        type: 'file',
        language: langMap[ext] || 'plaintext',
        content
      });
    } catch (err) {
      console.warn('Failed to read file:', filePath, err);
    }
  }

  return { canceled: false, files };
});

ipcMain.handle('exec:runFile', async (event, { fullPath, language }) => {
  return new Promise((resolve) => {
    const { execFile } = require('child_process');
    const dir = path.dirname(fullPath);

    let executable = '';
    let args = [];

    if (language === 'python' || fullPath.endsWith('.py')) {
      executable = 'python';
      args = [fullPath];
    } else if (language === 'javascript' || fullPath.endsWith('.js') || fullPath.endsWith('.mjs') || fullPath.endsWith('.cjs')) {
      executable = 'node';
      args = [fullPath];
    } else if (fullPath.endsWith('.bat') || fullPath.endsWith('.cmd')) {
      executable = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
      args = process.platform === 'win32' ? ['/d', '/c', fullPath] : [fullPath];
    } else {
      resolve({
        success: false,
        stdout: '',
        stderr: `Running ${language || 'this'} files directly is not configured. Supported: Python, JavaScript/Node.`,
        exitCode: 1
      });
      return;
    }

    execFile(executable, args, { cwd: dir, timeout: 15000, shell: false, windowsHide: true }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : ''),
        exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0
      });
    });
  });
});

ipcMain.handle('exec:runCommand', async (event, { command, cwd }) => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const runCwd = cwd && fs.existsSync(cwd) ? cwd : process.cwd();

    exec(command, { cwd: runCwd, timeout: 20000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : ''),
        exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0
      });
    });
  });
});

ipcMain.handle('fs:searchFiles', async (event, { rootPath, query, matchCase, matchWholeWord }) => {
  if (!rootPath || !query || !query.trim()) return [];
  try {
    const results = [];
    const maxResults = 150;
    const regex = matchWholeWord
      ? new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, matchCase ? 'g' : 'gi')
      : null;

    async function walk(currentDir) {
      if (results.length >= maxResults) return;
      let entries;
      try {
        entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      } catch (e) {
        return;
      }

      for (const entry of entries) {
        if (results.length >= maxResults) return;
        if (['.git', 'node_modules', '.vscode', 'dist', '.idea', 'coverage'].includes(entry.name)) continue;

        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.bin', '.webp'].includes(ext)) {
            continue;
          }
          try {
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, lineIndex) => {
              if (results.length >= maxResults) return;
              let isMatch = false;
              if (matchWholeWord) {
                isMatch = regex.test(line);
                regex.lastIndex = 0;
              } else if (matchCase) {
                isMatch = line.includes(query);
              } else {
                isMatch = line.toLowerCase().includes(query.toLowerCase());
              }

              if (isMatch) {
                results.push({
                  file: {
                    id: 'file-' + fullPath,
                    name: entry.name,
                    fullPath: fullPath,
                    path: '/' + path.relative(rootPath, fullPath).replace(/\\/g, '/'),
                    type: 'file'
                  },
                  lineNumber: lineIndex + 1,
                  lineContent: line.trim()
                });
              }
            });
          } catch (e) {}
        }
      }
    }

    await walk(rootPath);
    return results;
  } catch (err) {
    console.warn('fs:searchFiles error:', err);
    return [];
  }
});

ipcMain.handle('fs:readFile', async (event, fullPath) => {
  try {
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:writeFile', async (event, { fullPath, content }) => {
  try {
    await fs.promises.writeFile(fullPath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:createFile', async (event, { parentFullPath, fileName }) => {
  try {
    const fullPath = path.join(parentFullPath, fileName);
    await fs.promises.writeFile(fullPath, '', 'utf-8');
    return { success: true, fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:createDirectory', async (event, { parentFullPath, folderName }) => {
  try {
    const fullPath = path.join(parentFullPath, folderName);
    await fs.promises.mkdir(fullPath, { recursive: true });
    return { success: true, fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:deleteItem', async (event, fullPath) => {
  try {
    const stat = await fs.promises.stat(fullPath);
    if (stat.isDirectory()) {
      await fs.promises.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(fullPath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
