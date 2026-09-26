---
name: performance-review
description: >-
  Procedures for analyzing and optimizing IDE runtime performance, Monaco Editor memory disposal,
  animation frame rates, React render thrashing, and Vite bundle splitting.
---

# Performance Review & Optimization Runbook

This skill outlines strategies for profiling, identifying bottlenecks, and optimizing runtime performance across the Collaborative IDE.

---

## 1. Key Performance Domains & Benchmarks

| Domain | Target Metric | High-Risk Failure Mode |
| :--- | :--- | :--- |
| **Animation Smoothness** | 60 FPS (16.6ms / frame) | Layout thrashing caused by animating `width`, `height`, `left`, `top` |
| **Drag Latency** | $< 8\text{ms}$ event response | React state updates triggered on every `pointermove` |
| **Monaco Memory** | $< 120\text{MB}$ heap overhead | Leaked text models when closing tabs |
| **Terminal Throughput** | 10,000+ lines / sec | Writing unbuffered chunks directly to Xterm.js |
| **Bundle Size** | Minimal initial load | Large monolithic chunks (>1MB) without code splitting |

---

## 2. Optimization Protocols

### Protocol 1: CSS Animation & Compositor Optimization
1. **Compositor Isolation**: Ensure all keyframes only animate `transform`, `opacity`, or `filter`.
2. **Layer Promotion**: Apply `will-change: transform, border-radius;` to floating or morphing elements (such as `droplet-orb`).
3. **No Dynamic Geometry Recalculation**: Avoid calling `getBoundingClientRect()` inside tight animation loops or `pointermove` handlers. Measure geometry once during `pointerdown` and compute offsets mathematically.

### Protocol 2: Drag Event Debouncing & Closure Capture
Never invoke `setState` on every raw `pointermove` event if the update can be buffered or if the component would re-render subtrees unnecessarily:
- In `DropletButton.jsx`: Capture coordinates in local closure variables (`startX`, `startY`, `initialX`, `initialY`).
- Update position only when distance exceeds `DRAG_THRESHOLD`.
- Clamp mathematically using pre-measured constants rather than querying DOM nodes on every tick.

### Protocol 3: Monaco Editor & Worker Memory Management
When tabs are opened and closed rapidly, Monaco text models accumulate in memory:
1. Always check if a model URI is still open in any editor tab.
2. If the file is closed and no other tab references it, call `model.dispose()`.
3. Dispose of Monaco Editor instances (`editor.dispose()`) when split panes or editor containers unmount.

### Protocol 4: Terminal Stream Buffering
When running high-volume CLI commands (such as `npm run build` or verbose tests):
1. Buffer incoming chunks in memory or debounce writes to Xterm.js using `requestAnimationFrame` if the data rate exceeds 60 chunks/sec.
2. Debounce `fitAddon.fit()` during window resizing with a 100ms timer to prevent continuous layout thrashing.

### Protocol 5: Bundle Splitting & Vite Optimization
In [vite.config.js](file:///c:/Users/KIIT0001/atom-ide/vite.config.js), configure Rollup's `manualChunks` to split heavy libraries:
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['@monaco-editor/react', 'monaco-editor'],
          xterm: ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links'],
          collaboration: ['yjs', 'y-webrtc', 'y-monaco']
        }
      }
    }
  }
});
```

---

## 3. Performance Validation Checklist

- [ ] Does dragging the floating AI droplet maintain 60 FPS without cursor lag?
- [ ] Does opening and closing 20 tabs release memory without heap accumulation?
- [ ] Does terminal streaming remain responsive during multi-megabyte command outputs?
- [ ] Does `npm run build` complete with minimal chunk size warnings?
- [ ] Do automated tests complete under normal execution thresholds?
