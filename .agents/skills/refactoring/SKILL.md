---
name: refactoring
description: >-
  Procedures and safety checklists for refactoring IDE components, extracting shared state stores,
  modularizing CSS, and reducing technical debt without introducing regressions.
---

# Safe Refactoring Runbook

This skill outlines safe, systematic procedures for refactoring code within the Collaborative IDE codebase while preserving behavioral integrity.

---

## 1. Pre-Refactoring Baseline Protocol

Before initiating any refactoring:
1. **Run the Existing Test Suite**:
   ```bash
   npx electron scratch/test_all_features.cjs
   ```
   Ensure all existing tests pass (`10/10`). Never refactor on a broken baseline.
2. **Review Component Dependencies**:
   Map out imports and exports across [App.jsx](file:///c:/Users/KIIT0001/atom-ide/src/App.jsx) and target components.

---

## 2. Key Refactoring Patterns

### Pattern A: Extracting Shared State into Reactive Stores
**Symptom**: Props are being drilled down 4+ layers, or two separate instances of a component exist (e.g. docked in sidebar vs floating in body) with desynchronized state.

**Solution**:
1. Create a dedicated store module: `src/components/<Feature>/<feature>Store.js`.
2. Implement a simple, dependency-free pub/sub pattern:
   ```javascript
   class FeatureStore {
     constructor() {
       this.state = { /* initial state */ };
       this.listeners = new Set();
     }
     getState = () => this.state;
     subscribe = (fn) => {
       this.listeners.add(fn);
       return () => this.listeners.delete(fn);
     };
     notify = () => this.listeners.forEach(fn => fn(this.state));
     update = (updater) => {
       this.state = typeof updater === 'function' ? updater(this.state) : { ...this.state, ...updater };
       this.notify();
     };
   }
   export const featureStore = new FeatureStore();
   ```
3. In components, subscribe via `useEffect` and `useState`.

### Pattern B: Decomposing Monolithic Components
**Symptom**: A single component file exceeds 300 lines or mixes layout, data fetching, business logic, and multiple modal states.

**Solution**:
1. Identify cohesive sub-regions (Header, Conversation Body, Input Area, Action Chips).
2. Extract sub-components into separate files in the same directory.
3. Pass clean, minimal props and callbacks.
4. Keep CSS rules modular in a dedicated stylesheet.

### Pattern C: Native IPC Encapsulation
**Symptom**: Raw `window.electronAPI.invoke(...)` calls are scattered across multiple UI components with duplicated try/catch blocks and missing web fallbacks.

**Solution**:
1. Wrap native IPC calls in a dedicated service singleton (e.g., `src/services/fileSystemService.js`).
2. Implement centralized error handling, path normalization, and in-memory browser fallbacks inside the service.
3. UI components import and call clean service methods (`await fileSystemService.openFolder()`).

---

## 3. Post-Refactoring Validation Protocol

1. **Build Validation**:
   ```bash
   npm run build
   ```
   Confirm zero compilation errors or bundling warnings.
2. **Feature-Specific Verification**:
   Execute feature test scripts to verify target functionality remains 100% operational.
3. **Comprehensive Regression Suite**:
   ```bash
   npx electron scratch/test_all_features.cjs
   ```
   Confirm all IDE features pass with zero regressions.
