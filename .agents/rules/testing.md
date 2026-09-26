# Automated Testing & Verification Rules

This document outlines mandatory testing protocols, headless Electron test authoring guidelines, and verification rules for the Collaborative IDE codebase.

---

## 1. Testing Philosophy: Evidence-Based Verification

- **Never Assume Working Code**: Every new feature, UI enhancement, or bug fix must be verified through automated execution before claiming completion.
- **Headless Electron Runtime**: Because the IDE uses Monaco Editor, Xterm.js, and Electron preload bridges, standard unit test runners (like Jest/JSDOM) fail to simulate real browser canvases and IPC channels accurately. Verification is performed by executing test scripts directly in Electron:
  ```bash
  npx electron <test_script.cjs>
  ```
- **Visual Evidence**: Tests must capture PNG screenshots of critical UI states and save them to the artifacts directory. Visual inspection confirms layout integrity, theme fidelity, and animation state.

---

## 2. Writing Headless Electron Test Scripts

Test scripts are written in CommonJS (`.cjs`) and follow this structure:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Headless execution
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'electron/preload.cjs')
    }
  });

  // Load the built production bundle
  const htmlPath = path.resolve(__dirname, 'dist/index.html');
  await win.loadFile(htmlPath);

  // Allow React and Monaco Editor to mount
  await new Promise(resolve => setTimeout(resolve, 1500));

  const results = { tests: [], screenshots: [] };

  function recordTest(name, passed, details) {
    results.tests.push({ name, passed, details });
    console.log(`[TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} (${details})`);
  }

  // Execute test steps...

  // Capture screenshot evidence
  const image = await win.webContents.capturePage();
  const screenPath = path.resolve(__dirname, 'feature_verified.png');
  fs.writeFileSync(screenPath, image.toPNG());
  results.screenshots.push(screenPath);

  console.log(JSON.stringify(results, null, 2));
  app.quit();
});
```

---

## 3. Synthetic Event Dispatching Patterns

### Pointer Events (Drag & Click)
To test draggable elements and contact-point click animations, dispatch realistic `PointerEvent` sequences:

```javascript
await win.webContents.executeJavaScript(`
  (() => {
    const el = document.querySelector('.droplet-docked-container');
    const rect = el.getBoundingClientRect();
    const startX = rect.left + 20;
    const startY = rect.top + 20;

    // 1. Pointer Down
    el.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: startX,
      clientY: startY,
      button: 0,
      bubbles: true
    }));

    // 2. Drag Move (past threshold)
    window.dispatchEvent(new PointerEvent('pointermove', {
      clientX: startX + 50,
      clientY: startY + 50,
      bubbles: true
    }));

    // 3. Pointer Up
    window.dispatchEvent(new PointerEvent('pointerup', {
      clientX: startX + 50,
      clientY: startY + 50,
      bubbles: true
    }));
  })()
`);
```

### React 18 Controlled Input Fields
Setting `input.value = "text"` directly will **not** trigger React's internal fiber state. You must use the prototype descriptor setter:

```javascript
await win.webContents.executeJavaScript(`
  (() => {
    const input = document.querySelector('input.search-input');
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeSetter.call(input, 'my-query');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()
`);
```

---

## 4. Regression Testing Protocol

Whenever modifying core files (`src/App.jsx`, `src/styles/`, `electron/`):
1. **Pre-Flight Build**: Run `npm run build` to verify module bundling and TypeScript/JSX syntax validity.
2. **Feature-Specific Verification**: Run the dedicated test script for the target feature.
3. **Regression Suite**: Run the comprehensive IDE regression suite:
   ```bash
   npx electron scratch/test_all_features.cjs
   ```
4. **Zero Tolerance for Failures**: Never push or conclude a task if any existing test fails.
