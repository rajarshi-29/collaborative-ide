---
name: debugging
description: >-
  Systematic diagnostic and debugging workflow for troubleshooting issues across Electron main process,
  IPC bridges, Monaco Editor, React state, Yjs collaboration, and CSS layout clipping.
---

# IDE Debugging & Diagnostics Runbook

This skill outlines systematic diagnostic procedures for identifying root causes and applying surgical fixes to bugs in the IDE.

---

## 1. Bug Classification Matrix

Identify the layer where the bug manifests:

| Symptom | Probable Layer | Key Inspection Points |
| :--- | :--- | :--- |
| **File I/O or Terminal hangs** | Electron Main Process | `electron/main.cjs`, IPC channel registration, child process exit codes |
| **Native API call returns undefined** | Preload Bridge | `electron/preload.cjs`, `contextBridge` white-list |
| **Component doesn't update on drag/click** | React State / Pointer Listeners | Component re-render scope, unmounted refs, listener cleanup |
| **Text disappears or won't type** | Monaco Editor / Controlled Input | Monaco model URI collisions, React 18 synthetic input fiber event binding |
| **Floating panel clipped or hidden** | CSS Stacking Context | Parent `overflow: hidden`, `z-index` stacking context, portal container |
| **Collaboration cursors don't sync** | WebRTC / Yjs Awareness | `provider.awareness`, room name matching, signaling server availability |

---

## 2. Diagnostic Procedure

### Step 1: Capture Terminal & Electron Logs
1. When running headless or dev servers, inspect process stdout/stderr for unhandled promise rejections:
   ```bash
   npx electron electron/main.cjs
   ```
2. In headless test scripts, listen to console events from the web contents:
   ```javascript
   win.webContents.on('console-message', (event, level, message, line, sourceId) => {
     console.log(`[RENDERER CONSOLE] (${level}) ${message} at ${sourceId}:${line}`);
   });
   ```

### Step 2: Reproduce via Headless Test Script
Write a minimal script in `scratch/debug_<issue>.cjs` that recreates the exact user action:
- Mount the window.
- Execute the sequence of user clicks/drags.
- Evaluate the DOM or inspect state using `win.webContents.executeJavaScript(...)`.
- Take a PNG screenshot to capture visual artifacts (e.g. clipping, overlaps, alignment errors).

### Step 3: Common Pitfalls & Solutions

#### 1. React 18 Input Dispatching in Tests
- **Issue**: Dispatching `new Event('input')` on an input does not update React's internal state.
- **Fix**: Use the native prototype property descriptor:
  ```javascript
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(inputElement, 'newValue');
  inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  ```

#### 2. Disjoint State Across Dual Component Mounts
- **Issue**: Mounting a docked slot in the sidebar and a floating portal at the root results in duplicate, disconnected state instances.
- **Fix**: Extract shared state into a centralized singleton store (`aiWidgetStore.js`) implementing `subscribe` and `getState`. Both component instances subscribe to the exact same state.

#### 3. CSS Stacking Context & Overflow Clipping
- **Issue**: Floating panels get clipped by the sidebar's `overflow-y: auto; overflow-x: hidden`.
- **Fix**: Use `ReactDOM.createPortal(element, document.body)` with `z-index: 10000+` and calculate coordinates using `anchorNode.getBoundingClientRect()`.

#### 4. Event Listener Detachment during Re-renders
- **Issue**: Dragging breaks mid-gesture when component re-renders.
- **Fix**: Store drag coordinates in local closure variables (`startX`, `startY`, `initialX`, `initialY`, `active`) rather than React state or mutable refs. Attach `pointermove` and `pointerup` to `window`.

### Step 4: Verification
After applying the fix:
1. Rebuild production bundle: `npm run build`
2. Run your reproduction test script.
3. Run the full regression suite: `npx electron scratch/test_all_features.cjs`
4. Inspect the updated screenshot to visually confirm resolution.
