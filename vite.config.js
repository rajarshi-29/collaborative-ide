import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['@monaco-editor/react', 'monaco-editor'],
          xterm: ['@xterm/xterm', '@xterm/addon-fit'],
          collab: ['yjs', 'y-webrtc', 'y-monaco'],
          vendor: ['react', 'react-dom', 'lucide-react']
        }
      }
    }
  }
});
