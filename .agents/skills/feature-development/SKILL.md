---
name: feature-development
description: >-
  End-to-end workflow for designing, implementing, and integrating new features into the Collaborative IDE.
  Use when creating new panels, editor tools, floating widgets, modal dialogs, or collaboration extensions.
---

# Feature Development Runbook

This skill guides the design, implementation, and integration of new features into the Collaborative IDE. Follow this systematic process to ensure architectural cohesion, visual excellence, and zero regressions.

---

## Workflow Steps

### Step 1: Discovery & Architecture Alignment
1. **Analyze Existing Touchpoints**:
   - Inspect [App.jsx](file:///c:/Users/KIIT0001/atom-ide/src/App.jsx) to understand where the new feature mounts in the layout hierarchy (Header, Activity Bar, Sidebar, Editor Area, Bottom Drawer, or Floating Layer).
   - Determine if the feature requires native desktop capabilities (file system access, shell commands) via [electron/preload.cjs](file:///c:/Users/KIIT0001/atom-ide/electron/preload.cjs).
2. **Select the State Tier**:
   - *Local State*: If state is isolated to one component, use `useState` / `useRef`.
   - *Cross-Panel State*: If state is shared across multiple panes or portal layers, create or extend a lightweight reactive store (like `aiWidgetStore.js`) implementing `subscribe` and `getState`.
   - *Collaborative State*: If state must sync in real-time across peers, bind it to `Y.Doc` using shared types (`Y.Map`, `Y.Array`, `Y.Text`) via [collaborationService.js](file:///c:/Users/KIIT0001/atom-ide/src/services/collaborationService.js).

### Step 2: Design System & Styling
1. **Define Tokens**:
   - Use CSS custom properties from [themes.css](file:///c:/Users/KIIT0001/atom-ide/src/styles/themes.css) (`var(--bg-main)`, `var(--accent-primary)`, `var(--text-bright)`).
   - Never use TailwindCSS or hardcoded hex colors.
2. **Create Modular Stylesheets**:
   - Place dedicated styles in `src/styles/<feature_name>.css` and import into [index.css](file:///c:/Users/KIIT0001/atom-ide/src/styles/index.css).
   - Ensure all keyframe animations use GPU-accelerated properties (`transform`, `opacity`, `filter`).

### Step 3: Component Implementation
1. **Build Focused Sub-components**:
   - Structure new components in `src/components/<FeatureFolder>/`.
   - Provide clear prop contracts and default values.
   - For floating or draggable widgets, implement mathematical boundary clamping against viewport bounds:
     - Top $\ge 38\text{px}$ (Top Header)
     - Bottom $\le \text{window.innerHeight} - 70\text{px}$ (Status Bar)
     - Left $\ge 8\text{px}$, Right $\le \text{window.innerWidth} - \text{width} - 8\text{px}$.
2. **Mount via Portal when Necessary**:
   - For floating widgets or modals, use `ReactDOM.createPortal(..., document.body)` with `z-index: 10000+` to prevent clipping from parent `overflow: hidden` containers.

### Step 4: Build Verification
Run the production Vite build to verify clean bundling with zero syntax errors or unhandled imports:
```bash
npm run build
```

### Step 5: Automated Headless Electron Testing
Create and run a headless verification script in `scratch/test_<feature>.cjs`:
1. Launch Electron with `BrowserWindow({ show: false, webPreferences: { preload: ... } })`.
2. Load `dist/index.html`.
3. Dispatch synthetic interactions (`PointerEvent`, `Event('input')`).
4. Capture PNG screenshots of critical UI states and save to artifact directory.
5. Log structured JSON results and assert all test conditions pass.

### Step 6: Regression Verification
Run the comprehensive IDE regression suite before committing:
```bash
npx electron scratch/test_all_features.cjs
```
