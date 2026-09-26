const STORAGE_KEY = 'collaborative_ide_workspace_files';
const FOLDER_STORAGE_KEY = 'collaborative_ide_workspace_folder';

const DEFAULT_WORKSPACE = [
  {
    id: 'root-src',
    name: 'src',
    path: '/src',
    type: 'directory',
    isOpen: true,
    children: [
      {
        id: 'file-main-py',
        name: 'app.py',
        path: '/src/app.py',
        type: 'file',
        language: 'python',
        content: `def main():
    print("Workspace initialized.")

if __name__ == "__main__":
    main()
`
      },
      {
        id: 'file-index-js',
        name: 'collab.js',
        path: '/src/collab.js',
        type: 'file',
        language: 'javascript',
        content: `export class CollaborativeSession {
  constructor(config) {
    this.config = config;
    this.isConnected = false;
  }

  connect() {
    this.isConnected = true;
  }
}
`
      }
    ]
  },
  {
    id: 'file-readme-md',
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    language: 'markdown',
    content: `# Collaborative IDE

A desktop code editor featuring real-time collaboration and AI assistance.
`
  }
];

export class FileSystemService {
  constructor() {
    this.workspace = this.loadFromStorage();
    this.currentFolder = this.loadFolderFromStorage();
  }

  static getInstance() {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  loadFolderFromStorage() {
    try {
      const stored = localStorage.getItem(FOLDER_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { name: 'workspace', rootPath: null, isLocal: false };
  }

  saveFolderToStorage() {
    try {
      const copy = { ...this.currentFolder };
      delete copy.dirHandle;
      localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(copy));
    } catch (e) {}
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load files from storage, using defaults', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_WORKSPACE));
  }

  saveToStorage() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this._saveToStorageImmediate();
    }, 800);
  }

  _saveToStorageImmediate() {
    try {
      const cleanItems = (items) => {
        if (!Array.isArray(items)) return [];
        return items.map(item => {
          const copy = { ...item };
          delete copy.fileHandle;
          delete copy.dirHandle;
          if (copy.children) {
            copy.children = cleanItems(copy.children);
          }
          return copy;
        });
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanItems(this.workspace)));
    } catch (e) {
      console.warn('Failed to save files to storage', e);
    }
  }

  async searchFiles({ query, matchCase = false, matchWholeWord = false }) {
    if (!query || !query.trim()) return [];

    if (this.currentFolder?.rootPath && window.electronAPI?.invoke) {
      try {
        const diskResults = await window.electronAPI.invoke('fs:searchFiles', {
          rootPath: this.currentFolder.rootPath,
          query,
          matchCase,
          matchWholeWord
        });
        if (Array.isArray(diskResults)) {
          return diskResults;
        }
      } catch (err) {
        console.warn('Native searchFiles failed, falling back to memory search:', err);
      }
    }

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

    searchRecursive(this.workspace);
    return results;
  }


  getWorkspace() {
    return this.workspace;
  }

  getCurrentFolder() {
    return this.currentFolder;
  }

  // Open a real folder from PC using Electron native dialog or Web File System Access
  async openDirectory() {
    if (window.electronAPI?.invoke) {
      try {
        const result = await window.electronAPI.invoke('dialog:openDirectory');
        if (result && !result.canceled && result.files) {
          this.workspace = result.files;
          this.currentFolder = {
            name: result.folderName || 'workspace',
            rootPath: result.rootPath,
            isLocal: true
          };
          this.saveToStorage();
          this.saveFolderToStorage();
          return {
            success: true,
            folderName: this.currentFolder.name,
            rootPath: this.currentFolder.rootPath,
            files: this.workspace
          };
        }
      } catch (err) {
        console.error('Error opening directory via Electron:', err);
      }
    }

    // Fallback: Web File System Access API
    if (window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        const files = await this.readWebDirectoryHandle(dirHandle);
        this.workspace = files;
        this.currentFolder = {
          name: dirHandle.name,
          rootPath: null,
          isLocal: true,
          dirHandle
        };
        this.saveToStorage();
        this.saveFolderToStorage();
        return {
          success: true,
          folderName: dirHandle.name,
          files: this.workspace
        };
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error opening directory via Web API:', err);
        }
      }
    }

    return { canceled: true };
  }

  // Open individual files from PC
  async openFile() {
    if (window.electronAPI?.invoke) {
      try {
        const result = await window.electronAPI.invoke('dialog:openFile');
        if (result && !result.canceled && result.files && result.files.length > 0) {
          for (const newFile of result.files) {
            const existingIdx = this.workspace.findIndex(
              f => (f.fullPath && f.fullPath === newFile.fullPath) || f.name === newFile.name
            );
            if (existingIdx !== -1) {
              this.workspace[existingIdx] = newFile;
            } else {
              this.workspace.push(newFile);
            }
          }
          this.saveToStorage();
          return { success: true, files: result.files };
        }
      } catch (err) {
        console.error('Error opening file via Electron:', err);
      }
    }

    // Fallback: Web File System Access API
    if (window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({ multiple: true });
        const openedFiles = [];
        for (const handle of handles) {
          const file = await handle.getFile();
          const content = await file.text();
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          const langMap = {
            js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
            py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
            c: 'c', cpp: 'cpp', java: 'java', go: 'go', rs: 'rust', sql: 'sql', sh: 'shell'
          };
          const opened = {
            id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            name: file.name,
            path: '/' + file.name,
            type: 'file',
            language: langMap[ext] || 'plaintext',
            content
          };
          const existingIdx = this.workspace.findIndex(f => f.name === opened.name);
          if (existingIdx !== -1) {
            this.workspace[existingIdx] = opened;
          } else {
            this.workspace.push(opened);
          }
          openedFiles.push(opened);
        }
        this.saveToStorage();
        return { success: true, files: openedFiles };
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error opening file via Web API:', err);
        }
      }
    }

    return { canceled: true };
  }

  async readWebDirectoryHandle(dirHandle, parentPath = '') {
    const items = [];
    for await (const entry of dirHandle.values()) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const relativePath = `${parentPath}/${entry.name}`;

      if (entry.kind === 'directory') {
        items.push({
          id: 'dir-' + relativePath,
          name: entry.name,
          path: relativePath,
          type: 'directory',
          isOpen: false,
          children: await this.readWebDirectoryHandle(entry, relativePath)
        });
      } else {
        const file = await entry.getFile();
        const content = await file.text();
        const ext = entry.name.split('.').pop() || '';
        const langMap = {
          js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
          py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown'
        };
        items.push({
          id: 'file-' + relativePath,
          name: entry.name,
          path: relativePath,
          type: 'file',
          language: langMap[ext] || 'plaintext',
          content,
          fileHandle: entry
        });
      }
    }
    return items;
  }

  async readFileContent(file) {
    if (file.fullPath && window.electronAPI?.invoke) {
      try {
        const res = await window.electronAPI.invoke('fs:readFile', file.fullPath);
        if (res.success) {
          file.content = res.content;
          return res.content;
        }
      } catch (err) {
        console.error('Failed to read file from disk:', err);
      }
    }
    if (file.fileHandle) {
      try {
        const f = await file.fileHandle.getFile();
        const content = await f.text();
        file.content = content;
        return content;
      } catch (err) {
        console.error('Failed to read file from fileHandle:', err);
      }
    }
    return file.content || '';
  }

  async updateFileContent(id, content) {
    const file = this.getFileById(id);
    if (file && file.type === 'file') {
      file.content = content;
      file.isModified = true;

      // Save to disk if on native Electron
      if (file.fullPath && window.electronAPI?.invoke) {
        try {
          await window.electronAPI.invoke('fs:writeFile', {
            fullPath: file.fullPath,
            content
          });
        } catch (err) {
          console.error('Failed to save to disk:', err);
        }
      } else if (file.fileHandle && typeof file.fileHandle.createWritable === 'function') {
        try {
          const writable = await file.fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
        } catch (err) {
          console.error('Failed to save to fileHandle:', err);
        }
      }

      this.saveToStorage();
    }
  }

  getFileById(id) {
    const findRecursive = (items) => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findRecursive(item.children);
          if (found) return found;
        }
      }
    };
    return findRecursive(this.workspace);
  }

  getFileByPath(path) {
    const findRecursive = (items) => {
      for (const item of items) {
        if (item.path === path) return item;
        if (item.children) {
          const found = findRecursive(item.children);
          if (found) return found;
        }
      }
    };
    return findRecursive(this.workspace);
  }

  async createFile(parentPath, fileName, content = '') {
    const ext = fileName.split('.').pop() || 'txt';
    const langMap = {
      js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
      py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
      c: 'c', cpp: 'cpp', java: 'java', go: 'go', rs: 'rust', sql: 'sql', sh: 'shell'
    };

    let parentFullPath = this.currentFolder.rootPath;
    const parent = parentPath !== '/' && parentPath !== '' ? this.getFileByPath(parentPath) : null;
    if (parent?.fullPath) {
      parentFullPath = parent.fullPath;
    }

    let fullPath = null;
    if (parentFullPath && window.electronAPI?.invoke) {
      const res = await window.electronAPI.invoke('fs:createFile', { parentFullPath, fileName });
      if (res.success) {
        fullPath = res.fullPath;
      }
    }

    const newFile = {
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: fileName,
      path: (parentPath === '/' ? '' : parentPath) + '/' + fileName,
      fullPath,
      type: 'file',
      language: langMap[ext] || 'plaintext',
      content: content,
    };

    if (parentPath === '/' || parentPath === '') {
      this.workspace.push(newFile);
    } else {
      if (parent && parent.children) {
        parent.children.push(newFile);
        parent.isOpen = true;
      } else {
        this.workspace.push(newFile);
      }
    }

    this.saveToStorage();
    return newFile;
  }

  async createDirectory(parentPath, folderName) {
    let parentFullPath = this.currentFolder.rootPath;
    const parent = parentPath !== '/' && parentPath !== '' ? this.getFileByPath(parentPath) : null;
    if (parent?.fullPath) {
      parentFullPath = parent.fullPath;
    }

    let fullPath = null;
    if (parentFullPath && window.electronAPI?.invoke) {
      const res = await window.electronAPI.invoke('fs:createDirectory', { parentFullPath, folderName });
      if (res.success) {
        fullPath = res.fullPath;
      }
    }

    const newDir = {
      id: 'dir-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: folderName,
      path: (parentPath === '/' ? '' : parentPath) + '/' + folderName,
      fullPath,
      type: 'directory',
      isOpen: true,
      children: []
    };

    if (parentPath === '/' || parentPath === '') {
      this.workspace.push(newDir);
    } else {
      if (parent && parent.children) {
        parent.children.push(newDir);
        parent.isOpen = true;
      } else {
        this.workspace.push(newDir);
      }
    }

    this.saveToStorage();
    return newDir;
  }

  async deleteItem(id) {
    const item = this.getFileById(id);
    if (item?.fullPath && window.electronAPI?.invoke) {
      try {
        await window.electronAPI.invoke('fs:deleteItem', item.fullPath);
      } catch (err) {
        console.error('Failed to delete on disk:', err);
      }
    }

    const removeRecursive = (items) => {
      const index = items.findIndex(i => i.id === id);
      if (index !== -1) {
        items.splice(index, 1);
        return true;
      }
      for (const it of items) {
        if (it.children && removeRecursive(it.children)) {
          return true;
        }
      }
      return false;
    };

    removeRecursive(this.workspace);
    this.saveToStorage();
  }

  resetToDefaults() {
    this.workspace = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE));
    this.currentFolder = { name: 'workspace', rootPath: null, isLocal: false };
    this.saveToStorage();
    this.saveFolderToStorage();
    return this.workspace;
  }
}
