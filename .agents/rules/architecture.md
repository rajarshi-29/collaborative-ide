# Architecture Rules & System Boundaries

This document defines the architectural guidelines, system boundaries, and design principles for the Collaborative IDE codebase. All agent actions and code modifications must adhere to these standards.

---

## 1. Process Architecture & Boundaries

The IDE is built on **Electron**, **React 18**, and **Vite**. The codebase enforces strict separation of concerns across three distinct execution layers:

```
┌────────────────────────────────────────────────────────┐
│               Electron Main Process                    │
│   (electron/main.cjs - Node.js, OS API, FS, PTY Shell) │
└──────────────────────────┬─────────────────────────────┘
                           │ IPC Channels (Invoke / Handle)
┌──────────────────────────▼─────────────────────────────┐
│                 Preload Bridge Layer                   │
│      (electron/preload.cjs - contextBridge.expose)     │
└──────────────────────────┬─────────────────────────────┘
                           │ window.electronAPI
┌──────────────────────────▼─────────────────────────────┐
│                React Renderer Process                  │
│       (src/App.jsx, Monaco Editor, Xterm, Yjs)         │
└────────────────────────────────────────────────────────┘
```

### Main Process (`electron/main.cjs`)
- Responsible for native OS windows, native file system dialogues, direct disk I/O, child process execution, and system-level operations.
- Must **never** contain UI logic or direct DOM references.
- IPC handlers must use `ipcMain.handle()` to support asynchronous request-response semantics.
- Always validate and sanitize all file paths and arguments received from renderer processes to prevent path traversal vulnerabilities.

### Preload Script (`electron/preload.cjs`)
- Serves as the secure, context-isolated bridge between Node.js and the Web Renderer.
- Must enforce `contextIsolation: true` and `nodeIntegration: false`.
- Only expose explicitly white-listed methods via `contextBridge.exposeInMainWorld('electronAPI', { ... })`.
- Never expose raw `ipcRenderer`, `require`, or `child_process` directly to the `window` object.

### Renderer Process (`src/`)
- Pure React 18 Single Page Application compiled via Vite.
- Must access native capabilities exclusively through `window.electronAPI`.
- Always provide graceful fallback mechanisms (in-memory mock storage, browser file picker, mock shell) when running in standard browser environments where `window.electronAPI` is undefined.

---

## 2. State Architecture & Single Sources of Truth

To ensure peak rendering performance across split panels, terminal buffers, Monaco editor canvases, and real-time collaboration sessions, the state is categorized into three tiers:

### 1. Local Component State (`useState`, `useRef`)
- Use for transient UI state: dropdown visibility, hover states, input text buffer, active tabs within a single component.
- Drag sessions must capture coordinates in local closure variables or `useRef` to prevent re-render thrashing during 60 FPS pointer moves.

### 2. Domain Service Singletons & Reactive Stores
- Dedicated domain services encapsulate business logic and shared cross-panel state:
  - `aiWidgetStore`: Manages AI research droplet state (`isDetached`, `position`, `isOpen`, `history`, `isResearching`). Single source of truth shared between the Explorer mount and the floating body portal.
  - `AIService`: Manages LLM client configuration, provider routing (Google AI, Groq, DeepSeek, Ollama), prompt templating, and streaming generation.
  - `CodeRunnerService`: Manages terminal sessions, process execution queues, and command routing.
  - `CollaborationService`: Manages room subscriptions, peer awareness, and user identity.
- Stores implement a clean publish-subscribe pattern (`subscribe(callback)`) with `getState()` and immutable updates.

### 3. Collaborative CRDT State (`Yjs`)
- Shared document state (collaborative editor buffer) is managed exclusively through `Y.Doc`.
- Provider: `WebrtcProvider` (`y-webrtc`) manages peer-to-peer WebRTC mesh connections with room signaling.
- Binding: `MonacoBinding` (`y-monaco`) synchronizes Monaco Editor text models with the CRDT text type (`yText`).
- Awareness: Remote cursor positions, selections, and user profiles (name, color, avatar) sync via `provider.awareness`.

---

## 3. UI Layout & Split Panes Hierarchy

The IDE layout follows an explicit spatial hierarchy:

1. **Top Header Bar (`38px`)**: Window title, workspace folder button, active document breadcrumbs, collaboration room status, code runner controls, and theme selector.
2. **Activity Bar (`48px` left)**: Primary navigation icons (Explorer, Search, Collaborators, Terminal toggle, AI Sidecar, Settings).
3. **Left Sidebar (`resizable, 200px - 500px`)**: Conditionally renders `FileTree`, `SearchPanel`, or `CollaboratorsPanel`.
4. **Main Editor Canvas (`flex: 1`)**:
   - Tab Bar (`EditorTabs.jsx`): Reorderable, closeable tabs with dirty-state indicators.
   - Monaco Editor: Full-featured Monaco editor instance with syntax highlighting, line numbers, and minimap.
5. **Bottom Drawer (`resizable, 150px - 500px`)**: Tabbed container housing Xterm.js Terminal, Run Output console, and Problems linter feed.
6. **Right Sidecar (`320px - 450px`)**: Collapsible AI Chat and Code Assistant with voice input capabilities.
7. **Floating Portals (`z-index: 10000+`)**: Modals and floating widgets (such as `AIResearchWidget`) are mounted via `ReactDOM.createPortal(..., document.body)` to avoid clipping from container `overflow: hidden`.
8. **Status Bar (`22px` bottom)**: Git branch, connection health, cursor coordinates (Ln, Col), encoding, indent spaces, and language mode.

---

## 4. Boundary Protection & Viewport Clamping

Any floating, draggable, or popover element must implement mathematical viewport clamping:
- **Left Margin**: $\ge 8\text{px}$
- **Right Margin**: $\le \text{window.innerWidth} - \text{elementWidth} - 8\text{px}$
- **Top Margin**: $\ge 38\text{px}$ (strictly protects the Top Header Bar)
- **Bottom Margin**: $\le \text{window.innerHeight} - 26\text{px} - \text{elementHeight}$ (strictly protects the Status Bar)
- **Window Resizing**: Floating components must subscribe to `window.addEventListener('resize')` to recalculate and clamp their positions whenever the window bounds change.
