---
name: testing
description: >-
  Procedures for authoring, running, and analyzing automated headless Electron end-to-end tests
  for the Collaborative IDE.
---

# Automated Headless Testing Runbook

This skill outlines how to create, run, and interpret headless Electron tests for the Collaborative IDE.

---

## 1. Test Architecture Overview

Because standard JSDOM test runners cannot execute Monaco Editor web workers, Xterm.js terminal canvases, or Electron IPC bridges, the project uses **Headless Electron Execution**:

- **Runtime**: An offscreen `BrowserWindow({ show: false })` executing `dist/index.html`.
- **Preload**: Real `electron/preload.cjs` bindings provide full native API integration.
- **Reporting**: Structured console logs with `✓ PASS` / `✗ FAIL`, a JSON test summary table, and PNG screenshot artifacts.

---

## 2. Step-by-Step Test Authoring Guide

### Step 1: Boilerplate Structure
Create a new test script in `scratch/test_<feature>.cjs`:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'electron/preload.cjs')
    }
  });

  const htmlPath = path.resolve(__dirname, 'dist/index.html');
  await win.loadFile(htmlPath);

  // Wait 1500ms for React hydration and Monaco editor initialization
  await new Promise(r => setTimeout(r, 1500));

  const results = { tests: [], screenshots: [] };

  function recordTest(name, passed, details) {
    results.tests.push({ name, passed, details });
    console.log(`[TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} (${details})`);
  }

  // --- Test Steps Here ---

  console.log('\n================ ALL TESTS COMPLETED ================');
  console.log(JSON.stringify(results, null, 2));
  app.quit();
});
```

### Step 2: Dispatching Synthetic User Events
Execute client interactions directly inside the renderer context via `win.webContents.executeJavaScript()`:

#### Clicking / Toggling Elements
```javascript
await win.webContents.executeJavaScript(`
  (() => {
    const btn = document.querySelector('button[title*="Run"]');
    if (btn) btn.click();
  })()
`);
await new Promise(r => setTimeout(r, 500));
```

#### Simulating Drag Gestures
```javascript
await win.webContents.executeJavaScript(`
  (() => {
    const target = document.querySelector('.droplet-docked-container');
    const rect = target.getBoundingClientRect();
    const startX = rect.left + 15;
    const startY = rect.top + 15;

    target.dispatchEvent(new PointerEvent('pointerdown', { clientX: startX, clientY: startY, button: 0, bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: startX + 50, clientY: startY + 50, bubbles: true }));
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: startX + 50, clientY: startY + 50, bubbles: true }));
  })()
`);
await new Promise(r => setTimeout(r, 600));
```

#### Typing into React 18 Controlled Inputs
```javascript
await win.webContents.executeJavaScript(`
  (() => {
    const textarea = document.querySelector('textarea.research-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(textarea, 'Analyze memory allocation');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  })()
`);
```

### Step 3: Capturing Screenshot Artifacts
Always capture visual evidence at key verification milestones:
```javascript
const image = await win.webContents.capturePage();
const screenPath = path.resolve(__dirname, 'scratch/feature_verification.png');
fs.writeFileSync(screenPath, image.toPNG());
results.screenshots.push(screenPath);
```

---

## 3. Running & Validating Tests

1. Ensure the production bundle is up-to-date:
   ```bash
   npm run build
   ```
2. Execute the test:
   ```bash
   npx electron scratch/test_<feature>.cjs
   ```
3. Run the comprehensive IDE regression suite:
   ```bash
   npx electron scratch/test_all_features.cjs
   ```
4. Verify all tests pass with exit code 0.
