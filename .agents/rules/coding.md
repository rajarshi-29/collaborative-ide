# Coding Standards & Guidelines

This document outlines mandatory coding conventions, memory safety standards, and implementation practices for all JavaScript and React code in this project.

---

## 1. JavaScript & React 18 Standards

- **Functional Components & Hooks**: All components must be written as React functional components using standard hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`). Class components are prohibited.
- **Strict Hook Rules**:
  - Hooks must only be invoked at the top level of React functions.
  - Never call hooks inside loops, conditional statements, or nested functions.
  - Ensure dependency arrays in `useEffect` and `useCallback` include all referenced variables, or explicitly justify omissions with documentation comments.
- **Prop Drilling Avoidance**:
  - Prefer small focused components with direct responsibilities.
  - For shared cross-component state, use lightweight reactive stores (like `aiWidgetStore`) rather than passing props through 5+ intermediate layout layers.
- **Naming Conventions**:
  - Components: PascalCase (`DropletButton.jsx`, `ResearchPanel.jsx`).
  - Hooks: camelCase with `use` prefix (`useTerminalSession.js`).
  - Services / Stores: camelCase or PascalCase classes (`AIService.js`, `aiWidgetStore.js`).
  - Constants: UPPER_SNAKE_CASE (`DRAG_THRESHOLD`, `STORAGE_KEY`).
  - CSS Classes: kebab-case with component-specific namespaces (`droplet-orb`, `research-panel-header`).

---

## 2. Electron API Safety & Browser Fallbacks

Because the IDE can be run in desktop Electron mode or inspected in standard web browsers, all native OS capabilities must be guarded with fallbacks:

```javascript
// Correct pattern: Always guard native API access
export async function readWorkspaceFile(filePath) {
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.readFile) {
    try {
      return await window.electronAPI.readFile(filePath);
    } catch (err) {
      console.error(`Native file read failed: ${filePath}`, err);
      throw err;
    }
  }

  // Graceful fallback for non-Electron / browser development
  console.warn('Native electronAPI unavailable; using in-memory virtual storage');
  return virtualFileSystem.get(filePath) || '';
}
```

- Never call `window.electronAPI.someMethod()` without verifying that `window.electronAPI` exists.
- In renderer tests and headless runs, ensure fallbacks fail gracefully with clear diagnostic messages.

---

## 3. Event Listener Lifecycle & Memory Management

Improper event listener management causes severe memory leaks and zombie pointer sessions in long-running IDE sessions.

### Rule 1: Symmetrical Listener Cleanup
Any event listener attached to `window` or `document` inside a `useEffect` must be removed in the effect's cleanup return function:

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

### Rule 2: Imperative Drag Sessions
For interactive drag gestures (such as `DropletButton` or splitter handles):
- Register `pointermove` and `pointerup` on `window` inside `handlePointerDown`.
- Capture drag state in **local closure variables** or `useRef`, not component state.
- Always unregister both `pointermove` and `pointerup` immediately inside the `handlePointerUp` handler.
- If the component unmounts mid-drag, ensure `active = false` terminates any pending move callbacks.

---

## 4. Monaco Editor & Xterm.js Lifecycle

Heavy canvas and worker-based libraries (Monaco, Xterm) require strict lifecycle disposal:

- **Monaco Editor Models**: When a tab is closed, check if other tabs reference the same model URI. If not, dispose of the model using `model.dispose()` to prevent memory retention of large source code strings.
- **Editor Instance**: On unmount, call `editor.dispose()`.
- **Xterm Terminal**: Terminal instances, fit addons, and web-links addons must call `.dispose()` when their hosting tab or container unmounts.
- **Resize Observers**: Use `ResizeObserver` to trigger `editor.layout()` and `fitAddon.fit()`. Always call `observer.disconnect()` in the cleanup phase.

---

## 5. File System & Cross-Platform Paths

The project runs on both Windows and POSIX operating systems:
- Always handle both backslashes (`\`) and forward slashes (`/`) when parsing file paths.
- Normalize paths before comparing file IDs or tab keys:
  ```javascript
  const normalizePath = (p) => (p ? p.replace(/\\/g, '/').toLowerCase() : '');
  ```
- When creating files via Node FS in `electron/main.cjs`, ensure parent directories exist by passing `{ recursive: true }` to `fs.mkdirSync`.
