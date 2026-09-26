const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_INVOKE_CHANNELS = new Set([
  'dialog:openDirectory',
  'dialog:openFile',
  'fs:readFile',
  'fs:writeFile',
  'fs:createFile',
  'fs:createDirectory',
  'fs:deleteItem',
  'fs:searchFiles',
  'exec:runFile',
  'exec:runCommand'
]);

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Whitelisted invoke bridge for backward compatibility
  invoke: (channel, ...args) => {
    if (ALLOWED_INVOKE_CHANNELS.has(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Unauthorized IPC channel: ${channel}`));
  },

  // Strongly-typed direct helpers
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (fullPath) => ipcRenderer.invoke('fs:readFile', fullPath),
  writeFile: (fullPath, content) => ipcRenderer.invoke('fs:writeFile', { fullPath, content }),
  createFile: (parentFullPath, fileName) => ipcRenderer.invoke('fs:createFile', { parentFullPath, fileName }),
  createDirectory: (parentFullPath, folderName) => ipcRenderer.invoke('fs:createDirectory', { parentFullPath, folderName }),
  deleteItem: (fullPath) => ipcRenderer.invoke('fs:deleteItem', fullPath),
  searchFiles: (params) => ipcRenderer.invoke('fs:searchFiles', params),
  runFile: (fullPath, language) => ipcRenderer.invoke('exec:runFile', { fullPath, language }),
  runCommand: (command, cwd) => ipcRenderer.invoke('exec:runCommand', { command, cwd })
});

